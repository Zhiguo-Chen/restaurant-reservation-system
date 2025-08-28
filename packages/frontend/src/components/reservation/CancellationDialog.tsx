import { Component, createSignal, Show } from "solid-js";
import { Reservation } from "../../types";
import { Modal, Button } from "../ui";
import { reservationService } from "../../services/reservationService";

interface CancellationDialogProps {
  isOpen: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onSuccess?: (cancelledReservation: Reservation) => void;
  onError?: (error: string) => void;
}

export const CancellationDialog: Component<CancellationDialogProps> = (
  props
) => {
  const [isCancelling, setIsCancelling] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleCancel = async () => {
    if (!props.reservation) return;

    setIsCancelling(true);
    setError(null);

    try {
      const cancelledReservation = await reservationService.cancelReservation(
        props.reservation.id
      );

      if (props.onSuccess) {
        props.onSuccess(cancelledReservation);
      }

      props.onClose();
    } catch (error) {
      console.error("Reservation cancellation failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to cancel reservation. Please try again.";
      setError(errorMessage);

      if (props.onError) {
        props.onError(errorMessage);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    if (!isCancelling()) {
      setError(null);
      props.onClose();
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Cancel Reservation"
      size="md"
    >
      <Show when={props.reservation}>
        <div class="space-y-4">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                class="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to cancel this reservation?
            </h3>
            <p class="text-sm text-gray-500 mb-6">
              This action cannot be undone.
            </p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 mb-2">Reservation Details:</h4>
            <div class="space-y-1 text-sm text-gray-600">
              <p>
                <strong>Guest:</strong> {props.reservation!.guestName}
              </p>
              <p>
                <strong>Date & Time:</strong>{" "}
                {formatDateTime(props.reservation!.arrivalTime)}
              </p>
              <p>
                <strong>Party Size:</strong> {props.reservation!.tableSize}{" "}
                {props.reservation!.tableSize === 1 ? "person" : "people"}
              </p>
              <Show when={props.reservation!.notes}>
                <p>
                  <strong>Special Requests:</strong> {props.reservation!.notes}
                </p>
              </Show>
            </div>
          </div>

          <Show when={error()}>
            <div class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{error()}</p>
            </div>
          </Show>

          <div class="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="danger"
              class="flex-1"
              loading={isCancelling()}
              disabled={isCancelling()}
            >
              {isCancelling() ? "Cancelling..." : "Yes, Cancel Reservation"}
            </Button>

            <Button
              onClick={handleClose}
              variant="secondary"
              class="flex-1"
              disabled={isCancelling()}
            >
              Keep Reservation
            </Button>
          </div>

          <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p class="text-sm text-yellow-800">
              <strong>Cancellation Policy:</strong> You can cancel your
              reservation up to 2 hours before your scheduled time without any
              charges.
            </p>
          </div>
        </div>
      </Show>
    </Modal>
  );
};
