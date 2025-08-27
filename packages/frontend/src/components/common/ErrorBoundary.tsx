import {
  Component,
  JSX,
  ErrorBoundary as SolidErrorBoundary,
  createSignal,
  onMount,
} from "solid-js";
import { clientLogger } from "../../services/clientLogger";

export interface ErrorInfo {
  error: Error;
  errorInfo?: {
    componentStack?: string;
  };
  timestamp: Date;
  url: string;
  userAgent: string;
}

interface ErrorBoundaryProps {
  children: JSX.Element;
  fallback?: Component<{ error: Error; reset: () => void; errorId: string }>;
  onError?: (errorInfo: ErrorInfo) => void;
  level?: "page" | "component" | "critical";
}

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
  errorId: string;
  level?: "page" | "component" | "critical";
}

const DefaultErrorFallback: Component<ErrorFallbackProps> = (props) => {
  const [isRetrying, setIsRetrying] = createSignal(false);
  const [retryCount, setRetryCount] = createSignal(0);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    // Log retry attempt
    clientLogger.info("Error boundary retry attempted", {
      errorId: props.errorId,
      retryCount: retryCount(),
      error: props.error.message,
    });

    // Add a small delay to prevent rapid retries
    await new Promise((resolve) => setTimeout(resolve, 500));

    setIsRetrying(false);
    props.reset();
  };

  const handleReportError = () => {
    clientLogger.error("User reported error", {
      errorId: props.errorId,
      error: props.error.message,
      stack: props.error.stack,
      userReported: true,
    });

    // In a real app, this could send to an error reporting service
    alert("Error reported. Thank you for helping us improve!");
  };

  // Component-level error (smaller fallback)
  if (props.level === "component") {
    return (
      <div class="bg-red-50 border border-red-200 rounded-md p-4 my-2">
        <div class="flex items-start">
          <div class="text-red-400 text-xl mr-3">⚠️</div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-800 mb-1">
              Component Error
            </h3>
            <p class="text-sm text-red-700 mb-3">
              This section couldn't load properly.
            </p>
            <div class="flex space-x-2">
              <button
                onClick={handleRetry}
                disabled={isRetrying()}
                class="text-xs bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
              >
                {isRetrying() ? "Retrying..." : "Retry"}
              </button>
              {import.meta.env.DEV && (
                <details class="text-xs">
                  <summary class="cursor-pointer text-red-600 hover:text-red-800">
                    Details
                  </summary>
                  <pre class="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-20">
                    {props.error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page-level or critical error (full-screen fallback)
  const isCritical = props.level === "critical";

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div class="text-center">
          <div
            class={`text-6xl mb-4 ${
              isCritical ? "text-red-600" : "text-orange-500"
            }`}
          >
            {isCritical ? "💥" : "⚠️"}
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">
            {isCritical ? "Critical Error" : "Something went wrong"}
          </h1>
          <p class="text-gray-600 mb-6">
            {isCritical
              ? "A critical error occurred that requires immediate attention."
              : "We're sorry, but something unexpected happened. Please try again."}
          </p>

          {retryCount() > 0 && (
            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p class="text-sm text-yellow-800">
                Retry attempts: {retryCount()}
                {retryCount() >= 3 && " (Consider refreshing the page)"}
              </p>
            </div>
          )}

          <div class="space-y-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying() || retryCount() >= 5}
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRetrying()
                ? "Retrying..."
                : retryCount() >= 5
                ? "Max Retries Reached"
                : "Try Again"}
            </button>

            <button
              onClick={() => window.location.reload()}
              class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Refresh Page
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              class="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>

            {!import.meta.env.DEV && (
              <button
                onClick={handleReportError}
                class="w-full bg-orange-100 text-orange-800 py-2 px-4 rounded-md hover:bg-orange-200 transition-colors text-sm"
              >
                Report Error
              </button>
            )}
          </div>

          <div class="mt-4 text-xs text-gray-500">
            Error ID: {props.errorId}
          </div>

          {import.meta.env.DEV && (
            <details class="mt-6 text-left">
              <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Development)
              </summary>
              <div class="mt-2 text-xs bg-gray-50 p-3 rounded">
                <div class="mb-2">
                  <strong>Message:</strong> {props.error.message}
                </div>
                <div class="mb-2">
                  <strong>Error ID:</strong> {props.errorId}
                </div>
                <div>
                  <strong>Stack:</strong>
                  <pre class="mt-1 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
                    {props.error.stack}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export const ErrorBoundary: Component<ErrorBoundaryProps> = (props) => {
  const [errorId, setErrorId] = createSignal<string>("");

  const generateErrorId = () => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleError = (error: Error, errorInfo?: any) => {
    const id = generateErrorId();
    setErrorId(id);

    const errorDetails: ErrorInfo = {
      error,
      errorInfo,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Log error to client logger
    clientLogger.error("Error boundary caught error", {
      errorId: id,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      url: errorDetails.url,
      userAgent: errorDetails.userAgent,
      level: props.level || "page",
    });

    // Call custom error handler if provided
    if (props.onError) {
      props.onError(errorDetails);
    }

    // In production, send to error reporting service
    if (!import.meta.env.DEV) {
      // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
      console.error("Production error:", errorDetails);
    }
  };

  const FallbackComponent = props.fallback || DefaultErrorFallback;

  return (
    <SolidErrorBoundary
      fallback={(error, reset) => {
        // Generate error ID on first render
        if (!errorId()) {
          handleError(error);
        }

        return (
          <FallbackComponent
            error={error}
            reset={reset}
            errorId={errorId()}
            level={props.level}
          />
        );
      }}
    >
      {props.children}
    </SolidErrorBoundary>
  );
};
