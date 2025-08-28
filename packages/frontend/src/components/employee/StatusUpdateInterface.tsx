import { Component, createSignal, Show, For } from "solid-js";
import { Reservation, ReservationStatus } from "../../types";
import { Button, Modal, Select } from "../ui";

interface StatusUpdateInterfaceProps {
  reservation: Reservation;
  onStatusUpdate?: (status: ReservationStatus, notes?: string) => void;
  loading?: boolean;
}

interface StatusOption {
  value: ReservationStatus;
  label: string;
  description: string;
  color: string;
  disabled?: boolean;
}

export const StatusUpdateInterface: Component<StatusUpdateInterfaceProps> = (
  props
) => {
  const [showModal, setShowModal] = createSignal(false);
  const [selectedStatus, setSelectedStatus] =
    createSignal<ReservationStatus | null>(null);
  const [notes, setNotes] = createSignal("");
  const [isUpdating, setIsUpdating] = createSignal(false);

  const getStatusOptions = (): StatusOption[] => {
    const currentStatus = props.reservation.status;

    return [
      {
        value: ReservationStatus.REQUESTED,
        label: "Pending",
        description: "Reservation is awaiting approval",
        color: "yellow",
        disabled:
          currentStatus === ReservationStatus.COMPLETED ||
          currentStatus === ReservationStatus.CANCELLED,
      },
      {
        value: ReservationStatus.APPROVED,
        label: "Confirmed",
        description: "Reservation is confirmed and ready",
        color: "green",
        disabled: currentStatus === ReservationStatus.COMPLETED,
      },
      {
        value: ReservationStatus.COMPLETED,
        label: "Completed",
        description: "Guest has arrived and been served",
        color: "blue",
        disabled:
          currentStatus === ReservationStatus.CANCELLED ||
          currentStatus === ReservationStatus.REQUESTED,
      },
      {
        value: ReservationStatus.CANCELLED,
        label: "Cancelled",
        description: "Reservation has been cancelled",
        color: "red",
        disabled: currentStatus === ReservationStatus.COMPLETED,
      },
    ];
  };

  const getAvailableActions = () => {
    const currentStatus = props.reservation.status;
    const actions = [];

    switch (currentStatus) {
      case ReservationStatus.REQUESTED:
        actions.push(
          {
            status: ReservationStatus.APPROVED,
            label: "Approve",
            variant: "primary" as const,
          },
          {
            status: ReservationStatus.CANCELLED,
            label: "Decline",
            variant: "danger" as const,
          }
        );
        break;
      case ReservationStatus.APPROVED:
        actions.push(
          {
            status: ReservationStatus.COMPLETED,
            label: "Mark Complete",
            variant: "secondary" as const,
          },
          {
            status: ReservationStatus.CANCELLED,
            label: "Cancel",
            variant: "danger" as const,
          }
        );
        break;
      default:
        // No actions available for completed or cancelled reservations
        break;
    }

    return actions;
  };

  const handleQuickAction = (status: ReservationStatus) => {
    setSelectedStatus(status);
    setNotes("");
    setShowModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedStatus()) return;

    setIsUpdating(true);
    try {
      if (props.onStatusUpdate) {
        await props.onStatusUpdate(
          selectedStatus()!,
          notes().trim() || undefined
        );
      }
      setShowModal(false);
      setSelectedStatus(null);
      setNotes("");
    } catch (error) {
      console.error("Failed to update status:", error);
      // Error handling is done by parent component
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedStatus(null);
    setNotes("");
  };

  const getStatusColor = (status: ReservationStatus) => {
    const option = getStatusOptions().find((opt) => opt.value === status);
    return option?.color || "gray";
  };

  const getStatusLabel = (status: ReservationStatus) => {
    const option = getStatusOptions().find((opt) => opt.value === status);
    return option?.label || status;
  };

  const getStatusDescription = (status: ReservationStatus) => {
    const option = getStatusOptions().find((opt) => opt.value === status);
    return option?.description || "";
  };

  const requiresNotes = (status: ReservationStatus) => {
    return status === ReservationStatus.CANCELLED;
  };

  return (
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Status Management
      </h3>

      {/* Current Status Display */}
      <div class="mb-6">
        <div class="flex items-center space-x-3">
          <span class="text-sm font-medium text-gray-700">Current Status:</span>
          <span
            class={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(
              props.reservation.status
            )}-100 text-${getStatusColor(props.reservation.status)}-800`}
          >
            {getStatusLabel(props.reservation.status)}
          </span>
        </div>
        <p class="text-sm text-gray-600 mt-1">
          {getStatusDescription(props.reservation.status)}
        </p>
      </div>

      {/* Quick Actions */}
      <Show when={getAvailableActions().length > 0}>
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div class="flex flex-wrap gap-2">
            <For each={getAvailableActions()}>
              {(action) => (
                <Button
                  variant={action.variant}
                  size="sm"
                  onClick={() => handleQuickAction(action.status)}
                  disabled={props.loading}
                >
                  {action.label}
                </Button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Status History */}
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">Status History</h4>
        <div class="space-y-2">
          <div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
            <div class="flex items-center space-x-3">
              <span
                class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(
                  props.reservation.status
                )}-100 text-${getStatusColor(props.reservation.status)}-800`}
              >
                {getStatusLabel(props.reservation.status)}
              </span>
              <span class="text-sm text-gray-900">Current</span>
            </div>
            <span class="text-xs text-gray-500">
              {new Date(props.reservation.updatedAt).toLocaleString()}
            </span>
          </div>

          <Show
            when={
              props.reservation.createdAt.getTime() !==
              props.reservation.updatedAt.getTime()
            }
          >
            <div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <div class="flex items-center space-x-3">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
                <span class="text-sm text-gray-900">Initial request</span>
              </div>
              <span class="text-xs text-gray-500">
                {new Date(props.reservation.createdAt).toLocaleString()}
              </span>
            </div>
          </Show>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={showModal()}
        onClose={handleCancel}
        title="Update Reservation Status"
        size="md"
      >
        <Show when={selectedStatus()}>
          <div class="space-y-4">
            <div class="text-center">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg
                  class="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                Update to {getStatusLabel(selectedStatus()!)}
              </h3>
              <p class="text-sm text-gray-500 mb-4">
                {getStatusDescription(selectedStatus()!)}
              </p>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-2">
                Reservation Details:
              </h4>
              <div class="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Guest:</strong> {props.reservation.guestName}
                </p>
                <p>
                  <strong>Date & Time:</strong>{" "}
                  {new Date(props.reservation.arrivalTime).toLocaleString()}
                </p>
                <p>
                  <strong>Party Size:</strong> {props.reservation.tableSize}{" "}
                  {props.reservation.tableSize === 1 ? "person" : "people"}
                </p>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Notes{" "}
                {requiresNotes(selectedStatus()!) && (
                  <span class="text-red-500">*</span>
                )}
              </label>
              <textarea
                placeholder={
                  requiresNotes(selectedStatus()!)
                    ? "Please provide a reason for cancellation..."
                    : "Optional notes about this status change..."
                }
                value={notes()}
                onInput={(e) => setNotes(e.currentTarget.value)}
                disabled={isUpdating()}
                rows={3}
                maxLength={500}
                required={requiresNotes(selectedStatus()!)}
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p class="text-sm text-gray-500 mt-1">
                {notes().length}/500 characters
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleConfirmUpdate}
                variant="primary"
                class="flex-1"
                loading={isUpdating()}
                disabled={
                  isUpdating() ||
                  (requiresNotes(selectedStatus()!) && !notes().trim())
                }
              >
                {isUpdating()
                  ? "Updating..."
                  : `Update to ${getStatusLabel(selectedStatus()!)}`}
              </Button>

              <Button
                onClick={handleCancel}
                variant="secondary"
                class="flex-1 sm:flex-none"
                disabled={isUpdating()}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Show>
      </Modal>
    </div>
  );
};
