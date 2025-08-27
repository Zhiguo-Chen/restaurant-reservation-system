import { render, screen, fireEvent } from "@solidjs/testing-library";
import {
  ErrorMessage,
  InlineError,
  ErrorCard,
  ErrorBanner,
  ErrorToast,
} from "../ErrorMessage";
import { clientLogger } from "../../../services/clientLogger";

// Mock client logger
jest.mock("../../../services/clientLogger", () => ({
  clientLogger: {
    logUserAction: jest.fn(),
  },
}));

describe("ErrorMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when no error is provided", () => {
    const { container } = render(() => <ErrorMessage />);
    expect(container.firstChild).toBeNull();
  });

  it("should render string error message", () => {
    render(() => <ErrorMessage error="Test error message" />);
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should render Error object message", () => {
    const error = new Error("Test error object");
    render(() => <ErrorMessage error={error} />);
    expect(screen.getByText("Test error object")).toBeInTheDocument();
  });

  it("should render with custom title and description", () => {
    render(() => (
      <ErrorMessage
        error="Test error"
        title="Custom Title"
        description="Custom description"
      />
    ));

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom description")).toBeInTheDocument();
  });

  it("should show user-friendly message for network errors", () => {
    render(() => <ErrorMessage error="Network Error occurred" />);
    expect(
      screen.getByText(
        "Unable to connect to the server. Please check your internet connection."
      )
    ).toBeInTheDocument();
  });

  it("should show user-friendly message for 401 errors", () => {
    render(() => <ErrorMessage error="401 Unauthorized" />);
    expect(
      screen.getByText("Your session has expired. Please log in again.")
    ).toBeInTheDocument();
  });

  it("should show user-friendly message for 403 errors", () => {
    render(() => <ErrorMessage error="403 Forbidden" />);
    expect(
      screen.getByText("You don't have permission to perform this action.")
    ).toBeInTheDocument();
  });

  it("should show user-friendly message for 404 errors", () => {
    render(() => <ErrorMessage error="404 Not Found" />);
    expect(
      screen.getByText("The requested information could not be found.")
    ).toBeInTheDocument();
  });

  it("should show user-friendly message for 500 errors", () => {
    render(() => <ErrorMessage error="500 Internal Server Error" />);
    expect(
      screen.getByText("Server error. Please try again later.")
    ).toBeInTheDocument();
  });

  it("should handle dismissible errors", () => {
    const onDismiss = jest.fn();
    render(() => (
      <ErrorMessage
        error="Test error"
        dismissible={true}
        onDismiss={onDismiss}
      />
    ));

    const dismissButton = screen.getByLabelText("Dismiss error");
    fireEvent.click(dismissButton);

    expect(clientLogger.logUserAction).toHaveBeenCalledWith(
      "Error message dismissed",
      expect.objectContaining({
        error: "Test error",
      })
    );
    expect(onDismiss).toHaveBeenCalled();
  });

  it("should handle retry functionality", () => {
    const onRetry = jest.fn();
    render(() => (
      <ErrorMessage
        error="Test error"
        onRetry={onRetry}
        retryText="Custom Retry"
      />
    ));

    const retryButton = screen.getByText("Custom Retry");
    fireEvent.click(retryButton);

    expect(clientLogger.logUserAction).toHaveBeenCalledWith(
      "Error retry attempted",
      expect.objectContaining({
        error: "Test error",
      })
    );
    expect(onRetry).toHaveBeenCalled();
  });

  it("should show technical details in development", () => {
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = true;

    const error = new Error("Test error");
    error.stack = "Error stack trace";

    render(() => <ErrorMessage error={error} showDetails={true} />);

    expect(screen.getByText("Show Technical Details")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show Technical Details"));
    expect(screen.getByText("Error stack trace")).toBeInTheDocument();

    (import.meta.env as any).DEV = originalEnv;
  });

  it("should hide technical details in production", () => {
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = false;

    const error = new Error("Test error");
    error.stack = "Error stack trace";

    render(() => <ErrorMessage error={error} showDetails={true} />);

    expect(
      screen.queryByText("Show Technical Details")
    ).not.toBeInTheDocument();

    (import.meta.env as any).DEV = originalEnv;
  });

  it("should apply different severity styles", () => {
    const { rerender } = render(() => (
      <ErrorMessage error="Test error" severity="error" />
    ));

    expect(screen.getByText("❌")).toBeInTheDocument();

    rerender(() => <ErrorMessage error="Test error" severity="warning" />);

    expect(screen.getByText("⚠️")).toBeInTheDocument();

    rerender(() => <ErrorMessage error="Test error" severity="info" />);

    expect(screen.getByText("ℹ️")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(() => (
      <ErrorMessage error="Test error" className="custom-class" />
    ));

    expect(container.firstChild).toHaveClass("custom-class");
  });

  describe("Specialized Components", () => {
    it("should render InlineError with inline variant", () => {
      const { container } = render(() => <InlineError error="Test error" />);
      expect(container.firstChild).toHaveClass("p-2", "rounded", "text-sm");
    });

    it("should render ErrorCard with card variant", () => {
      const { container } = render(() => <ErrorCard error="Test error" />);
      expect(container.firstChild).toHaveClass(
        "p-4",
        "rounded-lg",
        "shadow-sm"
      );
    });

    it("should render ErrorBanner with banner variant", () => {
      const { container } = render(() => <ErrorBanner error="Test error" />);
      expect(container.firstChild).toHaveClass(
        "p-4",
        "rounded-none",
        "border-l-4"
      );
    });

    it("should render ErrorToast with toast variant", () => {
      const { container } = render(() => <ErrorToast error="Test error" />);
      expect(container.firstChild).toHaveClass(
        "p-4",
        "rounded-lg",
        "shadow-lg"
      );
    });
  });

  it("should handle toggle of technical details", () => {
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = true;

    const error = new Error("Test error");
    error.stack = "Error stack trace";

    render(() => <ErrorMessage error={error} showDetails={true} />);

    const toggleButton = screen.getByText("Show Technical Details");
    fireEvent.click(toggleButton);

    expect(screen.getByText("Hide Technical Details")).toBeInTheDocument();
    expect(screen.getByText("Error stack trace")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide Technical Details"));
    expect(screen.getByText("Show Technical Details")).toBeInTheDocument();
    expect(screen.queryByText("Error stack trace")).not.toBeInTheDocument();

    (import.meta.env as any).DEV = originalEnv;
  });

  it("should use default retry text when not provided", () => {
    const onRetry = jest.fn();
    render(() => <ErrorMessage error="Test error" onRetry={onRetry} />);

    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });
});
