import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { AuthProvider, useAuth } from "../AuthContext";
import { authService } from "../../services/authService";
import { UserRole } from "@restaurant-reservation/shared";

// Mock the auth service
vi.mock("../../services/authService", () => ({
  authService: {
    getToken: vi.fn(),
    validateToken: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
  },
}));

const mockAuthService = authService as any;

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading() ? "loading" : "not-loading"}</div>
      <div data-testid="authenticated">
        {isAuthenticated() ? "authenticated" : "not-authenticated"}
      </div>
      <div data-testid="user">{user()?.username || "no-user"}</div>
      <button onClick={() => login("testuser", "password")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getToken.mockReturnValue(null);
  });

  it("should provide initial unauthenticated state", async () => {
    render(() => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    ));

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent(
      "not-authenticated"
    );
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
  });

  it("should validate existing token on mount", async () => {
    const mockUser = {
      id: "user-1",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    mockAuthService.getToken.mockReturnValue("existing-token");
    mockAuthService.validateToken.mockResolvedValue(mockUser);

    render(() => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    ));

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent(
      "authenticated"
    );
    expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    expect(mockAuthService.validateToken).toHaveBeenCalledWith(
      "existing-token"
    );
  });

  it("should handle token validation failure", async () => {
    mockAuthService.getToken.mockReturnValue("invalid-token");
    mockAuthService.validateToken.mockRejectedValue(new Error("Invalid token"));

    render(() => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    ));

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent(
      "not-authenticated"
    );
    expect(mockAuthService.removeToken).toHaveBeenCalled();
  });

  it("should handle successful login", async () => {
    const mockAuthResponse = {
      token: "new-token",
      user: {
        id: "user-1",
        username: "testuser",
        role: UserRole.EMPLOYEE,
      },
      expiresIn: 3600,
    };

    mockAuthService.login.mockResolvedValue(mockAuthResponse);

    render(() => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    ));

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
    });

    const loginButton = screen.getByText("Login");
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "authenticated"
      );
    });

    expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    expect(mockAuthService.login).toHaveBeenCalledWith({
      username: "testuser",
      password: "password",
    });
    expect(mockAuthService.setToken).toHaveBeenCalledWith("new-token", 3600);
  });

  it("should handle login failure", async () => {
    mockAuthService.login.mockRejectedValue(new Error("Login failed"));

    render(() => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    ));

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
    });

    const loginButton = screen.getByText("Login");

    // Wrap the click in a try-catch to handle the expected error
    try {
      loginButton.click();
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
      });
    } catch (error) {
      expect(error).toEqual(new Error("Login failed"));
    }

    expect(screen.getByTestId("authenticated")).toHaveTextContent(
      "not-authenticated"
    );
  });

  it("should handle logout", async () => {
    // First set up authenticated state
    const mockUser = {
      id: "user-1",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    mockAuthService.getToken.mockReturnValue("existing-token");
    mockAuthService.validateToken.mockResolvedValue(mockUser);
    mockAuthService.logout.mockResolvedValue(undefined);

    render(() => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    ));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "authenticated"
      );
    });

    const logoutButton = screen.getByText("Logout");
    logoutButton.click();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "not-authenticated"
      );
    });

    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockAuthService.removeToken).toHaveBeenCalled();
  });

  it("should handle logout failure gracefully", async () => {
    // Set up authenticated state
    const mockUser = {
      id: "user-1",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    mockAuthService.getToken.mockReturnValue("existing-token");
    mockAuthService.validateToken.mockResolvedValue(mockUser);
    mockAuthService.logout.mockRejectedValue(new Error("Logout failed"));

    render(() => (
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    ));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "authenticated"
      );
    });

    const logoutButton = screen.getByText("Logout");
    logoutButton.click();

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "not-authenticated"
      );
    });

    // Should still clear local state even if server logout fails
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    expect(mockAuthService.removeToken).toHaveBeenCalled();
  });

  it("should throw error when useAuth is used outside provider", () => {
    expect(() => {
      render(() => <TestComponent />);
    }).toThrow("useAuth must be used within an AuthProvider");
  });
});
