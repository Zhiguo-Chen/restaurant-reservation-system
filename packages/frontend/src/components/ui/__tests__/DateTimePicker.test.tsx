import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { DateTimePicker } from "../DateTimePicker";

describe("DateTimePicker", () => {
  const getDateInput = (container: HTMLElement) =>
    container.querySelector('input[type="date"]') as HTMLInputElement;

  const getTimeInput = (container: HTMLElement) =>
    container.querySelector('input[type="time"]') as HTMLInputElement;

  it("should render date and time inputs", () => {
    const { container } = render(() => <DateTimePicker />);

    const dateInput = getDateInput(container);
    const timeInput = getTimeInput(container);

    expect(dateInput).toBeDefined();
    expect(timeInput).toBeDefined();
    expect(dateInput.type).toBe("date");
    expect(timeInput.type).toBe("time");
  });

  it("should render with label", () => {
    render(() => <DateTimePicker label="Select Date & Time" />);

    expect(screen.getByText("Select Date & Time")).toBeDefined();
  });

  it("should render with required indicator", () => {
    render(() => <DateTimePicker label="Date & Time" required />);

    expect(screen.getByText("*")).toBeDefined();
  });

  it("should show error message", () => {
    render(() => <DateTimePicker error="This field is required" />);

    expect(screen.getByText("This field is required")).toBeDefined();
  });

  it("should show helper text when no error", () => {
    render(() => <DateTimePicker helperText="Select your preferred time" />);

    expect(screen.getByText("Select your preferred time")).toBeDefined();
  });

  it("should not show helper text when there is an error", () => {
    render(() => (
      <DateTimePicker
        error="This field is required"
        helperText="Select your preferred time"
      />
    ));

    expect(screen.getByText("This field is required")).toBeDefined();
    expect(screen.queryByText("Select your preferred time")).toBeNull();
  });

  it("should initialize with provided value", () => {
    const testDate = new Date("2024-12-25T19:30:00");
    const { container } = render(() => <DateTimePicker value={testDate} />);

    const dateInput = getDateInput(container);
    const timeInput = getTimeInput(container);

    expect(dateInput.value).toBe("2024-12-25");
    expect(timeInput.value).toBe("19:30");
  });

  it("should call onChange when date is changed", () => {
    const onChange = vi.fn();
    const { container } = render(() => <DateTimePicker onChange={onChange} />);

    const dateInput = getDateInput(container);
    fireEvent.input(dateInput, { target: { value: "2024-12-25" } });

    expect(onChange).toHaveBeenCalled();
  });

  it("should call onChange when time is changed", () => {
    const onChange = vi.fn();
    const { container } = render(() => <DateTimePicker onChange={onChange} />);

    const timeInput = getTimeInput(container);
    fireEvent.input(timeInput, { target: { value: "19:30" } });

    expect(onChange).toHaveBeenCalled();
  });

  it("should call onChange with combined date and time", () => {
    const onChange = vi.fn();
    const { container } = render(() => <DateTimePicker onChange={onChange} />);

    const dateInput = getDateInput(container);
    const timeInput = getTimeInput(container);

    // Set date first
    fireEvent.input(dateInput, { target: { value: "2024-12-25" } });
    // Then set time
    fireEvent.input(timeInput, { target: { value: "19:30" } });

    // Should be called with a valid Date object
    expect(onChange).toHaveBeenCalledWith(expect.any(Date));

    // Get the last call to verify the date
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    const resultDate = lastCall[0] as Date;
    expect(resultDate.getFullYear()).toBe(2024);
    expect(resultDate.getMonth()).toBe(11); // December is month 11
    expect(resultDate.getDate()).toBe(25);
    expect(resultDate.getHours()).toBe(19);
    expect(resultDate.getMinutes()).toBe(30);
  });

  it("should disable inputs when disabled prop is true", () => {
    const { container } = render(() => <DateTimePicker disabled />);

    const dateInput = getDateInput(container);
    const timeInput = getTimeInput(container);

    expect(dateInput.disabled).toBe(true);
    expect(timeInput.disabled).toBe(true);
  });

  it("should set required attribute when required prop is true", () => {
    const { container } = render(() => <DateTimePicker required />);

    const dateInput = getDateInput(container);
    const timeInput = getTimeInput(container);

    expect(dateInput.required).toBe(true);
    expect(timeInput.required).toBe(true);
  });

  it("should set min date to today by default", () => {
    const { container } = render(() => <DateTimePicker />);

    const dateInput = getDateInput(container);
    const today = new Date().toISOString().split("T")[0];

    expect(dateInput.min).toBe(today);
  });

  it("should set custom min date when provided", () => {
    const minDate = new Date("2024-12-01");
    const { container } = render(() => <DateTimePicker minDate={minDate} />);

    const dateInput = getDateInput(container);

    expect(dateInput.min).toBe("2024-12-01");
  });

  it("should set custom max date when provided", () => {
    const maxDate = new Date("2025-12-31");
    const { container } = render(() => <DateTimePicker maxDate={maxDate} />);

    const dateInput = getDateInput(container);

    expect(dateInput.max).toBe("2025-12-31");
  });

  it("should apply error styling when error is present", () => {
    const { container } = render(() => <DateTimePicker error="Invalid date" />);

    const dateInput = getDateInput(container);
    const timeInput = getTimeInput(container);

    expect(dateInput.className).toContain("border-red-300");
    expect(dateInput.className).toContain("focus:ring-red-500");
    expect(timeInput.className).toContain("border-red-300");
    expect(timeInput.className).toContain("focus:ring-red-500");
  });

  it("should apply normal styling when no error", () => {
    const { container } = render(() => <DateTimePicker />);

    const dateInput = getDateInput(container);
    const timeInput = getTimeInput(container);

    expect(dateInput.className).toContain("border-gray-300");
    expect(dateInput.className).toContain("focus:ring-blue-500");
    expect(timeInput.className).toContain("border-gray-300");
    expect(timeInput.className).toContain("focus:ring-blue-500");
  });
});
