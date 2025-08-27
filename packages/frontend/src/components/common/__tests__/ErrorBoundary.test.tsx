import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { ErrorBoundary } from "../ErrorBoundary";
import { clientLogger } from "../../../services/clientLogger";

// Mock client logger
jest.mock("../../../services/clientLogger", () => ({
  clientLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children when no error occurs", () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    ));

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should render error fallback when error occurs", () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/We're sorry, but something unexpected happened/)
    ).toBeInTheDocument();
  });

  it("should log error when it occurs", () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    expect(clientLogger.error).toHaveBeenCalledWith(
      "Error boundary caught error",
      expect.objectContaining({
        message: "Test error",
        level: "page",
      })
    );
  });

  it("should show retry button and handle retry", async () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    const retryButton = screen.getByText("Try Again");
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(clientLogger.info).toHaveBeenCalledWith(
        "Error boundary retry attempted",
        expect.objectContaining({
          retryCount: 1,
        })
      );
    });
  });

  it("should disable retry button after max retries", async () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    const retryButton = screen.getByText("Try Again");

    // Click retry button 5 times
    for (let i = 0; i < 5; i++) {
      fireEvent.click(retryButton);
      await waitFor(() => {});
    }

    await waitFor(() => {
      expect(screen.getByText("Max Retries Reached")).toBeInTheDocument();
    });
  });

  it("should show component-level error for component boundary", () => {
    render(() => (
      <ErrorBoundary level="component">
        <ThrowError />
      </ErrorBoundary>
    ));

    expect(screen.getByText("Component Error")).toBeInTheDocument();
    expect(
      screen.getByText("This section couldn't load properly.")
    ).toBeInTheDocument();
  });

  it("should show critical error for critical boundary", () => {
    render(() => (
      <ErrorBoundary level="critical">
        <ThrowError />
      </ErrorBoundary>
    ));

    expect(screen.getByText("Critical Error")).toBeInTheDocument();
    expect(screen.getByText(/A critical error occurred/)).toBeInTheDocument();
  });

  it("should call custom onError handler", () => {
    const onError = jest.fn();

    render(() => (
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    ));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        timestamp: expect.any(Date),
        url: expect.any(String),
        userAgent: expect.any(String),
      })
    );
  });

  it("should show error details in development", () => {
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = true;

    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    expect(screen.getByText("Error Details (Development)")).toBeInTheDocument();

    (import.meta.env as any).DEV = originalEnv;
  });

  it("should hide error details in production", () => {
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = false;

    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    expect(
      screen.queryByText("Error Details (Development)")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Report Error")).toBeInTheDocument();

    (import.meta.env as any).DEV = originalEnv;
  });

  it("should handle report error in production", () => {
    const originalEnv = import.meta.env.DEV;
    const originalAlert = window.alert;
    (import.meta.env as any).DEV = false;
    window.alert = jest.fn();

    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    const reportButton = screen.getByText("Report Error");
    fireEvent.click(reportButton);

    expect(clientLogger.error).toHaveBeenCalledWith(
      "User reported error",
      expect.objectContaining({
        userReported: true,
      })
    );

    expect(window.alert).toHaveBeenCalledWith(
      "Error reported. Thank you for helping us improve!"
    );

    (import.meta.env as any).DEV = originalEnv;
    window.alert = originalAlert;
  });

  it("should use custom fallback component", () => {
    const CustomFallback = ({ error, reset, errorId }: any) => (
      <div>
        <h1>Custom Error: {error.message}</h1>
        <button onClick={reset}>Custom Retry</button>
        <span>ID: {errorId}</span>
      </div>
    );

    render(() => (
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    ));

    expect(screen.getByText("Custom Error: Test error")).toBeInTheDocument();
    expect(screen.getByText("Custom Retry")).toBeInTheDocument();
    expect(screen.getByText(/ID: err_/)).toBeInTheDocument();
  });

  it("should show retry count in UI", async () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Retry attempts: 1")).toBeInTheDocument();
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("Retry attempts: 2")).toBeInTheDocument();
    });
  });

  it("should suggest page refresh after multiple retries", async () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    ));

    const retryButton = screen.getByText("Try Again");

    // Click retry 3 times
    for (let i = 0; i < 3; i++) {
      fireEvent.click(retryButton);
      await waitFor(() => {});
    }

    await waitFor(() => {
      expect(
        screen.getByText("Retry attempts: 3 (Consider refreshing the page)")
      ).toBeInTheDocument();
    });
  });
});
