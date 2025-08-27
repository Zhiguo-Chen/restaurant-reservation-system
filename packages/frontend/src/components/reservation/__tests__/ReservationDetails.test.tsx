import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ReservationDetails } from "../ReservationDetails";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";

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
  updatedAt: new Date("2024-12-01T10:00:00"),
};

describe("ReservationDetails", () => {
  it("should render reservation details", () => {
    render(() => <ReservationDetails reservation={mockReservation} />);

    expect(screen.getByText("Reservation Details")).toBeDefined();
    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("john@example.com")).toBeDefined();
    expect(screen.getByText("+1234567890")).toBeDefined();
    expect(screen.getByText("4 people")).toBeDefined();
    expect(screen.getByText("Birthday celebration")).toBeDefined();
  });

  it("should display reservation ID", () => {
    render(() => <ReservationDetails reservation={mockReservation} />);

    expect(screen.getByText("Reservation ID: reservation-123")).toBeDefined();
  });

  it("should format dates correctly", () => {
    render(() => <ReservationDetails reservation={mockReservation} />);

    // Check if date formatting is working (exact format may vary by locale)
    expect(screen.getByText(/December/)).toBeDefined();
    expect(screen.getByText(/25/)).toBeDefined();
    expect(screen.getByText(/2024/)).toBeDefined();
  });

  it("should show correct status badge for approved reservation", () => {
    render(() => <ReservationDetails reservation={mockReservation} />);

    expect(screen.getByText("Confirmed")).toBeDefined();
  });

  it("should show correct status badge for requested reservation", () => {
    const requestedReservation = {
      ...mockReservation,
      status: ReservationStatus.REQUESTED,
    };
    render(() => <ReservationDetails reservation={requestedReservation} />);

    expect(screen.getByText("Pending Approval")).toBeDefined();
  });

  it("should show correct status badge for cancelled reservation", () => {
    const cancelledReservation = {
      ...mockReservation,
      status: ReservationStatus.CANCELLED,
    };
    render(() => <ReservationDetails reservation={cancelledReservation} />);

    expect(screen.getByText("Cancelled")).toBeDefined();
  });

  it("should show action buttons when showActions is true", () => {
    const onEdit = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <ReservationDetails
        reservation={mockReservation}
        onEdit={onEdit}
        onCancel={onCancel}
        showActions={true}
      />
    ));

    expect(screen.getByText("Modify Reservation")).toBeDefined();
    expect(screen.getByText("Cancel Reservation")).toBeDefined();
  });

  it("should hide action buttons when showActions is false", () => {
    render(() => (
      <ReservationDetails reservation={mockReservation} showActions={false} />
    ));

    expect(screen.queryByText("Modify Reservation")).toBeNull();
    expect(screen.queryByText("Cancel Reservation")).toBeNull();
  });

  it("should call onEdit when modify button is clicked", () => {
    const onEdit = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <ReservationDetails
        reservation={mockReservation}
        onEdit={onEdit}
        onCancel={onCancel}
      />
    ));

    const modifyButton = screen.getByText("Modify Reservation");
    fireEvent.click(modifyButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it("should call onCancel when cancel button is clicked", () => {
    const onEdit = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <ReservationDetails
        reservation={mockReservation}
        onEdit={onEdit}
        onCancel={onCancel}
      />
    ));

    const cancelButton = screen.getByText("Cancel Reservation");
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("should not show action buttons for cancelled reservations", () => {
    const cancelledReservation = {
      ...mockReservation,
      status: ReservationStatus.CANCELLED,
    };
    const onEdit = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <ReservationDetails
        reservation={cancelledReservation}
        onEdit={onEdit}
        onCancel={onCancel}
      />
    ));

    expect(screen.queryByText("Modify Reservation")).toBeNull();
    expect(screen.queryByText("Cancel Reservation")).toBeNull();
  });

  it("should not show action buttons for completed reservations", () => {
    const completedReservation = {
      ...mockReservation,
      status: ReservationStatus.COMPLETED,
    };
    const onEdit = vi.fn();
    const onCancel = vi.fn();

    render(() => (
      <ReservationDetails
        reservation={completedReservation}
        onEdit={onEdit}
        onCancel={onCancel}
      />
    ));

    expect(screen.queryByText("Modify Reservation")).toBeNull();
    expect(screen.queryByText("Cancel Reservation")).toBeNull();
  });

  it("should show status-specific messages", () => {
    const requestedReservation = {
      ...mockReservation,
      status: ReservationStatus.REQUESTED,
    };
    render(() => <ReservationDetails reservation={requestedReservation} />);

    expect(screen.getByText(/Pending Approval:/)).toBeDefined();
    expect(
      screen.getByText(/Your reservation is being reviewed/)
    ).toBeDefined();
  });

  it("should handle reservation without notes", () => {
    const reservationWithoutNotes = { ...mockReservation, notes: undefined };
    render(() => <ReservationDetails reservation={reservationWithoutNotes} />);

    expect(screen.queryByText("Special Requests")).toBeNull();
  });

  it("should display singular person for table size of 1", () => {
    const singlePersonReservation = { ...mockReservation, tableSize: 1 };
    render(() => <ReservationDetails reservation={singlePersonReservation} />);

    expect(screen.getByText("1 person")).toBeDefined();
  });
});
