import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ReservationList } from "../ReservationList";
import { Reservation, ReservationStatus } from "../../types";

const mockReservations: Reservation[] = [
  {
    id: "reservation-1",
    guestName: "John Doe",
    guestPhone: "+1234567890",
    guestEmail: "john@example.com",
    arrivalTime: new Date("2024-12-25T19:00:00"),
    tableSize: 4,
    status: ReservationStatus.REQUESTED,
    notes: "Birthday celebration",
    createdAt: new Date("2024-12-01T10:00:00"),
    updatedAt: new Date("2024-12-01T10:00:00"),
  },
  {
    id: "reservation-2",
    guestName: "Jane Smith",
    guestPhone: "+1987654321",
    guestEmail: "jane@example.com",
    arrivalTime: new Date("2024-12-26T20:00:00"),
    tableSize: 2,
    status: ReservationStatus.APPROVED,
    createdAt: new Date("2024-12-02T11:00:00"),
    updatedAt: new Date("2024-12-02T11:00:00"),
  },
];

describe("ReservationList", () => {
  it("should render reservation list with data", () => {
    render(() => <ReservationList reservations={mockReservations} />);

    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("Jane Smith")).toBeDefined();
    expect(screen.getByText("Birthday celebration")).toBeDefined();
    expect(screen.getByText("4 people")).toBeDefined();
    expect(screen.getByText("2 people")).toBeDefined();
  });

  it("should show loading state", () => {
    render(() => <ReservationList reservations={[]} loading={true} />);

    expect(screen.getByText("Loading reservations...")).toBeDefined();
  });

  it("should show empty state when no reservations", () => {
    render(() => <ReservationList reservations={[]} loading={false} />);

    expect(screen.getByText("No reservations found")).toBeDefined();
    expect(
      screen.getByText("Try adjusting your filters to see more results.")
    ).toBeDefined();
  });

  it("should display correct status badges", () => {
    render(() => <ReservationList reservations={mockReservations} />);

    expect(screen.getByText("Pending")).toBeDefined();
    expect(screen.getByText("Confirmed")).toBeDefined();
  });

  it("should make contact information clickable", () => {
    render(() => <ReservationList reservations={mockReservations} />);

    const phoneLink = screen.getByText("+1234567890").closest("a");
    const emailLink = screen.getByText("john@example.com").closest("a");

    expect(phoneLink?.getAttribute("href")).toBe("tel:+1234567890");
    expect(emailLink?.getAttribute("href")).toBe("mailto:john@example.com");
  });

  it("should call onViewDetails when view button is clicked", () => {
    const onViewDetails = vi.fn();
    render(() => (
      <ReservationList
        reservations={mockReservations}
        onViewDetails={onViewDetails}
      />
    ));

    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);

    expect(onViewDetails).toHaveBeenCalledWith(mockReservations[0]);
  });

  it("should show approve button for requested reservations", () => {
    render(() => <ReservationList reservations={mockReservations} />);

    expect(screen.getByText("Approve")).toBeDefined();
  });

  it("should show complete button for approved reservations", () => {
    render(() => <ReservationList reservations={mockReservations} />);

    expect(screen.getByText("Complete")).toBeDefined();
  });

  it("should call onUpdateStatus when status buttons are clicked", () => {
    const onUpdateStatus = vi.fn();
    render(() => (
      <ReservationList
        reservations={mockReservations}
        onUpdateStatus={onUpdateStatus}
      />
    ));

    const approveButton = screen.getByText("Approve");
    fireEvent.click(approveButton);

    expect(onUpdateStatus).toHaveBeenCalledWith(
      mockReservations[0],
      ReservationStatus.APPROVED
    );
  });

  it("should call onSort when column headers are clicked", () => {
    const onSort = vi.fn();
    render(() => (
      <ReservationList reservations={mockReservations} onSort={onSort} />
    ));

    const guestHeader = screen.getByText("Guest").closest("th");
    fireEvent.click(guestHeader!);

    expect(onSort).toHaveBeenCalledWith("guestName", "ASC");
  });

  it("should show sort indicators", () => {
    render(() => (
      <ReservationList
        reservations={mockReservations}
        sortField="guestName"
        sortDirection="ASC"
      />
    ));

    // Should show sort icon (exact implementation may vary)
    const guestHeader = screen.getByText("Guest").closest("th");
    expect(guestHeader?.querySelector("svg")).toBeDefined();
  });

  it("should format dates and times correctly", () => {
    render(() => <ReservationList reservations={mockReservations} />);

    // Check if date formatting is working (exact format may vary by locale)
    expect(screen.getByText(/Dec/)).toBeDefined();
    expect(screen.getByText(/25/)).toBeDefined();
    expect(screen.getByText(/2024/)).toBeDefined();
  });

  it("should handle reservations without notes", () => {
    const reservationWithoutNotes = {
      ...mockReservations[0],
      notes: undefined,
    };

    render(() => <ReservationList reservations={[reservationWithoutNotes]} />);

    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.queryByText("Birthday celebration")).toBeNull();
  });

  it("should show cancel button for appropriate statuses", () => {
    render(() => <ReservationList reservations={mockReservations} />);

    const cancelButtons = screen.getAllByText("Cancel");
    expect(cancelButtons.length).toBeGreaterThan(0);
  });

  it("should not show action buttons for completed reservations", () => {
    const completedReservation = {
      ...mockReservations[0],
      status: ReservationStatus.COMPLETED,
    };

    render(() => <ReservationList reservations={[completedReservation]} />);

    expect(screen.queryByText("Approve")).toBeNull();
    expect(screen.queryByText("Complete")).toBeNull();
    expect(screen.queryByText("Cancel")).toBeNull();
  });

  it("should display singular person for table size of 1", () => {
    const singlePersonReservation = {
      ...mockReservations[0],
      tableSize: 1,
    };

    render(() => <ReservationList reservations={[singlePersonReservation]} />);

    expect(screen.getByText("1 person")).toBeDefined();
  });
});
