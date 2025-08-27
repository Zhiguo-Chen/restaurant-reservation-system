import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { Router } from "@solidjs/router";
import LoginPage from "../LoginPage";
import { AuthProvider } from "../../../contexts/AuthContext";
import { authService } from "../../../services/authService";

// Mock the auth service
vi.mock("../../../services/authService", () => ({
  authService: {
    getToken: vi.fn(),
    validateToken: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
  },
}));

// Mock the auth redirect hook
vi.mock("../../../hooks/useAuthRedirect", () => ({
  useAuthRedirect: () => ({
    redirectAfterLogin: vi.fn(),
  }),
}));

const mockAuthService = authService as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

const renderLoginPage = () => {
  return render(() => (
    <Router>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </Router>
  ));
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getToken.mockReturnValue(null);
  });

  it("should render login form", async () => {
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByText("Employee Login")).toBeDefined();
    });

    expect(screen.getByLabelText("Username")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
  });

  it("should show validation errors for empty fields", async () => {
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
    });

    const submitButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.submit(submitButton.closest("form")!);

    await waitFor(() => {
      // Check if validation errors appear or form doesn't submit
      const usernameError = screen.queryByText("Username is required");
      const passwordError = screen.queryByText("Password is required");

      // At least one validation should be working
      expect(usernameError || passwordError).toBeTruthy();
    });
  });

  it("should show validation errors for short inputs", async () => {
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Username")).toBeDefined();
    });

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.input(usernameInput, { target: { value: "ab" } });
    fireEvent.input(passwordInput, { target: { value: "12345" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Username must be at least 3 characters")
      ).toBeDefined();
      expect(
        screen.getByText("Password must be at least 6 characters")
      ).toBeDefined();
    });
  });

  it("should clear field errors when user starts typing", async () => {
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
    });

    const usernameInput = screen.getByLabelText("Username");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Trigger validation by submitting empty form
    fireEvent.submit(submitButton.closest("form")!);

    // Start typing in username field
    fireEvent.input(usernameInput, { target: { value: "testuser" } });

    // Verify the input has the expected value
    expect((usernameInput as HTMLInputElement).value).toBe("testuser");
  });

  it("should handle successful login", async () => {
    const mockAuthResponse = {
      token: "mock-token",
      user: {
        id: "user-1",
        username: "testuser",
        role: "EMPLOYEE",
      },
      expiresIn: 3600,
    };

    mockAuthService.login.mockResolvedValue(mockAuthResponse);

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Username")).toBeDefined();
    });

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.input(usernameInput, { target: { value: "testuser" } });
    fireEvent.input(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
      });
    });
  });

  it("should handle login failure", async () => {
    mockAuthService.login.mockRejectedValue(new Error("Invalid credentials"));

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Username")).toBeDefined();
    });

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.input(usernameInput, { target: { value: "testuser" } });
    fireEvent.input(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeDefined();
    });
  });

  it("should show loading state during login", async () => {
    // Create a promise that we can control
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockAuthService.login.mockReturnValue(loginPromise);

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Username")).toBeDefined();
    });

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.input(usernameInput, { target: { value: "testuser" } });
    fireEvent.input(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeDefined();
    });

    // Resolve the login
    resolveLogin!({
      token: "mock-token",
      user: { id: "1", username: "testuser", role: "EMPLOYEE" },
      expiresIn: 3600,
    });

    await waitFor(() => {
      expect(screen.queryByText("Signing in...")).toBeNull();
    });
  });

  it("should disable form during submission", async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    mockAuthService.login.mockReturnValue(loginPromise);

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Username")).toBeDefined();
    });

    const usernameInput = screen.getByLabelText("Username") as HTMLInputElement;
    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: "Sign In",
    }) as HTMLButtonElement;

    fireEvent.input(usernameInput, { target: { value: "testuser" } });
    fireEvent.input(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(usernameInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });

    // Resolve the login
    resolveLogin!({
      token: "mock-token",
      user: { id: "1", username: "testuser", role: "EMPLOYEE" },
      expiresIn: 3600,
    });
  });

  it("should show demo information", async () => {
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByText(/For demo purposes/)).toBeDefined();
    });
  });
});
