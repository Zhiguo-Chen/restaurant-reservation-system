import { Component, JSX, createSignal, Show } from "solid-js";
import { clientLogger } from "../../services/clientLogger";

export interface ErrorMessageProps {
  error?: Error | string | null;
  title?: string;
  description?: string;
  variant?: "inline" | "card" | "banner" | "toast";
  severity?: "error" | "warning" | "info";
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryText?: string;
  showDetails?: boolean;
  className?: string;
}

export const ErrorMessage: Component<ErrorMessageProps> = (props) => {
  const [isDismissed, setIsDismissed] = createSignal(false);
  const [showFullDetails, setShowFullDetails] = createSignal(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    clientLogger.logUserAction("Error message dismissed", {
      error: getErrorMessage(),
      variant: props.variant,
    });
    props.onDismiss?.();
  };

  const handleRetry = () => {
    clientLogger.logUserAction("Error retry attempted", {
      error: getErrorMessage(),
    });
    props.onRetry?.();
  };

  const getErrorMessage = (): string => {
    if (!props.error) return "";
    if (typeof props.error === "string") return props.error;
    return props.error.message || "An unexpected error occurred";
  };

  const getErrorStack = (): string => {
    if (!props.error || typeof props.error === "string") return "";
    return props.error.stack || "";
  };

  const getUserFriendlyMessage = (error: string): string => {
    // Map technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      "Network Error":
        "Unable to connect to the server. Please check your internet connection.",
      fetch:
        "Connection problem. Please check your internet connection and try again.",
      "401": "Your session has expired. Please log in again.",
      "403": "You don't have permission to perform this action.",
      "404": "The requested information could not be found.",
      "500": "Server error. Please try again later.",
      timeout: "The request took too long. Please try again.",
      NETWORK_ERROR:
        "Unable to connect to the server. Please check your internet connection.",
      VALIDATION_ERROR: "Please check your input and try again.",
      AUTHENTICATION_ERROR: "Please log in to continue.",
      AUTHORIZATION_ERROR: "You don't have permission to perform this action.",
    };

    // Check for specific error patterns
    for (const [pattern, message] of Object.entries(errorMappings)) {
      if (error.toLowerCase().includes(pattern.toLowerCase())) {
        return message;
      }
    }

    return error;
  };

  const getVariantClasses = () => {
    const severity = props.severity || "error";
    const variant = props.variant || "card";

    const severityClasses = {
      error: "border-red-200 bg-red-50 text-red-800",
      warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
      info: "border-blue-200 bg-blue-50 text-blue-800",
    };

    const variantClasses = {
      inline: "p-2 rounded text-sm",
      card: "p-4 rounded-lg shadow-sm",
      banner: "p-4 rounded-none border-l-4",
      toast: "p-4 rounded-lg shadow-lg",
    };

    return `border ${severityClasses[severity]} ${variantClasses[variant]}`;
  };

  const getIconForSeverity = () => {
    const severity = props.severity || "error";
    const icons = {
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[severity];
  };

  if (isDismissed() || !props.error) {
    return null;
  }

  const errorMessage = getErrorMessage();
  const friendlyMessage = getUserFriendlyMessage(errorMessage);
  const errorStack = getErrorStack();

  return (
    <div class={`${getVariantClasses()} ${props.className || ""}`}>
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3 flex-1">
          <div class="text-lg flex-shrink-0">{getIconForSeverity()}</div>
          <div class="flex-1 min-w-0">
            <Show when={props.title}>
              <h3 class="font-medium mb-1">{props.title}</h3>
            </Show>
            <p class="text-sm mb-2">{props.description || friendlyMessage}</p>

            <Show when={props.showDetails && import.meta.env.DEV && errorStack}>
              <div class="mt-2">
                <button
                  onClick={() => setShowFullDetails(!showFullDetails())}
                  class="text-xs underline hover:no-underline"
                >
                  {showFullDetails() ? "Hide" : "Show"} Technical Details
                </button>
                <Show when={showFullDetails()}>
                  <pre class="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto max-h-32 border">
                    {errorStack}
                  </pre>
                </Show>
              </div>
            </Show>

            <Show when={props.onRetry}>
              <div class="mt-3">
                <button
                  onClick={handleRetry}
                  class="text-sm bg-white bg-opacity-50 px-3 py-1 rounded border hover:bg-opacity-75 transition-colors"
                >
                  {props.retryText || "Try Again"}
                </button>
              </div>
            </Show>
          </div>
        </div>

        <Show when={props.dismissible}>
          <button
            onClick={handleDismiss}
            class="flex-shrink-0 ml-2 text-lg hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </Show>
      </div>
    </div>
  );
};

// Specialized error message components
export const InlineError: Component<Omit<ErrorMessageProps, "variant">> = (
  props
) => <ErrorMessage {...props} variant="inline" />;

export const ErrorCard: Component<Omit<ErrorMessageProps, "variant">> = (
  props
) => <ErrorMessage {...props} variant="card" />;

export const ErrorBanner: Component<Omit<ErrorMessageProps, "variant">> = (
  props
) => <ErrorMessage {...props} variant="banner" />;

export const ErrorToast: Component<Omit<ErrorMessageProps, "variant">> = (
  props
) => <ErrorMessage {...props} variant="toast" />;
