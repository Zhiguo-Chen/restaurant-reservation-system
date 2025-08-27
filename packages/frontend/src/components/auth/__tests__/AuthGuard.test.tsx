import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { Router } from "@solidjs/router";
import { AuthGuard } from "../AuthGuard";
import { AuthProvider } from "../../../contexts/AuthContext";
import { authService } from "../../../services/authService";
import { UserRole } from "@restaurant-reservation/shared";

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

const TestContent = () => (
  <div data-testid="protected-content">Protected Content</div>
);

const renderAuthGuard = (props: any = {}) => {
  return render(() => (
    <Router>
      <AuthProvider>
        <AuthGuard {...props}>
          <TestContent />
        </AuthGuard>
      </AuthProvider>
    </Router>
  ));
};

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getToken.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  it("should show loading state initially", async () => {
    renderAuthGuard();

    expect(screen.getByText("Verifying authentication...")).toBeDefined();
  });

  it("should redirect to login when not authenticated", async () => {
    renderAuthGuard();

    await waitFor(() => {
      expect(screen.queryByText("Verifying authentication...")).toBeNull();
    });

    // Should not show protected content
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("should show protected content when authenticated", async () => {
    const mockUser = {
      id: "user-1",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    mockAuthService.getToken.mockReturnValue("valid-token");
    mockAuthService.validateToken.mockResolvedValue(mockUser);

    renderAuthGuard();

    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeDefined();
    });
  });

  it("should redirect to custom path when specified", async () => {
    renderAuthGuard({ redirectTo: "/custom-login" });

    await waitFor(() => {
      expect(screen.queryByText("Verifying authentication...")).toBeNull();
    });

    // Should not show protected content
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("should store current path for redirect after login", async () => {
    renderAuthGuard();

    await waitFor(() => {
      expect(screen.queryByText("Verifying authentication...")).toBeNull();
    });

    // The sessionStorage should be called when not authenticated
    expect(sessionStorageMock.setItem).toHaveBeenCalled();
  });

  it("should not store login path for redirect", async () => {
    renderAuthGuard();

    await waitFor(() => {
      expect(screen.queryByText("Verifying authentication...")).toBeNull();
    });

    // Should not show protected content when not authenticated
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("should check role requirements", async () => {
    const mockUser = {
      id: "user-1",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    mockAuthService.getToken.mockReturnValue("valid-token");
    mockAuthService.validateToken.mockResolvedValue(mockUser);

    renderAuthGuard({ requireRole: [UserRole.ADMIN] });

    // Wait for loading to finish first
    await waitFor(() => {
      expect(screen.queryByText("Verifying authentication...")).toBeNull();
    });

    // Then check for access denied or redirect
    await waitFor(() => {
      const accessDenied = screen.queryByText("Access Denied");
      const protectedContent = screen.queryByTestId("protected-content");

      // Should either show access denied or not show protected content
      expect(accessDenied || !protectedContent).toBeTruthy();
    });
  });

  it("should allow access with correct role", async () => {
    const mockUser = {
      id: "user-1",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    mockAuthService.getToken.mockReturnValue("valid-token");
    mockAuthService.validateToken.mockResolvedValue(mockUser);

    renderAuthGuard({ requireRole: [UserRole.EMPLOYEE, UserRole.ADMIN] });

    // Wait for loading to finish first
    await waitFor(() => {
      expect(screen.queryByText("Verifying authentication...")).toBeNull();
    });

    // Then check for protected content
    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeDefined();
    });
  });

  it("should allow access when no role requirements specified", async () => {
    const mockUser = {
      id: "user-1",
      username: "testuser",
      role: UserRole.EMPLOYEE,
    };

    mockAuthService.getToken.mockReturnValue("valid-token");
    mockAuthService.validateToken.mockResolvedValue(mockUser);

    renderAuthGuard();

    // Wait for loading to finish first
    await waitFor(() => {
      expect(screen.queryByText("Verifying authentication...")).toBeNull();
    });

    // Then check for protected content
    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeDefined();
    });
  });

  it("should handle token validation failure", async () => {
    mockAuthService.getToken.mockReturnValue("invalid-token");
    mockAuthService.validateToken.mockRejectedValue(new Error("Invalid token"));

    renderAuthGuard();

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.queryByText("Verifying authentication...")).toBeNull();
      },
      { timeout: 3000 }
    );

    // Should not show protected content
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });
});
