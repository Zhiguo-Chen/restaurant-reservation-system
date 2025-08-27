import { Component, createSignal, Show, For, onCleanup } from "solid-js";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

export const MultiSelect: Component<MultiSelectProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedValues, setSelectedValues] = createSignal<string[]>(
    props.value || []
  );
  let dropdownRef: HTMLDivElement | undefined;

  const handleToggle = () => {
    if (!props.disabled) {
      setIsOpen(!isOpen());
    }
  };

  const handleOptionClick = (value: string) => {
    const current = selectedValues();
    let newValues: string[];

    if (current.includes(value)) {
      newValues = current.filter((v) => v !== value);
    } else {
      newValues = [...current, value];
    }

    setSelectedValues(newValues);
    if (props.onChange) {
      props.onChange(newValues);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  // Add click outside listener
  document.addEventListener("mousedown", handleClickOutside);
  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  const getSelectedLabels = () => {
    const selected = selectedValues();
    if (selected.length === 0) {
      return props.placeholder || "Select options...";
    }

    const labels = selected.map((value) => {
      const option = props.options.find((opt) => opt.value === value);
      return option?.label || value;
    });

    if (labels.length <= 2) {
      return labels.join(", ");
    }

    return `${labels[0]}, ${labels[1]} +${labels.length - 2} more`;
  };

  const buttonClasses = () =>
    [
      "relative w-full cursor-pointer rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
      props.error ? "border-red-300" : "border-gray-300",
      props.disabled
        ? "cursor-not-allowed bg-gray-50 text-gray-500"
        : "hover:border-gray-400",
    ].join(" ");

  return (
    <div class="space-y-1">
      {props.label && (
        <label class="block text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <span class="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div class="relative" ref={dropdownRef}>
        <button
          type="button"
          class={buttonClasses()}
          onClick={handleToggle}
          disabled={props.disabled}
        >
          <span class="block truncate text-sm">{getSelectedLabels()}</span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              class={`h-5 w-5 text-gray-400 transition-transform ${
                isOpen() ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </button>

        <Show when={isOpen()}>
          <div class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <For each={props.options}>
              {(option) => (
                <div
                  class={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50 ${
                    selectedValues().includes(option.value)
                      ? "bg-blue-50 text-blue-900"
                      : "text-gray-900"
                  }`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  <span class="block truncate text-sm">{option.label}</span>
                  <Show when={selectedValues().includes(option.value)}>
                    <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </span>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

      {props.error && <p class="text-sm text-red-600">{props.error}</p>}
      {props.helperText && !props.error && (
        <p class="text-sm text-gray-500">{props.helperText}</p>
      )}
    </div>
  );
};
