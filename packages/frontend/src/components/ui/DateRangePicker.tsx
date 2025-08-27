import { Component, createSignal, createEffect } from "solid-js";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  label?: string;
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  error?: string;
  helperText?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
}

export const DateRangePicker: Component<DateRangePickerProps> = (props) => {
  const [startDateValue, setStartDateValue] = createSignal("");
  const [endDateValue, setEndDateValue] = createSignal("");

  // Initialize values from props
  createEffect(() => {
    if (props.value?.startDate) {
      setStartDateValue(props.value.startDate.toISOString().split("T")[0]);
    }
    if (props.value?.endDate) {
      setEndDateValue(props.value.endDate.toISOString().split("T")[0]);
    }
  });

  const handleStartDateChange = (dateStr: string) => {
    setStartDateValue(dateStr);
    updateDateRange(dateStr, endDateValue());
  };

  const handleEndDateChange = (dateStr: string) => {
    setEndDateValue(dateStr);
    updateDateRange(startDateValue(), dateStr);
  };

  const updateDateRange = (startStr: string, endStr: string) => {
    if (props.onChange) {
      const startDate = startStr ? new Date(startStr) : null;
      const endDate = endStr ? new Date(endStr) : null;

      props.onChange({ startDate, endDate });
    }
  };

  const getMinDate = () => {
    if (props.minDate) {
      return props.minDate.toISOString().split("T")[0];
    }
    return undefined;
  };

  const getMaxDate = () => {
    if (props.maxDate) {
      return props.maxDate.toISOString().split("T")[0];
    }
    return undefined;
  };

  const getEndMinDate = () => {
    // End date should not be before start date
    if (startDateValue()) {
      return startDateValue();
    }
    return getMinDate();
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
          <label class="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startDateValue()}
            onInput={(e) => handleStartDateChange(e.currentTarget.value)}
            min={getMinDate()}
            max={getMaxDate()}
            disabled={props.disabled}
            required={props.required}
            class={inputClasses()}
            placeholder="Start date"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endDateValue()}
            onInput={(e) => handleEndDateChange(e.currentTarget.value)}
            min={getEndMinDate()}
            max={getMaxDate()}
            disabled={props.disabled}
            required={props.required}
            class={inputClasses()}
            placeholder="End date"
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
