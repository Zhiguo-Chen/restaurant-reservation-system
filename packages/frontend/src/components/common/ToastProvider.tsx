import {
  Component,
  JSX,
  createContext,
  useContext,
  createSignal,
  For,
  onMount,
  onCleanup,
} from "solid-js";
import { clientLogger } from "../../services/clientLogger";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType>();

interface ToastProviderProps {
  children: JSX.Element;
  maxToasts?: number;
  defaultDuration?: number;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

export const ToastProvider: Component<ToastProviderProps> = (props) => {
  const [toasts, setToasts] = createSignal<Toast[]>([]);
  const maxToasts = props.maxToasts || 5;
  const defaultDuration = props.defaultDuration || 5000;

  const generateId = () =>
    `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addToast = (toastData: Omit<Toast, "id">): string => {
    const id = generateId();
    const toast: Toast = {
      id,
      duration: defaultDuration,
      dismissible: true,
      ...toastData,
    };

    setToasts((prev) => {
      const newToasts = [toast, ...prev];
      // Limit number of toasts
      if (newToasts.length > maxToasts) {
        return newToasts.slice(0, maxToasts);
      }
      return newToasts;
    });

    // Auto-dismiss if duration is set
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    clientLogger.logUserAction("Toast shown", {
      toastId: id,
      type: toast.type,
      message: toast.message,
    });

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    clientLogger.logUserAction("Toast dismissed", { toastId: id });
  };

  const clearAllToasts = () => {
    setToasts([]);
    clientLogger.logUserAction("All toasts cleared");
  };

  const showSuccess = (message: string, title?: string, duration?: number) =>
    addToast({ type: "success", message, title, duration });

  const showError = (message: string, title?: string, duration?: number) =>
    addToast({ type: "error", message, title, duration: duration || 8000 });

  const showWarning = (message: string, title?: string, duration?: number) =>
    addToast({ type: "warning", message, title, duration });

  const showInfo = (message: string, title?: string, duration?: number) =>
    addToast({ type: "info", message, title, duration });

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  const getPositionClasses = () => {
    const position = props.position || "top-right";
    const positions = {
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-center": "top-4 left-1/2 transform -translate-x-1/2",
      "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
    };
    return positions[position];
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {props.children}

      {/* Toast Container */}
      <div
        class={`fixed z-50 ${getPositionClasses()} space-y-2 max-w-sm w-full`}
      >
        <For each={toasts()}>
          {(toast) => <ToastComponent toast={toast} onDismiss={removeToast} />}
        </For>
      </div>
    </ToastContext.Provider>
  );
};

interface ToastComponentProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastComponent: Component<ToastComponentProps> = (props) => {
  const [isVisible, setIsVisible] = createSignal(false);
  const [isLeaving, setIsLeaving] = createSignal(false);

  onMount(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  });

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      props.onDismiss(props.toast.id);
    }, 300); // Match animation duration
  };

  const getTypeClasses = () => {
    const typeClasses = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    };
    return typeClasses[props.toast.type];
  };

  const getIcon = () => {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[props.toast.type];
  };

  return (
    <div
      class={`
        border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out
        ${getTypeClasses()}
        ${
          isVisible() && !isLeaving()
            ? "transform translate-x-0 opacity-100"
            : "transform translate-x-full opacity-0"
        }
      `}
    >
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3 flex-1">
          <div class="text-lg flex-shrink-0">{getIcon()}</div>
          <div class="flex-1 min-w-0">
            {props.toast.title && (
              <h4 class="font-medium text-sm mb-1">{props.toast.title}</h4>
            )}
            <p class="text-sm">{props.toast.message}</p>
            {props.toast.action && (
              <button
                onClick={props.toast.action.onClick}
                class="mt-2 text-sm underline hover:no-underline"
              >
                {props.toast.action.label}
              </button>
            )}
          </div>
        </div>

        {props.toast.dismissible && (
          <button
            onClick={handleDismiss}
            class="flex-shrink-0 ml-2 text-lg hover:opacity-70 transition-opacity"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
