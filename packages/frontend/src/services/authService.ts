import {
  LoginRequest,
  AuthResponse,
  UserInfo,
} from "@restaurant-reservation/shared";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "auth_token";
const TOKEN_EXPIRY_KEY = "auth_token_expiry";

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

class AuthService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    // Initialize token and expiry from localStorage
    this.token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    this.tokenExpiry = expiry ? parseInt(expiry, 10) : null;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        const authError: AuthError = {
          message: errorMessage,
          status: response.status,
        };

        throw authError;
      }

      const authResponse: AuthResponse = await response.json();
      return authResponse;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw {
          message: "Unable to connect to server. Please check your connection.",
          code: "NETWORK_ERROR",
        } as AuthError;
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (!this.token) return;

    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout request failed:", error);
      // Continue with local logout even if server request fails
    }
  }

  async validateToken(token: string): Promise<UserInfo> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Token validation failed");
      }

      const userInfo: UserInfo = await response.json();
      return userInfo;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Unable to connect to server for token validation");
      }
      throw error;
    }
  }

  setToken(token: string, expiresIn?: number): void {
    this.token = token;
    localStorage.setItem(TOKEN_KEY, token);

    if (expiresIn) {
      // Calculate expiry time (current time + expiresIn seconds)
      this.tokenExpiry = Date.now() + expiresIn * 1000;
      localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry.toString());
    }
  }

  getToken(): string | null {
    // Check if token is expired
    if (this.token && this.tokenExpiry && Date.now() > this.tokenExpiry) {
      this.removeToken();
      return null;
    }
    return this.token;
  }

  removeToken(): void {
    this.token = null;
    this.tokenExpiry = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  isTokenExpired(): boolean {
    if (!this.token || !this.tokenExpiry) {
      return true;
    }
    return Date.now() > this.tokenExpiry;
  }

  getTokenExpiryTime(): number | null {
    return this.tokenExpiry;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }
}

export const authService = new AuthService();
