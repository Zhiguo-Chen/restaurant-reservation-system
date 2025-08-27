import {
  Component,
  JSX,
  createContext,
  useContext,
  createSignal,
  createEffect,
} from "solid-js";
import { GraphQLClientError } from "../services/graphqlClient";
import { AuthError } from "../services/authService";
import { clientLogger } from "../services/clientLogger";
import { useToast } from "../components/common/ToastProvider";

export interface AppError {
  id: string;
  type:
    | "network"
    | "authentication"
    | "authorization"
    | "validation"
    | "business"
    | "system";
  message: string;
  originalError?: Error;
  timestamp: Date;
  context?: string;
  recoverable: boolean;
  userFriendlyMessage: string;
}

interface ErrorContextType {
  errors: () => AppError[];
  addError: (error: Error | string, context?: string) => string;
  removeError: (id: string) => void;
  clearErrors: () => void;
  hasErrors: () => boolean;
  getErrorsByType: (type: AppError["type"]) => AppError[];
  handleGraphQLError: (error: GraphQLClientError, context?: string) => string;
  handleAuthError: (error: AuthError, context?: string) => string;
  handleNetworkError: (error: Error, context?: string) => string;
}

const ErrorContext = createContext<ErrorContextType>();

interface ErrorProviderProps {
  children: JSX.Element;
  maxErrors?: number;
  autoShowToasts?: boolean;
  onError?: (error: AppError) => void;
}

export const ErrorProvider: Component<ErrorProviderProps> = (props) => {
  const [errors, setErrors] = createSignal<AppError[]>([]);
  const maxErrors = props.maxErrors || 10;
  const toast = useToast();

  const generateErrorId = () =>
    `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const classifyError = (
    error: Error | string
  ): {
    type: AppError["type"];
    recoverable: boolean;
    userFriendlyMessage: string;
  } => {
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorLower = errorMessage.toLowerCase();

    // GraphQL errors
    if (error instanceof GraphQLClientError) {
      if (error.isAuthenticationError) {
        return {
          type: "authentication",
          recoverable: true,
          userFriendlyMessage: "Your session has expired. Please log in again.",
        };
      }
      if (error.isAuthorizationError) {
        return {
          type: "authorization",
          recoverable: false,
          userFriendlyMessage:
            "You don't have permission to perform this action.",
        };
      }
      if (error.isValidationError) {
        return {
          type: "validation",
          recoverable: true,
          userFriendlyMessage: "Please check your input and try again.",
        };
      }
      if (error.isNetworkError) {
        return {
          type: "network",
          recoverable: true,
          userFriendlyMessage:
            "Connection problem. Please check your internet connection.",
        };
      }
      return {
        type: "business",
        recoverable: true,
        userFriendlyMessage: errorMessage,
      };
    }

    // Network errors
    if (
      errorLower.includes("fetch") ||
      errorLower.includes("network") ||
      errorLower.includes("connection")
    ) {
      return {
        type: "network",
        recoverable: true,
        userFriendlyMessage:
          "Unable to connect to the server. Please check your internet connection.",
      };
    }

    // Authentication errors
    if (
      errorLower.includes("authentication") ||
      errorLower.includes("unauthorized") ||
      errorLower.includes("401")
    ) {
      return {
        type: "authentication",
        recoverable: true,
        userFriendlyMessage: "Your session has expired. Please log in again.",
      };
    }

    // Authorization errors
    if (
      errorLower.includes("authorization") ||
      errorLower.includes("forbidden") ||
      errorLower.includes("403")
    ) {
      return {
        type: "authorization",
        recoverable: false,
        userFriendlyMessage:
          "You don't have permission to perform this action.",
      };
    }

    // Validation errors
    if (
      errorLower.includes("validation") ||
      errorLower.includes("invalid") ||
      errorLower.includes("400")
    ) {
      return {
        type: "validation",
        recoverable: true,
        userFriendlyMessage: "Please check your input and try again.",
      };
    }

    // System errors
    if (
      errorLower.includes("500") ||
      errorLower.includes("internal") ||
      errorLower.includes("server")
    ) {
      return {
        type: "system",
        recoverable: true,
        userFriendlyMessage: "A server error occurred. Please try again later.",
      };
    }

    // Default to business error
    return {
      type: "business",
      recoverable: true,
      userFriendlyMessage: errorMessage,
    };
  };

  const addError = (error: Error | string, context?: string): string => {
    const id = generateErrorId();
    const errorMessage = typeof error === "string" ? error : error.message;
    const classification = classifyError(error);

    const appError: AppError = {
      id,
      type: classification.type,
      message: errorMessage,
      originalError: typeof error === "string" ? undefined : error,
      timestamp: new Date(),
      context,
      recoverable: classification.recoverable,
      userFriendlyMessage: classification.userFriendlyMessage,
    };

    setErrors((prev) => {
      const newErrors = [appError, ...prev];
      // Limit number of errors
      if (newErrors.length > maxErrors) {
        return newErrors.slice(0, maxErrors);
      }
      return newErrors;
    });

    // Log error
    clientLogger.error("Application error", {
      errorId: id,
      type: appError.type,
      message: errorMessage,
      context,
      recoverable: appError.recoverable,
      stack: appError.originalError?.stack,
    });

    // Call custom error handler
    props.onError?.(appError);

    // Show toast notification if enabled
    if (props.autoShowToasts !== false) {
      const toastType =
        appError.type === "system"
          ? "error"
          : appError.type === "validation"
          ? "warning"
          : "error";

      toast.addToast({
        type: toastType,
        title: getErrorTitle(appError.type),
        message: appError.userFriendlyMessage,
        duration: appError.type === "system" ? 8000 : 5000,
      });
    }

    return id;
  };

  const removeError = (id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
    clientLogger.info("All errors cleared");
  };

  const hasErrors = () => errors().length > 0;

  const getErrorsByType = (type: AppError["type"]) => {
    return errors().filter((error) => error.type === type);
  };

  const handleGraphQLError = (
    error: GraphQLClientError,
    context?: string
  ): string => {
    return addError(error, context);
  };

  const handleAuthError = (error: AuthError, context?: string): string => {
    return addError(new Error(error.message), context);
  };

  const handleNetworkError = (error: Error, context?: string): string => {
    return addError(error, context);
  };

  const getErrorTitle = (type: AppError["type"]): string => {
    const titles = {
      network: "Connection Error",
      authentication: "Authentication Required",
      authorization: "Access Denied",
      validation: "Invalid Input",
      business: "Operation Failed",
      system: "System Error",
    };
    return titles[type];
  };

  // Auto-cleanup old errors
  createEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setErrors((prev) =>
        prev.filter((error) => {
          const age = now.getTime() - error.timestamp.getTime();
          return age < 5 * 60 * 1000; // Keep errors for 5 minutes
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  });

  const contextValue: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
    getErrorsByType,
    handleGraphQLError,
    handleAuthError,
    handleNetworkError,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {props.children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};
