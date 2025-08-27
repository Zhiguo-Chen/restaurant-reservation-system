import { Component, For, Show } from "solid-js";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";
import { Badge, Button } from "../ui";

interface ReservationListProps {
  reservations: Reservation[];
  loading?: boolean;
  onViewDetails?: (reservation: Reservation) => void;
  onUpdateStatus?: (
    reservation: Reservation,
    status: ReservationStatus
  ) => void;
  onSort?: (field: string, direction: "ASC" | "DESC") => void;
  sortField?: string;
  sortDirection?: "ASC" | "DESC";
}

export const ReservationList: Component<ReservationListProps> = (props) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.REQUESTED:
        return "yellow";
      case ReservationStatus.APPROVED:
        return "green";
      case ReservationStatus.CANCELLED:
        return "red";
      case ReservationStatus.COMPLETED:
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusText = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.REQUESTED:
        return "Pending";
      case ReservationStatus.APPROVED:
        return "Confirmed";
      case ReservationStatus.CANCELLED:
        return "Cancelled";
      case ReservationStatus.COMPLETED:
        return "Completed";
      default:
        return status;
    }
  };

  const handleSort = (field: string) => {
    if (props.onSort) {
      const direction =
        props.sortField === field && props.sortDirection === "ASC"
          ? "DESC"
          : "ASC";
      props.onSort(field, direction);
    }
  };

  const getSortIcon = (field: string) => {
    if (props.sortField !== field) {
      return (
        <svg
          class="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return props.sortDirection === "ASC" ? (
      <svg
        class="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        class="w-4 h-4 text-blue-600"
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
    );
  };

  const canApprove = (reservation: Reservation) => {
    return reservation.status === ReservationStatus.REQUESTED;
  };

  const canComplete = (reservation: Reservation) => {
    return reservation.status === ReservationStatus.APPROVED;
  };

  const canCancel = (reservation: Reservation) => {
    return (
      reservation.status === ReservationStatus.REQUESTED ||
      reservation.status === ReservationStatus.APPROVED
    );
  };

  return (
    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <Show
        when={!props.loading}
        fallback={
          <div class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">Loading reservations...</p>
          </div>
        }
      >
        <Show
          when={props.reservations.length > 0}
          fallback={
            <div class="p-8 text-center text-gray-500">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">
                No reservations found
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                Try adjusting your filters to see more results.
              </p>
            </div>
          }
        >
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("guestName")}
                  >
                    <div class="flex items-center space-x-1">
                      <span>Guest</span>
                      {getSortIcon("guestName")}
                    </div>
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("arrivalTime")}
                  >
                    <div class="flex items-center space-x-1">
                      <span>Date & Time</span>
                      {getSortIcon("arrivalTime")}
                    </div>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party Size
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div class="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <For each={props.reservations}>
                  {(reservation) => (
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                          {reservation.guestName}
                        </div>
                        <Show when={reservation.notes}>
                          <div class="text-sm text-gray-500 truncate max-w-xs">
                            {reservation.notes}
                          </div>
                        </Show>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {formatDate(reservation.arrivalTime)}
                        </div>
                        <div class="text-sm text-gray-500">
                          {formatTime(reservation.arrivalTime)}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {reservation.tableSize}{" "}
                          {reservation.tableSize === 1 ? "person" : "people"}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <Badge color={getStatusColor(reservation.status)}>
                          {getStatusText(reservation.status)}
                        </Badge>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          <a
                            href={`tel:${reservation.guestPhone}`}
                            class="text-blue-600 hover:text-blue-800"
                          >
                            {reservation.guestPhone}
                          </a>
                        </div>
                        <div class="text-sm text-gray-500">
                          <a
                            href={`mailto:${reservation.guestEmail}`}
                            class="text-blue-600 hover:text-blue-800"
                          >
                            {reservation.guestEmail}
                          </a>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => props.onViewDetails?.(reservation)}
                          >
                            View
                          </Button>

                          <Show when={canApprove(reservation)}>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                props.onUpdateStatus?.(
                                  reservation,
                                  ReservationStatus.APPROVED
                                )
                              }
                            >
                              Approve
                            </Button>
                          </Show>

                          <Show when={canComplete(reservation)}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                props.onUpdateStatus?.(
                                  reservation,
                                  ReservationStatus.COMPLETED
                                )
                              }
                            >
                              Complete
                            </Button>
                          </Show>

                          <Show when={canCancel(reservation)}>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                props.onUpdateStatus?.(
                                  reservation,
                                  ReservationStatus.CANCELLED
                                )
                              }
                            >
                              Cancel
                            </Button>
                          </Show>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </div>
  );
};
