import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { ReservationLookup } from "../ReservationLookup";

describe("ReservationLookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render lookup form with all fields", () => {
    render(() => <ReservationLookup />);

    expect(screen.getByText("Find Your Reservation")).toBeDefined();
    expect(screen.getByLabelText("Email Address")).toBeDefined();
    expect(screen.getByLabelText("Phone Number")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Find Reservation" })
    ).toBeDefined();
  });

  it("should show validation errors for empty fields", async () => {
    render(() => <ReservationLookup />);

    const submitButton = screen.getByRole("button", {
      name: "Find Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email address is required")).toBeDefined();
      expect(screen.getByText("Phone number is required")).toBeDefined();
    });
  });

  it("should validate email format", async () => {
    render(() => <ReservationLookup />);

    const emailInput = screen.getByLabelText("Email Address");
    fireEvent.input(emailInput, { target: { value: "invalid-email" } });

    const submitButton = screen.getByRole("button", {
      name: "Find Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeDefined();
    });
  });

  it("should validate phone number format", async () => {
    render(() => <ReservationLookup />);

    const phoneInput = screen.getByLabelText("Phone Number");
    fireEvent.input(phoneInput, { target: { value: "123" } });

    const submitButton = screen.getByRole("button", {
      name: "Find Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid phone number")
      ).toBeDefined();
    });
  });

  it("should clear field errors when user starts typing", async () => {
    render(() => <ReservationLookup />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", {
      name: "Find Reservation",
    });

    // Trigger validation error
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email address is required")).toBeDefined();
    });

    // Start typing to clear error
    fireEvent.input(emailInput, { target: { value: "test@example.com" } });

    await waitFor(() => {
      expect(screen.queryByText("Email address is required")).toBeNull();
    });
  });

  it("should call onReservationFound when reservation is found", async () => {
    const onReservationFound = vi.fn();
    render(() => <ReservationLookup onReservationFound={onReservationFound} />);

    // Fill out the form
    fireEvent.input(screen.getByLabelText("Email Address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.input(screen.getByLabelText("Phone Number"), {
      target: { value: "+1234567890" },
    });

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Find Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onReservationFound).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "reservation-123",
          guestEmail: "test@example.com",
          guestPhone: "+1234567890",
        })
      );
    });
  });

  it("should show loading state during search", async () => {
    render(() => <ReservationLookup />);

    // Fill out form
    fireEvent.input(screen.getByLabelText("Email Address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.input(screen.getByLabelText("Phone Number"), {
      target: { value: "+1234567890" },
    });

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Find Reservation",
    });
    fireEvent.click(submitButton);

    // Should show loading state briefly
    expect(screen.getByText("Searching...")).toBeDefined();
  });

  it("should disable form during search", async () => {
    render(() => <ReservationLookup />);

    // Fill out form
    fireEvent.input(screen.getByLabelText("Email Address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.input(screen.getByLabelText("Phone Number"), {
      target: { value: "+1234567890" },
    });

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Find Reservation",
    });
    fireEvent.click(submitButton);

    // Form should be disabled during search
    const emailInput = screen.getByLabelText(
      "Email Address"
    ) as HTMLInputElement;
    const phoneInput = screen.getByLabelText(
      "Phone Number"
    ) as HTMLInputElement;

    expect(emailInput.disabled).toBe(true);
    expect(phoneInput.disabled).toBe(true);
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("should show help text", () => {
    render(() => <ReservationLookup />);

    expect(
      screen.getByText(
        "Enter your email address and phone number to look up your reservation."
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        "Can't find your reservation? Please contact us for assistance."
      )
    ).toBeDefined();
  });
});
