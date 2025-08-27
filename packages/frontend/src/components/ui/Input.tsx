import { Component, JSX, splitProps } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, [
    "label",
    "error",
    "helperText",
    "class",
    "id",
  ]);

  const inputId =
    local.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = () =>
    [
      "block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors",
      local.error
        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
      local.class || "",
    ].join(" ");

  return (
    <div class="space-y-1">
      {local.label && (
        <label for={inputId} class="block text-sm font-medium text-gray-700">
          {local.label}
        </label>
      )}
      <input id={inputId} class={inputClasses()} {...others} />
      {local.error && <p class="text-sm text-red-600">{local.error}</p>}
      {local.helperText && !local.error && (
        <p class="text-sm text-gray-500">{local.helperText}</p>
      )}
    </div>
  );
};
