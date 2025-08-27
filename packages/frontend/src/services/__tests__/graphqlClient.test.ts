import { GraphQLClient, GraphQLClientError } from "../graphqlClient";
import { authService } from "../authService";
import { clientLogger } from "../clientLogger";

// Mock dependencies
jest.mock("../authService", () => ({
  authService: {
    getAuthHeaders: jest.fn(),
  },
}));

jest.mock("../clientLogger", () => ({
  clientLogger: {
    logApiCall: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe("GraphQLClient", () => {
  let client: GraphQLClient;
  const mockAuthHeaders = {
    "Content-Type": "application/json",
    Authorization: "Bearer token",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getAuthHeaders as jest.Mock).mockReturnValue(mockAuthHeaders);
    client = new GraphQLClient("http://localhost:4000/graphql");
  });

  describe("Successful Requests", () => {
    it("should execute query successfully", async () => {
      const mockResponse = {
        data: { users: [{ id: "1", name: "John" }] },
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.query("query GetUsers { users { id name } }");

      expect(result).toEqual({ users: [{ id: "1", name: "John" }] });
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:4000/graphql",
        expect.objectContaining({
          method: "POST",
          headers: mockAuthHeaders,
          body: JSON.stringify({
            query: "query GetUsers { users { id name } }",
            variables: undefined,
          }),
        })
      );
    });

    it("should execute mutation successfully", async () => {
      const mockResponse = {
        data: { createUser: { id: "1", name: "John" } },
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const variables = { name: "John" };
      const result = await client.mutate(
        "mutation CreateUser($name: String!) { createUser(name: $name) { id name } }",
        variables
      );

      expect(result).toEqual({ createUser: { id: "1", name: "John" } });
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:4000/graphql",
        expect.objectContaining({
          body: JSON.stringify({
            query:
              "mutation CreateUser($name: String!) { createUser(name: $name) { id name } }",
            variables,
          }),
        })
      );
    });

    it("should log successful API calls", async () => {
      const mockResponse = { data: { test: "success" } };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.query("query Test { test }");

      expect(clientLogger.logApiCall).toHaveBeenCalledWith(
        "POST",
        "http://localhost:4000/graphql",
        200,
        expect.any(Number)
      );
    });
  });

  describe("GraphQL Errors", () => {
    it("should handle GraphQL errors", async () => {
      const mockResponse = {
        errors: [
          {
            message: "User not found",
            path: ["user"],
            extensions: { code: "NOT_FOUND" },
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(client.query("query GetUser { user }")).rejects.toThrow(
        GraphQLClientError
      );

      try {
        await client.query("query GetUser { user }");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLClientError);
        expect((error as GraphQLClientError).message).toBe("User not found");
        expect((error as GraphQLClientError).graphqlErrors).toHaveLength(1);
        expect((error as GraphQLClientError).isGraphQLError).toBe(true);
      }
    });

    it("should handle multiple GraphQL errors", async () => {
      const mockResponse = {
        errors: [
          { message: "Error 1", path: ["field1"] },
          { message: "Error 2", path: ["field2"] },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      try {
        await client.query("query Test { test }");
      } catch (error) {
        expect((error as GraphQLClientError).message).toBe(
          "Multiple errors occurred:\n- Error 1\n- Error 2"
        );
      }
    });

    it("should identify authentication errors", async () => {
      const mockResponse = {
        errors: [
          {
            message: "Authentication required",
            extensions: { code: "UNAUTHENTICATED" },
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      try {
        await client.query("query Test { test }");
      } catch (error) {
        expect((error as GraphQLClientError).isAuthenticationError).toBe(true);
        expect((error as GraphQLClientError).isAuthorizationError).toBe(false);
        expect((error as GraphQLClientError).isValidationError).toBe(false);
      }
    });

    it("should identify authorization errors", async () => {
      const mockResponse = {
        errors: [
          {
            message: "Insufficient permissions",
            extensions: { code: "FORBIDDEN" },
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      try {
        await client.query("query Test { test }");
      } catch (error) {
        expect((error as GraphQLClientError).isAuthorizationError).toBe(true);
        expect((error as GraphQLClientError).isAuthenticationError).toBe(false);
      }
    });

    it("should identify validation errors", async () => {
      const mockResponse = {
        errors: [
          {
            message: "Invalid input",
            extensions: { code: "BAD_USER_INPUT" },
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      try {
        await client.query("query Test { test }");
      } catch (error) {
        expect((error as GraphQLClientError).isValidationError).toBe(true);
      }
    });
  });

  describe("Network Errors", () => {
    it("should handle network errors", async () => {
      (fetch as jest.Mock).mockRejectedValue(new TypeError("Failed to fetch"));

      try {
        await client.query("query Test { test }");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLClientError);
        expect((error as GraphQLClientError).message).toBe(
          "Unable to connect to GraphQL server. Please check your connection."
        );
        expect((error as GraphQLClientError).isNetworkError).toBe(true);
      }
    });

    it("should handle HTTP errors", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: "Server error" } }),
      });

      try {
        await client.query("query Test { test }");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLClientError);
        expect((error as GraphQLClientError).message).toBe("Server error");
      }
    });

    it("should handle timeout errors", async () => {
      jest.useFakeTimers();

      (fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 35000))
      );

      const client = new GraphQLClient("http://localhost:4000/graphql", {
        timeout: 1000,
      });

      const queryPromise = client.query("query Test { test }");

      jest.advanceTimersByTime(1000);

      await expect(queryPromise).rejects.toThrow(
        "GraphQL request timed out after 1000ms"
      );

      jest.useRealTimers();
    });
  });

  describe("Retry Logic", () => {
    it("should retry on network errors", async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { test: "success" } }),
        });

      const client = new GraphQLClient("http://localhost:4000/graphql", {
        retries: 2,
        retryDelay: 10,
      });

      const result = await client.query("query Test { test }");

      expect(result).toEqual({ test: "success" });
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(clientLogger.warn).toHaveBeenCalledWith(
        "GraphQL query retry attempt 1",
        expect.any(Object)
      );
    });

    it("should retry on server errors", async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { test: "success" } }),
        });

      const client = new GraphQLClient("http://localhost:4000/graphql", {
        retries: 2,
        retryDelay: 10,
      });

      const result = await client.query("query Test { test }");

      expect(result).toEqual({ test: "success" });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("should not retry on authentication errors", async () => {
      const mockResponse = {
        errors: [
          {
            message: "Authentication required",
            extensions: { code: "UNAUTHENTICATED" },
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const client = new GraphQLClient("http://localhost:4000/graphql", {
        retries: 3,
      });

      await expect(client.query("query Test { test }")).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should not retry on validation errors", async () => {
      const mockResponse = {
        errors: [
          {
            message: "Invalid input",
            extensions: { code: "BAD_USER_INPUT" },
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const client = new GraphQLClient("http://localhost:4000/graphql", {
        retries: 3,
      });

      await expect(client.query("query Test { test }")).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should stop retrying after max attempts", async () => {
      (fetch as jest.Mock).mockRejectedValue(new TypeError("Failed to fetch"));

      const client = new GraphQLClient("http://localhost:4000/graphql", {
        retries: 2,
        retryDelay: 10,
      });

      await expect(client.query("query Test { test }")).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Callbacks", () => {
    it("should call onRequest callback", async () => {
      const onRequest = jest.fn();
      const client = new GraphQLClient("http://localhost:4000/graphql", {
        onRequest,
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { test: "success" } }),
      });

      const variables = { id: "1" };
      await client.query(
        "query GetUser($id: ID!) { user(id: $id) }",
        variables,
        "GetUser"
      );

      expect(onRequest).toHaveBeenCalledWith("GetUser", variables);
    });

    it("should call onResponse callback", async () => {
      const onResponse = jest.fn();
      const client = new GraphQLClient("http://localhost:4000/graphql", {
        onResponse,
      });

      const mockData = { test: "success" };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      });

      await client.query("query Test { test }", undefined, "Test");

      expect(onResponse).toHaveBeenCalledWith(
        "Test",
        mockData,
        expect.any(Number)
      );
    });

    it("should call onError callback", async () => {
      const onError = jest.fn();
      const client = new GraphQLClient("http://localhost:4000/graphql", {
        onError,
      });

      (fetch as jest.Mock).mockRejectedValue(new TypeError("Failed to fetch"));

      try {
        await client.query("query Test { test }");
      } catch (error) {
        expect(onError).toHaveBeenCalledWith(error);
      }
    });
  });

  describe("Health Check", () => {
    it("should return true for healthy server", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { __typename: "Query" } }),
      });

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it("should return false for unhealthy server", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Connection failed"));

      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe("Configuration", () => {
    it("should return client configuration", () => {
      const options = {
        timeout: 5000,
        retries: 2,
      };
      const client = new GraphQLClient(
        "http://localhost:4000/graphql",
        options
      );

      const config = client.getConfig();
      expect(config.baseUrl).toBe("http://localhost:4000/graphql");
      expect(config.options).toMatchObject(options);
    });
  });

  describe("Operation Name Extraction", () => {
    it("should extract operation name from query", async () => {
      const onRequest = jest.fn();
      const client = new GraphQLClient("http://localhost:4000/graphql", {
        onRequest,
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { users: [] } }),
      });

      await client.query("query GetUsers { users { id } }");

      expect(onRequest).toHaveBeenCalledWith("GetUsers", undefined);
    });

    it("should extract operation name from mutation", async () => {
      const onRequest = jest.fn();
      const client = new GraphQLClient("http://localhost:4000/graphql", {
        onRequest,
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { createUser: { id: "1" } } }),
      });

      await client.mutate("mutation CreateUser { createUser { id } }");

      expect(onRequest).toHaveBeenCalledWith("CreateUser", undefined);
    });

    it("should use 'unknown' for queries without operation name", async () => {
      const onRequest = jest.fn();
      const client = new GraphQLClient("http://localhost:4000/graphql", {
        onRequest,
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { users: [] } }),
      });

      await client.query("{ users { id } }");

      expect(onRequest).toHaveBeenCalledWith("unknown", undefined);
    });
  });
});
