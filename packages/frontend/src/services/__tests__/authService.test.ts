import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService, AuthError } from "../authService";
import {
  AuthResponse,
  UserInfo,
  UserRole,
} from "@restaurant-reservation/shared";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Clear any existing tokens
    authService.removeToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    const mockCredentials = { username: "testuser", password: "password123" };
    const mockAuthResponse: AuthResponse = {
      token: "mock-jwt-token",
      user: {
        id: "user-1",
        username: "testuser",
        role: UserRole.EMPLOYEE,
      },
      expiresIn: 3600,
    };

    it("should successfully login with valid credentials", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAuthResponse),
      });

      const result = await authService.login(mockCredentials);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mockCredentials),
        }
      );
      expect(result).toEqual(mockAuthResponse);
    });

    it("should throw error for invalid credentials", async () => {
      const errorResponse = { message: "Invalid credentials" };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(authService.login(mockCredentials)).rejects.toEqual({
        message: "Invalid credentials",
        status: 401,
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(authService.login(mockCredentials)).rejects.toEqual({
        message: "Unable to connect to server. Please check your connection.",
        code: "NETWORK_ERROR",
      });
    });

    it("should handle non-JSON error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("Not JSON")),
      });

      await expect(authService.login(mockCredentials)).rejects.toEqual({
        message: "Internal Server Error",
        status: 500,
      });
    });
  });

  describe("logout", () => {
    it("should call logout endpoint when token exists", async () => {
      // Set up token
      authService.setToken("mock-token");

      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await authService.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/auth/logout",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should not call endpoint when no token exists", async () => {
      // Ensure no token is set
      authService.removeToken();
      await authService.logout();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle logout endpoint errors gracefully", async () => {
      authService.setToken("mock-token");
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Should not throw
      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  describe("validateToken", () => {
    const mockUserInfo: UserInfo = {
      id: "user-1",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    it("should validate token successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      });

      const result = await authService.validateToken("mock-token");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/auth/validate",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockUserInfo);
    });

    it("should throw error for invalid token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(authService.validateToken("invalid-token")).rejects.toThrow(
        "Token validation failed"
      );
    });

    it("should handle network errors during validation", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(authService.validateToken("mock-token")).rejects.toThrow(
        "Unable to connect to server for token validation"
      );
    });
  });

  describe("token management", () => {
    it("should set and get token", () => {
      const token = "mock-jwt-token";
      authService.setToken(token);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "auth_token",
        token
      );
      expect(authService.getToken()).toBe(token);
    });

    it("should set token with expiry", () => {
      const token = "mock-jwt-token";
      const expiresIn = 3600; // 1 hour
      const now = Date.now();

      vi.spyOn(Date, "now").mockReturnValue(now);

      authService.setToken(token, expiresIn);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "auth_token",
        token
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "auth_token_expiry",
        (now + expiresIn * 1000).toString()
      );
    });

    it("should remove expired token", () => {
      const token = "mock-jwt-token";
      const pastTime = Date.now() - 1000; // 1 second ago

      // Mock localStorage to return expired token
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "auth_token") return token;
        if (key === "auth_token_expiry") return pastTime.toString();
        return null;
      });

      // Create new instance to trigger constructor
      const newAuthService = new (authService.constructor as any)();

      expect(newAuthService.getToken()).toBeNull();
    });

    it("should remove token and expiry", () => {
      authService.removeToken();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("auth_token");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "auth_token_expiry"
      );
      expect(authService.getToken()).toBeNull();
    });

    it("should check if token is expired", () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      authService.setToken("token", 3600);

      expect(authService.isTokenExpired()).toBe(false);

      // Mock past expiry
      vi.spyOn(Date, "now").mockReturnValue(futureTime + 1000);
      expect(authService.isTokenExpired()).toBe(true);
    });
  });

  describe("getAuthHeaders", () => {
    it("should return headers with token", () => {
      authService.setToken("mock-token");

      const headers = authService.getAuthHeaders();

      expect(headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer mock-token",
      });
    });

    it("should return headers without token when not authenticated", () => {
      authService.removeToken();

      const headers = authService.getAuthHeaders();

      expect(headers).toEqual({
        "Content-Type": "application/json",
      });
    });
  });
});
