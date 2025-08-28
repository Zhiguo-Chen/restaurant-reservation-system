import { Component, createSignal, onMount, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Reservation, ReservationStatus } from "../../types";
import {
  reservationService,
  ReservationFilters,
  PaginationOptions,
  SortOptions,
} from "../../services/reservationService";
import { DashboardFilters } from "../../components/employee/DashboardFilters";
import { ReservationList } from "../../components/employee/ReservationList";
import { Button } from "../../components/ui";

const Dashboard: Component = () => {
  const navigate = useNavigate();

  const [reservations, setReservations] = createSignal<Reservation[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [totalCount, setTotalCount] = createSignal(0);

  // Filter and pagination state
  const [filters, setFilters] = createSignal<ReservationFilters>({});
  const [pagination, setPagination] = createSignal<PaginationOptions>({
    limit: 20,
    offset: 0,
  });
  const [sort, setSort] = createSignal<SortOptions>({
    field: "arrivalTime",
    direction: "ASC",
  });

  // Load reservations
  const loadReservations = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await reservationService.getReservations(
        filters(),
        pagination(),
        sort()
      );

      setReservations(result.data);
      setTotalCount(result.pagination.total);
    } catch (err) {
      console.error("Failed to load reservations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load reservations"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load reservations on mount and when filters/pagination/sort change
  onMount(() => {
    loadReservations();
  });

  const handleFiltersChange = (newFilters: ReservationFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination(), offset: 0 }); // Reset to first page
    loadReservations();
  };

  const handleClearFilters = () => {
    setFilters({});
    setPagination({ ...pagination(), offset: 0 });
    loadReservations();
  };

  const handleSort = (field: string, direction: "ASC" | "DESC") => {
    setSort({ field: field as any, direction });
    loadReservations();
  };

  const handleViewDetails = (reservation: Reservation) => {
    navigate(`/employee/reservations/${reservation.id}`);
  };

  const handleUpdateStatus = async (
    reservation: Reservation,
    status: ReservationStatus
  ) => {
    try {
      setLoading(true);
      await reservationService.updateReservationStatus(reservation.id, status);

      // Refresh the list
      await loadReservations();

      // Show success message (you could add a toast notification here)
      console.log(`Reservation ${reservation.id} status updated to ${status}`);
    } catch (err) {
      console.error("Failed to update reservation status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update reservation status"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const currentPagination = pagination();
    setPagination({
      ...currentPagination,
      offset: currentPagination.offset! + currentPagination.limit!,
    });
    loadReservations();
  };

  const hasMoreResults = () => {
    const current = pagination();
    return current.offset! + current.limit! < totalCount();
  };

  const getResultsText = () => {
    const current = pagination();
    const start = current.offset! + 1;
    const end = Math.min(current.offset! + current.limit!, totalCount());
    return `Showing ${start}-${end} of ${totalCount()} reservations`;
  };

  return (
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Reservation Dashboard
          </h1>
          <p class="mt-2 text-gray-600">
            Manage and track all restaurant reservations
          </p>
        </div>

        {/* Error Message */}
        <Show when={error()}>
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-600">{error()}</p>
              </div>
              <div class="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  class="text-red-400 hover:text-red-600"
                >
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Show>

        {/* Filters */}
        <DashboardFilters
          filters={filters()}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          loading={loading()}
        />

        {/* Results Summary */}
        <div class="mb-4 flex justify-between items-center">
          <p class="text-sm text-gray-700">{getResultsText()}</p>
          <Button
            onClick={loadReservations}
            variant="ghost"
            size="sm"
            loading={loading()}
            disabled={loading()}
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Reservation List */}
        <ReservationList
          reservations={reservations()}
          loading={loading()}
          onViewDetails={handleViewDetails}
          onUpdateStatus={handleUpdateStatus}
          onSort={handleSort}
          sortField={sort().field}
          sortDirection={sort().direction}
        />

        {/* Load More */}
        <Show when={hasMoreResults() && !loading()}>
          <div class="mt-6 text-center">
            <Button
              onClick={handleLoadMore}
              variant="secondary"
              loading={loading()}
              disabled={loading()}
            >
              Load More Reservations
            </Button>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Dashboard;
