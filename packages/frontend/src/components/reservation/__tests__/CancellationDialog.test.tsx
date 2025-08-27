import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { CancellationDialog } from "../CancellationDialog";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";
import { reservationService } from "../../../services/reservationService";

// Mock the reservation service
vi.mock("../../../services/reservationService", () => ({
  reservationService: {
    cancelReservation: vi.fn(),
  },
}));

const mockReservationService = reservationService as any;

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

describe("CancellationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(() => (
      <CancellationDialog
        isOpen={false}
        reservation={mockReservation}
        onClose={vi.fn()}
      />
    ));

    expect(screen.queryByText("Cancel Reservation")).toBeNull();
  });

  it("should render when isOpen is true", () => {
    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={mockReservation}
        onClose={vi.fn()}
      />
    ));

    expect(screen.getByText("Cancel Reservation")).toBeDefined();
    expect(
      screen.getByText("Are you sure you want to cancel this reservation?")
    ).toBeDefined();
  });

  it("should display reservation details", () => {
    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={mockReservation}
        onClose={vi.fn()}
      />
    ));

    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("4 people")).toBeDefined();
    expect(screen.getByText("Birthday celebration")).toBeDefined();
  });

  it("should call onClose when Keep Reservation is clicked", () => {
    const onClose = vi.fn();
    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={mockReservation}
        onClose={onClose}
      />
    ));

    const keepButton = screen.getByText("Keep Reservation");
    fireEvent.click(keepButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("should handle successful cancellation", async () => {
    const cancelledReservation = {
      ...mockReservation,
      status: ReservationStatus.CANCELLED,
    };
    mockReservationService.cancelReservation.mockResolvedValue(
      cancelledReservation
    );

    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={mockReservation}
        onSuccess={onSuccess}
        onClose={onClose}
      />
    ));

    const cancelButton = screen.getByText("Yes, Cancel Reservation");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockReservationService.cancelReservation).toHaveBeenCalledWith(
        "reservation-123"
      );
      expect(onSuccess).toHaveBeenCalledWith(cancelledReservation);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("should handle cancellation error", async () => {
    mockReservationService.cancelReservation.mockRejectedValue(
      new Error("Cancellation failed")
    );

    const onError = vi.fn();

    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={mockReservation}
        onClose={vi.fn()}
        onError={onError}
      />
    ));

    const cancelButton = screen.getByText("Yes, Cancel Reservation");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText("Cancellation failed")).toBeDefined();
      expect(onError).toHaveBeenCalledWith("Cancellation failed");
    });
  });

  it("should show loading state during cancellation", async () => {
    // Create a promise that we can control
    let resolveCancellation: (value: any) => void;
    const cancellationPromise = new Promise((resolve) => {
      resolveCancellation = resolve;
    });
    mockReservationService.cancelReservation.mockReturnValue(
      cancellationPromise
    );

    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={mockReservation}
        onClose={vi.fn()}
      />
    ));

    const cancelButton = screen.getByText("Yes, Cancel Reservation");
    fireEvent.click(cancelButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText("Cancelling...")).toBeDefined();
      expect((cancelButton as HTMLButtonElement).disabled).toBe(true);
    });

    // Resolve the cancellation
    resolveCancellation!({
      ...mockReservation,
      status: ReservationStatus.CANCELLED,
    });
  });

  it("should disable buttons during cancellation", async () => {
    let resolveCancellation: (value: any) => void;
    const cancellationPromise = new Promise((resolve) => {
      resolveCancellation = resolve;
    });
    mockReservationService.cancelReservation.mockReturnValue(
      cancellationPromise
    );

    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={mockReservation}
        onClose={vi.fn()}
      />
    ));

    const cancelButton = screen.getByText("Yes, Cancel Reservation");
    const keepButton = screen.getByText("Keep Reservation");

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect((cancelButton as HTMLButtonElement).disabled).toBe(true);
      expect((keepButton as HTMLButtonElement).disabled).toBe(true);
    });

    // Resolve the cancellation
    resolveCancellation!({
      ...mockReservation,
      status: ReservationStatus.CANCELLED,
    });
  });

  it("should show cancellation policy", () => {
    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={mockReservation}
        onClose={vi.fn()}
      />
    ));

    expect(screen.getByText(/Cancellation Policy:/)).toBeDefined();
    expect(screen.getByText(/up to 2 hours before/)).toBeDefined();
  });

  it("should handle reservation without notes", () => {
    const reservationWithoutNotes = { ...mockReservation, notes: undefined };
    render(() => (
      <CancellationDialog
        isOpen={true}
        reservation={reservationWithoutNotes}
        onClose={vi.fn()}
      />
    ));

    expect(screen.queryByText("Special Requests:")).toBeNull();
  });
});
