import { Component, createSignal, Show } from "solid-js";
import { ReservationStatus } from "../../types";
import { Input, Button, DateRangePicker, MultiSelect } from "../ui";
import { ReservationFilters } from "../../services/reservationService";

interface DashboardFiltersProps {
  filters: ReservationFilters;
  onFiltersChange: (filters: ReservationFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export const DashboardFilters: Component<DashboardFiltersProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);

  const statusOptions = [
    { value: ReservationStatus.REQUESTED, label: "Pending" },
    { value: ReservationStatus.APPROVED, label: "Confirmed" },
    { value: ReservationStatus.CANCELLED, label: "Cancelled" },
    { value: ReservationStatus.COMPLETED, label: "Completed" },
  ];

  const tableSizeOptions = [
    { value: "1", label: "1 person" },
    { value: "2", label: "2 people" },
    { value: "3", label: "3 people" },
    { value: "4", label: "4 people" },
    { value: "5", label: "5 people" },
    { value: "6", label: "6 people" },
    { value: "7", label: "7 people" },
    { value: "8", label: "8 people" },
    { value: "9", label: "9 people" },
    { value: "10", label: "10 people" },
    { value: "11", label: "11 people" },
    { value: "12", label: "12 people" },
    { value: "13", label: "13 people" },
    { value: "14", label: "14 people" },
    { value: "15", label: "15 people" },
    { value: "16", label: "16 people" },
    { value: "17", label: "17 people" },
    { value: "18", label: "18 people" },
    { value: "19", label: "19 people" },
    { value: "20", label: "20 people" },
  ];

  const handleDateRangeChange = (range: {
    startDate: Date | null;
    endDate: Date | null;
  }) => {
    props.onFiltersChange({
      ...props.filters,
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined,
    });
  };

  const handleStatusChange = (statuses: string[]) => {
    props.onFiltersChange({
      ...props.filters,
      status:
        statuses.length > 0 ? (statuses as ReservationStatus[]) : undefined,
    });
  };

  const handleGuestNameChange = (value: string) => {
    props.onFiltersChange({
      ...props.filters,
      guestName: value.trim() || undefined,
    });
  };

  const handleGuestEmailChange = (value: string) => {
    props.onFiltersChange({
      ...props.filters,
      guestEmail: value.trim() || undefined,
    });
  };

  const handleTableSizeChange = (value: string) => {
    const tableSize = value ? parseInt(value) : undefined;
    props.onFiltersChange({
      ...props.filters,
      tableSize,
    });
  };

  const hasActiveFilters = () => {
    return !!(
      props.filters.startDate ||
      props.filters.endDate ||
      props.filters.status?.length ||
      props.filters.guestName ||
      props.filters.guestEmail ||
      props.filters.tableSize
    );
  };

  const getQuickDateRange = (days: number) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);

    return {
      startDate: today,
      endDate: endDate,
    };
  };

  const setQuickFilter = (range: { startDate: Date; endDate: Date }) => {
    props.onFiltersChange({
      ...props.filters,
      startDate: range.startDate,
      endDate: range.endDate,
    });
  };

  return (
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Filters</h2>
        <div class="flex items-center space-x-2">
          <Show when={hasActiveFilters()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={props.onClearFilters}
              disabled={props.loading}
            >
              Clear All
            </Button>
          </Show>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded())}
          >
            {isExpanded() ? "Less Filters" : "More Filters"}
            <svg
              class={`ml-1 h-4 w-4 transition-transform ${
                isExpanded() ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Quick Date Filters */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Quick Date Filters
        </label>
        <div class="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickFilter(getQuickDateRange(0))}
            disabled={props.loading}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickFilter(getQuickDateRange(6))}
            disabled={props.loading}
          >
            Next 7 Days
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickFilter(getQuickDateRange(29))}
            disabled={props.loading}
          >
            Next 30 Days
          </Button>
        </div>
      </div>

      {/* Main Filters */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DateRangePicker
          label="Date Range"
          value={{
            startDate: props.filters.startDate || null,
            endDate: props.filters.endDate || null,
          }}
          onChange={handleDateRangeChange}
          disabled={props.loading}
          helperText="Filter reservations by arrival date"
        />

        <MultiSelect
          label="Status"
          options={statusOptions}
          value={props.filters.status || []}
          onChange={handleStatusChange}
          placeholder="All statuses"
          disabled={props.loading}
        />

        <Show when={isExpanded()}>
          <Input
            label="Guest Name"
            type="text"
            placeholder="Search by guest name"
            value={props.filters.guestName || ""}
            onInput={(e) => handleGuestNameChange(e.currentTarget.value)}
            disabled={props.loading}
          />
        </Show>
      </div>

      <Show when={isExpanded()}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Guest Email"
            type="email"
            placeholder="Search by guest email"
            value={props.filters.guestEmail || ""}
            onInput={(e) => handleGuestEmailChange(e.currentTarget.value)}
            disabled={props.loading}
          />

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Table Size
            </label>
            <select
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={props.filters.tableSize?.toString() || ""}
              onChange={(e) => handleTableSizeChange(e.currentTarget.value)}
              disabled={props.loading}
            >
              <option value="">All sizes</option>
              {tableSizeOptions.map((option) => (
                <option value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Show>

      <Show when={hasActiveFilters()}>
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex flex-wrap gap-2">
            <span class="text-sm text-gray-600">Active filters:</span>
            <Show when={props.filters.startDate || props.filters.endDate}>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Date Range
              </span>
            </Show>
            <Show when={props.filters.status?.length}>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status ({props.filters.status!.length})
              </span>
            </Show>
            <Show when={props.filters.guestName}>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Guest Name
              </span>
            </Show>
            <Show when={props.filters.guestEmail}>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Guest Email
              </span>
            </Show>
            <Show when={props.filters.tableSize}>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Table Size
              </span>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};
