import { createSignal, createEffect } from "solid-js";
import { authService } from "../services/authService";
import { useMutation, useLazyQuery } from "./useApollo";
import { LOGIN_MUTATION, ME_QUERY } from "../services/graphql/queries";
import {
  LoginInput,
  User,
  LoginMutationResult,
  MeQueryResult,
} from "../types/graphql";

export function useAuth() {
  const [user, setUser] = createSignal<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  // Login mutation
  const {
    mutate: loginMutation,
    loading: loginLoading,
    error: loginError,
  } = useMutation<LoginMutationResult>(LOGIN_MUTATION);

  // Get current user query
  const {
    execute: getCurrentUser,
    data: userData,
    loading: userLoading,
  } = useLazyQuery<MeQueryResult>(ME_QUERY);

  // Initialize auth state
  createEffect(async () => {
    const token = authService.getToken();
    if (token) {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
        authService.removeToken();
      }
    }
    setIsLoading(false);
  });

  const login = async (credentials: LoginInput) => {
    try {
      const result = await loginMutation({
        variables: { input: credentials },
      });

      if (result.data?.login) {
        const { token, user: loggedInUser, expiresIn } = result.data.login;
        authService.setToken(token, expiresIn);
        setUser(loggedInUser);
        setIsAuthenticated(true);
        return loggedInUser;
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      const result = await getCurrentUser();
      if (result?.data?.me) {
        setUser(result.data.me);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading: () => isLoading() || loginLoading() || userLoading(),
    loginError,
    login,
    logout,
    refreshUser,
  };
}
