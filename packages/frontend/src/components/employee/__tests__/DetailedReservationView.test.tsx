import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { DetailedReservationView } from "../DetailedReservationView";
import { Reservation, ReservationStatus } from "../../types";

const mockReservation: Reservation = {
  id: "reservation-123",
  guestName: "John Doe",
  guestPhone: "+1234567890",
  guestEmail: "john@example.com",
  arrivalTime: new Date("2024-12-25T19:00:00"),
  tableSize: 4,
  status: ReservationStatus.APPROVED,
  notes: "Birthday celebration",
  createdAt: new Date("2024-12-01T10:00:00"),
  updatedAt: new Date("2024-12-02T11:00:00"),
  updatedBy: "admin@restaurant.com",
};

describe("DetailedReservationView", () => {
  it("should render reservation details", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    expect(screen.getByText("Reservation Details")).toBeDefined();
    expect(screen.getByText("ID: reservation-123")).toBeDefined();
    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("+1234567890")).toBeDefined();
    expect(screen.getByText("john@example.com")).toBeDefined();
    expect(screen.getByText("Birthday celebration")).toBeDefined();
  });

  it("should display correct status badge", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    expect(screen.getByText("Confirmed")).toBeDefined();
  });

  it("should show back button when onBack is provided", () => {
    const onBack = vi.fn();
    render(() => (
      <DetailedReservationView reservation={mockReservation} onBack={onBack} />
    ));

    const backButton = screen.getByText("Back to Dashboard");
    expect(backButton).toBeDefined();

    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalled();
  });

  it("should make contact information clickable", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    const phoneLink = screen.getByText("+1234567890").closest("a");
    const emailLink = screen.getByText("john@example.com").closest("a");

    expect(phoneLink?.getAttribute("href")).toBe("tel:+1234567890");
    expect(emailLink?.getAttribute("href")).toBe("mailto:john@example.com");
  });

  it("should display reservation timing information", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    // Check for date and time display (exact format may vary)
    expect(screen.getByText(/December/)).toBeDefined();
    expect(screen.getByText(/25/)).toBeDefined();
    expect(screen.getByText(/2024/)).toBeDefined();
  });

  it("should show party size correctly", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    expect(screen.getByText("4 people")).toBeDefined();
  });

  it("should display singular person for table size of 1", () => {
    const singlePersonReservation = { ...mockReservation, tableSize: 1 };
    render(() => (
      <DetailedReservationView reservation={singlePersonReservation} />
    ));

    expect(screen.getByText("1 person")).toBeDefined();
  });

  it("should show booking information", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    expect(screen.getByText("Booking Information")).toBeDefined();
    expect(screen.getByText("Created")).toBeDefined();
    expect(screen.getByText("Last Updated")).toBeDefined();
    expect(screen.getByText("by admin@restaurant.com")).toBeDefined();
  });

  it("should handle reservation without notes", () => {
    const reservationWithoutNotes = { ...mockReservation, notes: undefined };
    render(() => (
      <DetailedReservationView reservation={reservationWithoutNotes} />
    ));

    expect(screen.queryByText("Special Requests")).toBeNull();
  });

  it("should handle reservation without updatedBy", () => {
    const reservationWithoutUpdatedBy = {
      ...mockReservation,
      updatedBy: undefined,
    };
    render(() => (
      <DetailedReservationView reservation={reservationWithoutUpdatedBy} />
    ));

    expect(screen.queryByText(/by /)).toBeNull();
  });

  it("should show status-specific information for pending reservations", () => {
    const pendingReservation = {
      ...mockReservation,
      status: ReservationStatus.REQUESTED,
    };
    render(() => <DetailedReservationView reservation={pendingReservation} />);

    expect(screen.getByText("Pending Approval")).toBeDefined();
    expect(
      screen.getByText(/This reservation is awaiting approval/)
    ).toBeDefined();
  });

  it("should show status-specific information for confirmed reservations", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    expect(screen.getByText("Confirmed Reservation")).toBeDefined();
    expect(screen.getByText(/This reservation is confirmed/)).toBeDefined();
  });

  it("should show status-specific information for cancelled reservations", () => {
    const cancelledReservation = {
      ...mockReservation,
      status: ReservationStatus.CANCELLED,
    };
    render(() => (
      <DetailedReservationView reservation={cancelledReservation} />
    ));

    expect(screen.getByText("Cancelled Reservation")).toBeDefined();
    expect(
      screen.getByText(/This reservation has been cancelled/)
    ).toBeDefined();
  });

  it("should show status-specific information for completed reservations", () => {
    const completedReservation = {
      ...mockReservation,
      status: ReservationStatus.COMPLETED,
    };
    render(() => (
      <DetailedReservationView reservation={completedReservation} />
    ));

    expect(screen.getByText("Completed Reservation")).toBeDefined();
    expect(
      screen.getByText(/This reservation has been completed/)
    ).toBeDefined();
  });

  it("should display time until arrival for upcoming reservations", () => {
    // Create a reservation for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const upcomingReservation = { ...mockReservation, arrivalTime: tomorrow };

    render(() => <DetailedReservationView reservation={upcomingReservation} />);

    expect(screen.getByText("Time Until Arrival")).toBeDefined();
  });

  it("should display time since scheduled for past reservations", () => {
    // Create a reservation for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastReservation = { ...mockReservation, arrivalTime: yesterday };

    render(() => <DetailedReservationView reservation={pastReservation} />);

    expect(screen.getByText("Time Since Scheduled")).toBeDefined();
  });

  it("should show guest details section", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    expect(screen.getByText("Guest Details")).toBeDefined();
    expect(screen.getByText("Guest Name")).toBeDefined();
    expect(screen.getByText("Phone Number")).toBeDefined();
    expect(screen.getByText("Email Address")).toBeDefined();
  });

  it("should show reservation details section", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    expect(screen.getByText("Reservation Details")).toBeDefined();
    expect(screen.getByText("Date")).toBeDefined();
    expect(screen.getByText("Time")).toBeDefined();
    expect(screen.getByText("Party Size")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
  });

  it("should format dates and times correctly", () => {
    render(() => <DetailedReservationView reservation={mockReservation} />);

    // Check if date/time formatting is working (exact format may vary by locale)
    expect(screen.getByText(/Dec/)).toBeDefined();
    expect(screen.getByText(/2024/)).toBeDefined();
  });
});
