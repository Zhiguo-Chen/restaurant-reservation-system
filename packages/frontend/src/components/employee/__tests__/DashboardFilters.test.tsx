import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { DashboardFilters } from "../DashboardFilters";
import { ReservationStatus } from "@restaurant-reservation/shared";

describe("DashboardFilters", () => {
  const defaultProps = {
    filters: {},
    onFiltersChange: vi.fn(),
    onClearFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render filters component", () => {
    render(() => <DashboardFilters {...defaultProps} />);

    expect(screen.getByText("Filters")).toBeDefined();
    expect(screen.getByText("Quick Date Filters")).toBeDefined();
    expect(screen.getByText("Date Range")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
  });

  it("should show quick date filter buttons", () => {
    render(() => <DashboardFilters {...defaultProps} />);

    expect(screen.getByText("Today")).toBeDefined();
    expect(screen.getByText("Next 7 Days")).toBeDefined();
    expect(screen.getByText("Next 30 Days")).toBeDefined();
  });

  it("should expand to show more filters", () => {
    render(() => <DashboardFilters {...defaultProps} />);

    const moreFiltersButton = screen.getByText("More Filters");
    fireEvent.click(moreFiltersButton);

    expect(screen.getByText("Guest Name")).toBeDefined();
    expect(screen.getByText("Guest Email")).toBeDefined();
    expect(screen.getByText("Table Size")).toBeDefined();
  });

  it("should call onFiltersChange when quick date filter is clicked", () => {
    const onFiltersChange = vi.fn();
    render(() => (
      <DashboardFilters {...defaultProps} onFiltersChange={onFiltersChange} />
    ));

    const todayButton = screen.getByText("Today");
    fireEvent.click(todayButton);

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    );
  });

  it("should show clear all button when filters are active", () => {
    const filtersWithData = {
      startDate: new Date(),
      status: [ReservationStatus.REQUESTED],
    };

    render(() => (
      <DashboardFilters {...defaultProps} filters={filtersWithData} />
    ));

    expect(screen.getByText("Clear All")).toBeDefined();
  });

  it("should call onClearFilters when clear all is clicked", () => {
    const onClearFilters = vi.fn();
    const filtersWithData = {
      startDate: new Date(),
      status: [ReservationStatus.REQUESTED],
    };

    render(() => (
      <DashboardFilters
        {...defaultProps}
        filters={filtersWithData}
        onClearFilters={onClearFilters}
      />
    ));

    const clearButton = screen.getByText("Clear All");
    fireEvent.click(clearButton);

    expect(onClearFilters).toHaveBeenCalled();
  });

  it("should show active filter indicators", () => {
    const filtersWithData = {
      startDate: new Date(),
      endDate: new Date(),
      status: [ReservationStatus.REQUESTED, ReservationStatus.APPROVED],
      guestName: "John",
    };

    render(() => (
      <DashboardFilters {...defaultProps} filters={filtersWithData} />
    ));

    expect(screen.getByText("Active filters:")).toBeDefined();
    expect(screen.getByText("Date Range")).toBeDefined();
    expect(screen.getByText("Status (2)")).toBeDefined();
    expect(screen.getByText("Guest Name")).toBeDefined();
  });

  it("should disable inputs when loading", () => {
    render(() => <DashboardFilters {...defaultProps} loading={true} />);

    const todayButton = screen.getByText("Today");
    expect((todayButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("should handle guest name input", () => {
    const onFiltersChange = vi.fn();
    render(() => (
      <DashboardFilters {...defaultProps} onFiltersChange={onFiltersChange} />
    ));

    // Expand to show more filters
    const moreFiltersButton = screen.getByText("More Filters");
    fireEvent.click(moreFiltersButton);

    const guestNameInput = screen.getByPlaceholderText("Search by guest name");
    fireEvent.input(guestNameInput, { target: { value: "John Doe" } });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        guestName: "John Doe",
      })
    );
  });

  it("should handle guest email input", () => {
    const onFiltersChange = vi.fn();
    render(() => (
      <DashboardFilters {...defaultProps} onFiltersChange={onFiltersChange} />
    ));

    // Expand to show more filters
    const moreFiltersButton = screen.getByText("More Filters");
    fireEvent.click(moreFiltersButton);

    const guestEmailInput = screen.getByPlaceholderText(
      "Search by guest email"
    );
    fireEvent.input(guestEmailInput, { target: { value: "john@example.com" } });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        guestEmail: "john@example.com",
      })
    );
  });

  it("should handle table size selection", () => {
    const onFiltersChange = vi.fn();
    render(() => (
      <DashboardFilters {...defaultProps} onFiltersChange={onFiltersChange} />
    ));

    // Expand to show more filters
    const moreFiltersButton = screen.getByText("More Filters");
    fireEvent.click(moreFiltersButton);

    const tableSizeSelect = screen.getByDisplayValue("All sizes");
    fireEvent.change(tableSizeSelect, { target: { value: "4" } });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tableSize: 4,
      })
    );
  });

  it("should toggle between more and less filters", () => {
    render(() => <DashboardFilters {...defaultProps} />);

    const toggleButton = screen.getByText("More Filters");
    fireEvent.click(toggleButton);

    expect(screen.getByText("Less Filters")).toBeDefined();

    fireEvent.click(screen.getByText("Less Filters"));
    expect(screen.getByText("More Filters")).toBeDefined();
  });

  it("should not show clear all button when no filters are active", () => {
    render(() => <DashboardFilters {...defaultProps} filters={{}} />);

    expect(screen.queryByText("Clear All")).toBeNull();
  });
});
