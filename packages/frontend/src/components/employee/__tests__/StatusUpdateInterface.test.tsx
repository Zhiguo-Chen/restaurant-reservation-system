import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { StatusUpdateInterface } from "../StatusUpdateInterface";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";

const mockReservation: Reservation = {
  id: "reservation-123",
  guestName: "John Doe",
  guestPhone: "+1234567890",
  guestEmail: "john@example.com",
  arrivalTime: new Date("2024-12-25T19:00:00"),
  tableSize: 4,
  status: ReservationStatus.REQUESTED,
  notes: "Birthday celebration",
  createdAt: new Date("2024-12-01T10:00:00"),
  updatedAt: new Date("2024-12-01T10:00:00"),
};

describe("StatusUpdateInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render status management interface", () => {
    render(() => <StatusUpdateInterface reservation={mockReservation} />);

    expect(screen.getByText("Status Management")).toBeDefined();
    expect(screen.getByText("Current Status:")).toBeDefined();
    expect(screen.getByText("Pending")).toBeDefined();
  });

  it("should show quick actions for requested reservations", () => {
    render(() => <StatusUpdateInterface reservation={mockReservation} />);

    expect(screen.getByText("Quick Actions")).toBeDefined();
    expect(screen.getByText("Approve")).toBeDefined();
    expect(screen.getByText("Decline")).toBeDefined();
  });

  it("should show different actions for approved reservations", () => {
    const approvedReservation = {
      ...mockReservation,
      status: ReservationStatus.APPROVED,
    };
    render(() => <StatusUpdateInterface reservation={approvedReservation} />);

    expect(screen.getByText("Mark Complete")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("should not show actions for completed reservations", () => {
    const completedReservation = {
      ...mockReservation,
      status: ReservationStatus.COMPLETED,
    };
    render(() => <StatusUpdateInterface reservation={completedReservation} />);

    expect(screen.queryByText("Quick Actions")).toBeNull();
    expect(screen.queryByText("Approve")).toBeNull();
    expect(screen.queryByText("Mark Complete")).toBeNull();
  });

  it("should show status history", () => {
    render(() => <StatusUpdateInterface reservation={mockReservation} />);

    expect(screen.getByText("Status History")).toBeDefined();
    expect(screen.getByText("Current")).toBeDefined();
  });

  it("should open modal when quick action is clicked", async () => {
    render(() => <StatusUpdateInterface reservation={mockReservation} />);

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText("Update Reservation Status")).toBeDefined();
      expect(screen.getByText("Update to Confirmed")).toBeDefined();
    });
  });

  it("should call onStatusUpdate when confirmed", async () => {
    const onStatusUpdate = vi.fn().mockResolvedValue(undefined);
    render(() => (
      <StatusUpdateInterface
        reservation={mockReservation}
        onStatusUpdate={onStatusUpdate}
      />
    ));

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText("Update to Confirmed")).toBeDefined();
    });

    const confirmButton = screen.getByText("Update to Confirmed");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onStatusUpdate).toHaveBeenCalledWith(
        ReservationStatus.APPROVED,
        undefined
      );
    });
  });

  it("should require notes for cancellation", async () => {
    render(() => <StatusUpdateInterface reservation={mockReservation} />);

    const declineButton = screen.getByText("Decline");
    fireEvent.click(declineButton);

    await waitFor(() => {
      expect(screen.getByText("Update to Cancelled")).toBeDefined();
    });

    const confirmButton = screen.getByText("Update to Cancelled");
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);

    const notesTextarea = screen.getByPlaceholderText(
      "Please provide a reason for cancellation..."
    );
    fireEvent.input(notesTextarea, {
      target: { value: "Guest requested cancellation" },
    });

    expect((confirmButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("should show loading state during update", async () => {
    let resolveUpdate: (value: any) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    const onStatusUpdate = vi.fn().mockReturnValue(updatePromise);

    render(() => (
      <StatusUpdateInterface
        reservation={mockReservation}
        onStatusUpdate={onStatusUpdate}
      />
    ));

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText("Update to Confirmed")).toBeDefined();
    });

    const confirmButton = screen.getByText("Update to Confirmed");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText("Updating...")).toBeDefined();
      expect((confirmButton as HTMLButtonElement).disabled).toBe(true);
    });

    // Resolve the update
    resolveUpdate!(undefined);
  });

  it("should close modal when cancel is clicked", async () => {
    render(() => <StatusUpdateInterface reservation={mockReservation} />);

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText("Update Reservation Status")).toBeDefined();
    });

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Update Reservation Status")).toBeNull();
    });
  });

  it("should display reservation details in modal", async () => {
    render(() => <StatusUpdateInterface reservation={mockReservation} />);

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText("Reservation Details:")).toBeDefined();
      expect(screen.getByText("John Doe")).toBeDefined();
      expect(screen.getByText("4 people")).toBeDefined();
    });
  });

  it("should handle notes input", async () => {
    const onStatusUpdate = vi.fn().mockResolvedValue(undefined);
    render(() => (
      <StatusUpdateInterface
        reservation={mockReservation}
        onStatusUpdate={onStatusUpdate}
      />
    ));

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText("Update to Confirmed")).toBeDefined();
    });

    const notesTextarea = screen.getByPlaceholderText(
      "Optional notes about this status change..."
    );
    fireEvent.input(notesTextarea, {
      target: { value: "Approved by manager" },
    });

    const confirmButton = screen.getByText("Update to Confirmed");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onStatusUpdate).toHaveBeenCalledWith(
        ReservationStatus.APPROVED,
        "Approved by manager"
      );
    });
  });

  it("should show character count for notes", async () => {
    render(() => <StatusUpdateInterface reservation={mockReservation} />);

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText("0/500 characters")).toBeDefined();
    });

    const notesTextarea = screen.getByPlaceholderText(
      "Optional notes about this status change..."
    );
    fireEvent.input(notesTextarea, { target: { value: "Test note" } });

    await waitFor(() => {
      expect(screen.getByText("9/500 characters")).toBeDefined();
    });
  });

  it("should disable interface when loading prop is true", () => {
    render(() => (
      <StatusUpdateInterface reservation={mockReservation} loading={true} />
    ));

    const approveButton = screen.getByText("Approve");
    expect((approveButton as HTMLButtonElement).disabled).toBe(true);
  });
});
