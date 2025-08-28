import { graphqlClient } from "./apolloClient";
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  VALIDATE_TOKEN_QUERY,
  ME_QUERY,
} from "./graphql/queries";
import {
  LoginInput,
  AuthPayload,
  User,
  LoginMutationResult,
  LogoutMutationResult,
  ValidateTokenQueryResult,
  MeQueryResult,
} from "../types/graphql";

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

  async login(credentials: LoginInput): Promise<AuthPayload> {
    try {
      const data = await graphqlClient.request<LoginMutationResult>(
        LOGIN_MUTATION,
        { input: credentials }
      );

      if (!data?.login) {
        throw new Error("Login failed: No data received");
      }

      const authPayload = data.login;

      // Store token locally
      this.setToken(authPayload.token, authPayload.expiresIn);

      return authPayload;
    } catch (error: any) {
      if (error.networkError) {
        throw {
          message: "Unable to connect to server. Please check your connection.",
          code: "NETWORK_ERROR",
        } as AuthError;
      }

      if (error.graphQLErrors?.length > 0) {
        throw {
          message: error.graphQLErrors[0].message,
          code: error.graphQLErrors[0].extensions?.code,
        } as AuthError;
      }

      throw {
        message: error.message || "Login failed",
        code: "UNKNOWN_ERROR",
      } as AuthError;
    }
  }

  async logout(): Promise<void> {
    if (!this.token) return;

    try {
      await graphqlClient.request<LogoutMutationResult>(LOGOUT_MUTATION);
    } catch (error) {
      console.error("Logout request failed:", error);
      // Continue with local logout even if server request fails
    } finally {
      // Always clear local token
      this.removeToken();
      // Clear any cached data if needed
    }
  }

  async validateToken(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const data = await graphqlClient.request<ValidateTokenQueryResult>(
        VALIDATE_TOKEN_QUERY
      );

      if (data?.validateToken?.valid && data.validateToken.user) {
        return data.validateToken.user;
      }

      // Token is invalid, remove it
      this.removeToken();
      return null;
    } catch (error) {
      console.error("Token validation failed:", error);
      this.removeToken();
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const data = await graphqlClient.request<MeQueryResult>(ME_QUERY);

      return data?.me || null;
    } catch (error) {
      console.error("Get current user failed:", error);
      return null;
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
