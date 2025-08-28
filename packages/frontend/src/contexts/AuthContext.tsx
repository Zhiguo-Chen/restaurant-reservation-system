import {
  Component,
  createContext,
  createSignal,
  useContext,
  JSX,
  onMount,
} from "solid-js";
import { UserInfo } from "../../types";
import { authService } from "../services/authService";

interface AuthContextType {
  user: () => UserInfo | null;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>();

interface AuthProviderProps {
  children: JSX.Element;
}

export const AuthProvider: Component<AuthProviderProps> = (props) => {
  const [user, setUser] = createSignal<UserInfo | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  // Check for existing token on mount
  onMount(async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const userData = await authService.validateToken(token);
        setUser(userData);
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      authService.removeToken();
    } finally {
      setIsLoading(false);
    }
  });

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });
      setUser(response.user);
      authService.setToken(response.token, response.expiresIn);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      authService.removeToken();
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if server logout fails
      setUser(null);
      authService.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = () => user() !== null;

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
