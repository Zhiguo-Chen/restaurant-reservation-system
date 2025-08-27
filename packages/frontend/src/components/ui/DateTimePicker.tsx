import { Component, createSignal, createEffect } from "solid-js";

interface DateTimePickerProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date | null) => void;
  error?: string;
  helperText?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
}

export const DateTimePicker: Component<DateTimePickerProps> = (props) => {
  const [dateValue, setDateValue] = createSignal("");
  const [timeValue, setTimeValue] = createSignal("");

  // Initialize values from props
  createEffect(() => {
    if (props.value) {
      const date = props.value;
      setDateValue(date.toISOString().split("T")[0]);
      setTimeValue(date.toTimeString().slice(0, 5));
    }
  });

  const handleDateChange = (dateStr: string) => {
    setDateValue(dateStr);
    updateDateTime(dateStr, timeValue());
  };

  const handleTimeChange = (timeStr: string) => {
    setTimeValue(timeStr);
    updateDateTime(dateValue(), timeStr);
  };

  const updateDateTime = (dateStr: string, timeStr: string) => {
    if (dateStr && timeStr && props.onChange) {
      const combinedDateTime = new Date(`${dateStr}T${timeStr}`);
      if (!isNaN(combinedDateTime.getTime())) {
        props.onChange(combinedDateTime);
      }
    } else if (props.onChange) {
      props.onChange(null);
    }
  };

  const getMinDate = () => {
    if (props.minDate) {
      return props.minDate.toISOString().split("T")[0];
    }
    // Default to today
    return new Date().toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    if (props.maxDate) {
      return props.maxDate.toISOString().split("T")[0];
    }
    // Default to 1 year from now
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split("T")[0];
  };

  const inputClasses = () =>
    [
      "block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors",
      props.error
        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500",
    ].join(" ");

  return (
    <div class="space-y-1">
      {props.label && (
        <label class="block text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <span class="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div class="grid grid-cols-2 gap-2">
        <div>
          <input
            type="date"
            value={dateValue()}
            onInput={(e) => handleDateChange(e.currentTarget.value)}
            min={getMinDate()}
            max={getMaxDate()}
            disabled={props.disabled}
            required={props.required}
            class={inputClasses()}
            placeholder="Select date"
          />
        </div>
        <div>
          <input
            type="time"
            value={timeValue()}
            onInput={(e) => handleTimeChange(e.currentTarget.value)}
            disabled={props.disabled}
            required={props.required}
            class={inputClasses()}
            placeholder="Select time"
          />
        </div>
      </div>
      {props.error && <p class="text-sm text-red-600">{props.error}</p>}
      {props.helperText && !props.error && (
        <p class="text-sm text-gray-500">{props.helperText}</p>
      )}
    </div>
  );
};
