import { Component } from "solid-js";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "gray" | "white";
}

export const LoadingSpinner: Component<LoadingSpinnerProps> = (props) => {
  const size = () => {
    switch (props.size || "md") {
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-8 h-8";
      case "lg":
        return "w-12 h-12";
      default:
        return "w-8 h-8";
    }
  };

  const color = () => {
    switch (props.color || "blue") {
      case "blue":
        return "text-blue-600";
      case "gray":
        return "text-gray-600";
      case "white":
        return "text-white";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div class="flex justify-center items-center">
      <div class={`${size()} ${color()} animate-spin`}>
        <svg class="w-full h-full" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  );
};
