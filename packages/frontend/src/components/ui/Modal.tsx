import { Component, JSX, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: Component<ModalProps> = (props) => {
  let modalRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  });

  onCleanup(() => {
    document.body.style.overflow = "unset";
  });

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === modalRef) {
      props.onClose();
    }
  };

  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      props.onClose();
    }
  };

  createEffect(() => {
    if (props.isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    } else {
      document.removeEventListener("keydown", handleEscapeKey);
    }
  });

  const sizeClasses = () => {
    switch (props.size || "md") {
      case "sm":
        return "max-w-md";
      case "md":
        return "max-w-lg";
      case "lg":
        return "max-w-2xl";
      case "xl":
        return "max-w-4xl";
      default:
        return "max-w-lg";
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          ref={modalRef}
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={handleBackdropClick}
        >
          <div
            class={`bg-white rounded-lg shadow-xl w-full ${sizeClasses()} animate-fade-in`}
          >
            <Show when={props.title}>
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">
                  {props.title}
                </h2>
                <button
                  onClick={props.onClose}
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </Show>
            <div class="px-6 py-4">{props.children}</div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
