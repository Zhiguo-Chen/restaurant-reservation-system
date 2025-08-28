import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { ReservationForm } from "../ReservationForm";
import { reservationService } from "../../../services/reservationService";
import { ReservationStatus } from "../../types";

// Mock the reservation service
vi.mock("../../../services/reservationService", () => ({
  reservationService: {
    createReservation: vi.fn(),
  },
}));

const mockReservationService = reservationService as any;

describe("ReservationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render reservation form with all fields", () => {
    render(() => <ReservationForm />);

    expect(screen.getByText("Make a Reservation")).toBeDefined();
    expect(screen.getByLabelText("Guest Name")).toBeDefined();
    expect(screen.getByLabelText("Phone Number")).toBeDefined();
    expect(screen.getByLabelText("Email Address")).toBeDefined();
    expect(screen.getByLabelText("Arrival Date & Time")).toBeDefined();
    expect(screen.getByLabelText("Table Size")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Create Reservation" })
    ).toBeDefined();
  });

  it("should show validation errors for empty required fields", async () => {
    render(() => <ReservationForm />);

    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Guest name is required")).toBeDefined();
      expect(screen.getByText("Phone number is required")).toBeDefined();
      expect(screen.getByText("Email address is required")).toBeDefined();
      expect(
        screen.getByText("Arrival date and time is required")
      ).toBeDefined();
    });
  });

  it("should validate guest name length", async () => {
    render(() => <ReservationForm />);

    const nameInput = screen.getByLabelText("Guest Name");
    fireEvent.input(nameInput, { target: { value: "A" } });

    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Guest name must be at least 2 characters")
      ).toBeDefined();
    });
  });

  it("should validate email format", async () => {
    render(() => <ReservationForm />);

    const emailInput = screen.getByLabelText("Email Address");
    fireEvent.input(emailInput, { target: { value: "invalid-email" } });

    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeDefined();
    });
  });

  it("should validate phone number format", async () => {
    render(() => <ReservationForm />);

    const phoneInput = screen.getByLabelText("Phone Number");
    fireEvent.input(phoneInput, { target: { value: "123" } });

    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid phone number")
      ).toBeDefined();
    });
  });

  it("should clear field errors when user starts typing", async () => {
    render(() => <ReservationForm />);

    const nameInput = screen.getByLabelText("Guest Name");
    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });

    // Trigger validation error
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Guest name is required")).toBeDefined();
    });

    // Start typing to clear error
    fireEvent.input(nameInput, { target: { value: "John Doe" } });

    await waitFor(() => {
      expect(screen.queryByText("Guest name is required")).toBeNull();
    });
  });

  it("should handle successful form submission", async () => {
    const mockReservation = {
      id: "reservation-123",
      guestName: "John Doe",
      guestPhone: "+1234567890",
      guestEmail: "john@example.com",
      arrivalTime: new Date("2024-12-25T19:00:00"),
      tableSize: 4,
      status: ReservationStatus.REQUESTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReservationService.createReservation.mockResolvedValue(mockReservation);

    const onSuccess = vi.fn();
    render(() => <ReservationForm onSuccess={onSuccess} />);

    // Fill out the form
    fireEvent.input(screen.getByLabelText("Guest Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.input(screen.getByLabelText("Phone Number"), {
      target: { value: "+1234567890" },
    });
    fireEvent.input(screen.getByLabelText("Email Address"), {
      target: { value: "john@example.com" },
    });

    // Set table size
    const tableSizeSelect = screen.getByLabelText("Table Size");
    fireEvent.change(tableSizeSelect, { target: { value: "4" } });

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockReservationService.createReservation).toHaveBeenCalledWith({
        guestName: "John Doe",
        guestPhone: "+1234567890",
        guestEmail: "john@example.com",
        arrivalTime: expect.any(Date),
        tableSize: 4,
        notes: undefined,
      });
      expect(onSuccess).toHaveBeenCalledWith("reservation-123");
    });
  });

  it("should handle form submission error", async () => {
    mockReservationService.createReservation.mockRejectedValue(
      new Error("Server error")
    );

    const onError = vi.fn();
    render(() => <ReservationForm onError={onError} />);

    // Fill out the form with valid data
    fireEvent.input(screen.getByLabelText("Guest Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.input(screen.getByLabelText("Phone Number"), {
      target: { value: "+1234567890" },
    });
    fireEvent.input(screen.getByLabelText("Email Address"), {
      target: { value: "john@example.com" },
    });

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeDefined();
      expect(onError).toHaveBeenCalledWith("Server error");
    });
  });

  it("should show success message after successful submission", async () => {
    const mockReservation = {
      id: "reservation-123",
      guestName: "John Doe",
      guestPhone: "+1234567890",
      guestEmail: "john@example.com",
      arrivalTime: new Date("2024-12-25T19:00:00"),
      tableSize: 4,
      status: ReservationStatus.REQUESTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReservationService.createReservation.mockResolvedValue(mockReservation);

    render(() => <ReservationForm />);

    // Fill out and submit form
    fireEvent.input(screen.getByLabelText("Guest Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.input(screen.getByLabelText("Phone Number"), {
      target: { value: "+1234567890" },
    });
    fireEvent.input(screen.getByLabelText("Email Address"), {
      target: { value: "john@example.com" },
    });

    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Reservation Confirmed!")).toBeDefined();
      expect(
        screen.getByText(
          "Your reservation has been successfully submitted. You will receive a confirmation email shortly."
        )
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Make Another Reservation" })
      ).toBeDefined();
    });
  });

  it("should reset form when clicking 'Make Another Reservation'", async () => {
    const mockReservation = {
      id: "reservation-123",
      guestName: "John Doe",
      guestPhone: "+1234567890",
      guestEmail: "john@example.com",
      arrivalTime: new Date("2024-12-25T19:00:00"),
      tableSize: 4,
      status: ReservationStatus.REQUESTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReservationService.createReservation.mockResolvedValue(mockReservation);

    render(() => <ReservationForm />);

    // Fill out and submit form
    fireEvent.input(screen.getByLabelText("Guest Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.input(screen.getByLabelText("Phone Number"), {
      target: { value: "+1234567890" },
    });
    fireEvent.input(screen.getByLabelText("Email Address"), {
      target: { value: "john@example.com" },
    });

    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText("Reservation Confirmed!")).toBeDefined();
    });

    // Click reset button
    const resetButton = screen.getByRole("button", {
      name: "Make Another Reservation",
    });
    fireEvent.click(resetButton);

    // Form should be reset
    await waitFor(() => {
      expect(screen.getByText("Make a Reservation")).toBeDefined();
      expect(
        (screen.getByLabelText("Guest Name") as HTMLInputElement).value
      ).toBe("");
    });
  });

  it("should show loading state during submission", async () => {
    // Create a promise that we can control
    let resolveReservation: (value: any) => void;
    const reservationPromise = new Promise((resolve) => {
      resolveReservation = resolve;
    });
    mockReservationService.createReservation.mockReturnValue(
      reservationPromise
    );

    render(() => <ReservationForm />);

    // Fill out form
    fireEvent.input(screen.getByLabelText("Guest Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.input(screen.getByLabelText("Phone Number"), {
      target: { value: "+1234567890" },
    });
    fireEvent.input(screen.getByLabelText("Email Address"), {
      target: { value: "john@example.com" },
    });

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Reservation",
    });
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText("Creating Reservation...")).toBeDefined();
      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    // Resolve the promise
    resolveReservation!({
      id: "reservation-123",
      guestName: "John Doe",
      guestPhone: "+1234567890",
      guestEmail: "john@example.com",
      arrivalTime: new Date(),
      tableSize: 4,
      status: ReservationStatus.REQUESTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText("Reservation Confirmed!")).toBeDefined();
    });
  });
});
