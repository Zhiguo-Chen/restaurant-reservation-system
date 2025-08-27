import { Component, Show } from "solid-js";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";
import { Card, CardHeader, CardBody, Badge, Button } from "../ui";

interface DetailedReservationViewProps {
  reservation: Reservation;
  onEdit?: () => void;
  onBack?: () => void;
  showActions?: boolean;
}

export const DetailedReservationView: Component<
  DetailedReservationViewProps
> = (props) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
        return "Pending Approval";
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

  const getTimeSinceCreated = () => {
    const now = new Date();
    const created = new Date(props.reservation.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    }
  };

  const getTimeUntilArrival = () => {
    const now = new Date();
    const arrival = new Date(props.reservation.arrivalTime);
    const diffMs = arrival.getTime() - now.getTime();

    if (diffMs < 0) {
      const pastMs = Math.abs(diffMs);
      const pastHours = Math.floor(pastMs / (1000 * 60 * 60));
      const pastDays = Math.floor(pastHours / 24);

      if (pastDays > 0) {
        return `${pastDays} day${pastDays > 1 ? "s" : ""} ago`;
      } else if (pastHours > 0) {
        return `${pastHours} hour${pastHours > 1 ? "s" : ""} ago`;
      } else {
        const pastMinutes = Math.floor(pastMs / (1000 * 60));
        return `${pastMinutes} minute${pastMinutes > 1 ? "s" : ""} ago`;
      }
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
      } else if (diffHours > 0) {
        return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
      }
    }
  };

  const isUpcoming = () => {
    return new Date(props.reservation.arrivalTime) > new Date();
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Show when={props.onBack}>
            <Button variant="ghost" size="sm" onClick={props.onBack}>
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Button>
          </Show>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Reservation Details
            </h1>
            <p class="text-sm text-gray-500">ID: {props.reservation.id}</p>
          </div>
        </div>
        <Badge color={getStatusColor(props.reservation.status)} class="text-sm">
          {getStatusText(props.reservation.status)}
        </Badge>
      </div>

      {/* Main Information Card */}
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold text-gray-900">
            Reservation Information
          </h2>
        </CardHeader>
        <CardBody>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Guest Information */}
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Guest Details
                </h3>
                <div class="space-y-3">
                  <div class="flex items-center space-x-3">
                    <svg
                      class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {props.reservation.guestName}
                      </p>
                      <p class="text-sm text-gray-500">Guest Name</p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-3">
                    <svg
                      class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <div>
                      <a
                        href={`tel:${props.reservation.guestPhone}`}
                        class="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {props.reservation.guestPhone}
                      </a>
                      <p class="text-sm text-gray-500">Phone Number</p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-3">
                    <svg
                      class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <a
                        href={`mailto:${props.reservation.guestEmail}`}
                        class="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {props.reservation.guestEmail}
                      </a>
                      <p class="text-sm text-gray-500">Email Address</p>
                    </div>
                  </div>
                </div>
              </div>

              <Show when={props.reservation.notes}>
                <div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">
                    Special Requests
                  </h3>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-sm text-gray-700">
                      {props.reservation.notes}
                    </p>
                  </div>
                </div>
              </Show>
            </div>

            {/* Reservation Details */}
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Reservation Details
                </h3>
                <div class="space-y-4">
                  <div class="flex items-center justify-between py-3 border-b border-gray-200">
                    <span class="text-sm font-medium text-gray-500">Date</span>
                    <span class="text-sm text-gray-900 font-medium">
                      {formatDate(props.reservation.arrivalTime)}
                    </span>
                  </div>

                  <div class="flex items-center justify-between py-3 border-b border-gray-200">
                    <span class="text-sm font-medium text-gray-500">Time</span>
                    <span class="text-sm text-gray-900 font-medium">
                      {formatTime(props.reservation.arrivalTime)}
                    </span>
                  </div>

                  <div class="flex items-center justify-between py-3 border-b border-gray-200">
                    <span class="text-sm font-medium text-gray-500">
                      Party Size
                    </span>
                    <span class="text-sm text-gray-900 font-medium">
                      {props.reservation.tableSize}{" "}
                      {props.reservation.tableSize === 1 ? "person" : "people"}
                    </span>
                  </div>

                  <div class="flex items-center justify-between py-3 border-b border-gray-200">
                    <span class="text-sm font-medium text-gray-500">
                      Status
                    </span>
                    <Badge color={getStatusColor(props.reservation.status)}>
                      {getStatusText(props.reservation.status)}
                    </Badge>
                  </div>

                  <div class="flex items-center justify-between py-3">
                    <span class="text-sm font-medium text-gray-500">
                      {isUpcoming()
                        ? "Time Until Arrival"
                        : "Time Since Scheduled"}
                    </span>
                    <span
                      class={`text-sm font-medium ${
                        isUpcoming() ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {getTimeUntilArrival()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Booking Information
                </h3>
                <div class="space-y-4">
                  <div class="flex items-center justify-between py-3 border-b border-gray-200">
                    <span class="text-sm font-medium text-gray-500">
                      Created
                    </span>
                    <div class="text-right">
                      <p class="text-sm text-gray-900 font-medium">
                        {formatDateTime(props.reservation.createdAt)}
                      </p>
                      <p class="text-xs text-gray-500">
                        {getTimeSinceCreated()}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between py-3">
                    <span class="text-sm font-medium text-gray-500">
                      Last Updated
                    </span>
                    <div class="text-right">
                      <p class="text-sm text-gray-900 font-medium">
                        {formatDateTime(props.reservation.updatedAt)}
                      </p>
                      <Show when={props.reservation.updatedBy}>
                        <p class="text-xs text-gray-500">
                          by {props.reservation.updatedBy}
                        </p>
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Status-specific Information */}
      <Show when={props.reservation.status === ReservationStatus.REQUESTED}>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">
                Pending Approval
              </h3>
              <p class="text-sm text-yellow-700 mt-1">
                This reservation is awaiting approval. Please review the details
                and approve or decline the request.
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={props.reservation.status === ReservationStatus.APPROVED}>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                Confirmed Reservation
              </h3>
              <p class="text-sm text-green-700 mt-1">
                This reservation is confirmed. The guest should arrive at the
                scheduled time.
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={props.reservation.status === ReservationStatus.CANCELLED}>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
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
              <h3 class="text-sm font-medium text-red-800">
                Cancelled Reservation
              </h3>
              <p class="text-sm text-red-700 mt-1">
                This reservation has been cancelled and is no longer active.
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={props.reservation.status === ReservationStatus.COMPLETED}>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">
                Completed Reservation
              </h3>
              <p class="text-sm text-blue-700 mt-1">
                This reservation has been completed successfully. The guest has
                been served.
              </p>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
