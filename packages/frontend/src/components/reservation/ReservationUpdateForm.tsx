import { Component, createSignal, Show, onMount } from "solid-js";
import {
  Reservation,
  UpdateReservationInput,
} from "@restaurant-reservation/shared";
import { Input, Select, Button, DateTimePicker } from "../ui";
import { reservationService } from "../../services/reservationService";

interface ReservationUpdateData {
  arrivalTime: Date | null;
  tableSize: number;
  notes: string;
}

interface ReservationUpdateErrors {
  arrivalTime?: string;
  tableSize?: string;
  general?: string;
}

interface ReservationUpdateFormProps {
  reservation: Reservation;
  onSuccess?: (updatedReservation: Reservation) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export const ReservationUpdateForm: Component<ReservationUpdateFormProps> = (
  props
) => {
  const [formData, setFormData] = createSignal<ReservationUpdateData>({
    arrivalTime: null,
    tableSize: 2,
    notes: "",
  });

  const [errors, setErrors] = createSignal<ReservationUpdateErrors>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);

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

  // Initialize form with current reservation data
  onMount(() => {
    setFormData({
      arrivalTime: new Date(props.reservation.arrivalTime),
      tableSize: props.reservation.tableSize,
      notes: props.reservation.notes || "",
    });
  });

  const validateForm = (
    data: ReservationUpdateData
  ): ReservationUpdateErrors => {
    const newErrors: ReservationUpdateErrors = {};

    // Validate arrival time
    if (!data.arrivalTime) {
      newErrors.arrivalTime = "Arrival date and time is required";
    } else if (data.arrivalTime <= new Date()) {
      newErrors.arrivalTime = "Arrival time must be in the future";
    }

    // Validate table size
    if (!data.tableSize || data.tableSize <= 0) {
      newErrors.tableSize = "Please select a valid table size";
    } else if (data.tableSize > 20) {
      newErrors.tableSize = "Table size cannot exceed 20 people";
    }

    return newErrors;
  };

  const handleInputChange = (
    field: keyof ReservationUpdateData,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors()[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const data = formData();
    const formErrors = validateForm(data);

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const updateInput: UpdateReservationInput = {
        arrivalTime: data.arrivalTime!,
        tableSize: data.tableSize,
        notes: data.notes.trim() || undefined,
      };

      const updatedReservation = await reservationService.updateReservation(
        props.reservation.id,
        updateInput
      );

      if (props.onSuccess) {
        props.onSuccess(updatedReservation);
      }
    } catch (error) {
      console.error("Reservation update failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update reservation. Please try again.";
      setErrors({ general: errorMessage });

      if (props.onError) {
        props.onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = () => {
    const data = formData();
    const original = props.reservation;

    return (
      data.arrivalTime?.getTime() !==
        new Date(original.arrivalTime).getTime() ||
      data.tableSize !== original.tableSize ||
      data.notes !== (original.notes || "")
    );
  };

  return (
    <div class="bg-white rounded-lg shadow-md p-8">
      <h2 class="text-xl font-bold text-center mb-6">
        Modify Your Reservation
      </h2>
      <p class="text-gray-600 text-center mb-8">
        Update your reservation details below. Changes are subject to
        availability.
      </p>

      <Show when={errors().general}>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{errors().general}</p>
        </div>
      </Show>

      <form onSubmit={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateTimePicker
            label="New Arrival Date & Time"
            value={formData().arrivalTime}
            onChange={(date) => handleInputChange("arrivalTime", date)}
            error={errors().arrivalTime}
            helperText="Select your new preferred arrival date and time"
            disabled={isSubmitting()}
            required
          />

          <Select
            label="Party Size"
            options={tableSizeOptions}
            value={formData().tableSize.toString()}
            onChange={(e) =>
              handleInputChange("tableSize", parseInt(e.currentTarget.value))
            }
            error={errors().tableSize}
            disabled={isSubmitting()}
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Special Requests (Optional)
          </label>
          <textarea
            placeholder="Any special requests or dietary requirements..."
            value={formData().notes}
            onInput={(e) => handleInputChange("notes", e.currentTarget.value)}
            disabled={isSubmitting()}
            rows={3}
            maxLength={500}
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <p class="text-sm text-gray-500 mt-1">
            {formData().notes.length}/500 characters
          </p>
        </div>

        <div class="pt-4 flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            variant="primary"
            class="flex-1"
            loading={isSubmitting()}
            disabled={isSubmitting() || !hasChanges()}
          >
            {isSubmitting() ? "Updating..." : "Update Reservation"}
          </Button>

          <Show when={props.onCancel}>
            <Button
              type="button"
              variant="secondary"
              class="flex-1 sm:flex-none"
              onClick={props.onCancel}
              disabled={isSubmitting()}
            >
              Cancel Changes
            </Button>
          </Show>
        </div>
      </form>

      <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p class="text-sm text-blue-800">
          <strong>Note:</strong> Reservation changes are subject to
          availability. You will receive a confirmation email once your changes
          are approved.
        </p>
      </div>
    </div>
  );
};
