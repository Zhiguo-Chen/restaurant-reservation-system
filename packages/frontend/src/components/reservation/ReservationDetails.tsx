import { Component, Show } from "solid-js";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";
import { Card, CardHeader, CardBody, Badge, Button } from "../ui";

interface ReservationDetailsProps {
  reservation: Reservation;
  onEdit?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export const ReservationDetails: Component<ReservationDetailsProps> = (
  props
) => {
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

  const canEdit = () => {
    return (
      props.reservation.status === ReservationStatus.REQUESTED ||
      props.reservation.status === ReservationStatus.APPROVED
    );
  };

  const canCancel = () => {
    return (
      props.reservation.status === ReservationStatus.REQUESTED ||
      props.reservation.status === ReservationStatus.APPROVED
    );
  };

  return (
    <Card>
      <CardHeader>
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Reservation Details</h2>
            <p class="text-sm text-gray-500 mt-1">
              Reservation ID: {props.reservation.id}
            </p>
          </div>
          <Badge color={getStatusColor(props.reservation.status)}>
            {getStatusText(props.reservation.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardBody>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-1">
                Guest Information
              </h3>
              <div class="space-y-2">
                <p class="text-gray-900">{props.reservation.guestName}</p>
                <p class="text-gray-600">{props.reservation.guestEmail}</p>
                <p class="text-gray-600">{props.reservation.guestPhone}</p>
              </div>
            </div>

            <Show when={props.reservation.notes}>
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </h3>
                <p class="text-gray-900">{props.reservation.notes}</p>
              </div>
            </Show>
          </div>

          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-1">
                Reservation Details
              </h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">Date:</span>
                  <span class="text-gray-900 font-medium">
                    {formatDate(props.reservation.arrivalTime)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Time:</span>
                  <span class="text-gray-900 font-medium">
                    {formatTime(props.reservation.arrivalTime)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Party Size:</span>
                  <span class="text-gray-900 font-medium">
                    {props.reservation.tableSize}{" "}
                    {props.reservation.tableSize === 1 ? "person" : "people"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-1">
                Booking Information
              </h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">Created:</span>
                  <span class="text-gray-900">
                    {formatDate(props.reservation.createdAt)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Last Updated:</span>
                  <span class="text-gray-900">
                    {formatDate(props.reservation.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Show when={props.showActions !== false}>
          <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="flex flex-col sm:flex-row gap-3">
              <Show when={canEdit() && props.onEdit}>
                <Button
                  onClick={props.onEdit}
                  variant="secondary"
                  class="flex-1 sm:flex-none"
                >
                  Modify Reservation
                </Button>
              </Show>

              <Show when={canCancel() && props.onCancel}>
                <Button
                  onClick={props.onCancel}
                  variant="danger"
                  class="flex-1 sm:flex-none"
                >
                  Cancel Reservation
                </Button>
              </Show>
            </div>

            <Show
              when={props.reservation.status === ReservationStatus.REQUESTED}
            >
              <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p class="text-sm text-yellow-800">
                  <strong>Pending Approval:</strong> Your reservation is being
                  reviewed. You will receive a confirmation email once it's
                  approved.
                </p>
              </div>
            </Show>

            <Show
              when={props.reservation.status === ReservationStatus.APPROVED}
            >
              <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p class="text-sm text-green-800">
                  <strong>Confirmed:</strong> Your reservation is confirmed! We
                  look forward to seeing you.
                </p>
              </div>
            </Show>

            <Show
              when={props.reservation.status === ReservationStatus.CANCELLED}
            >
              <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p class="text-sm text-red-800">
                  <strong>Cancelled:</strong> This reservation has been
                  cancelled.
                </p>
              </div>
            </Show>
          </div>
        </Show>
      </CardBody>
    </Card>
  );
};
