import { Component, JSX, splitProps, For } from "solid-js";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: Component<SelectProps> = (props) => {
  const [local, others] = splitProps(props, [
    "label",
    "error",
    "helperText",
    "class",
    "id",
    "options",
    "placeholder",
  ]);

  const selectId =
    local.id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = () =>
    [
      "block w-full px-3 py-2 border rounded-md shadow-sm bg-white focus:outline-none focus:ring-1 transition-colors",
      local.error
        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
      local.class || "",
    ].join(" ");

  return (
    <div class="space-y-1">
      {local.label && (
        <label for={selectId} class="block text-sm font-medium text-gray-700">
          {local.label}
        </label>
      )}
      <select id={selectId} class={selectClasses()} {...others}>
        {local.placeholder && (
          <option value="" disabled>
            {local.placeholder}
          </option>
        )}
        <For each={local.options}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>
      {local.error && <p class="text-sm text-red-600">{local.error}</p>}
      {local.helperText && !local.error && (
        <p class="text-sm text-gray-500">{local.helperText}</p>
      )}
    </div>
  );
};
