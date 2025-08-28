import { Component, createSignal, Show } from "solid-js";
import { CreateReservationInput } from "../../types";
import { Input, Select, Button, DateTimePicker } from "../ui";
import { reservationService } from "../../services/reservationService";

interface ReservationFormData {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  arrivalTime: Date | null;
  tableSize: number;
  notes: string;
}

interface ReservationFormErrors {
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  arrivalTime?: string;
  tableSize?: string;
  general?: string;
}

interface ReservationFormProps {
  onSuccess?: (reservationId: string) => void;
  onError?: (error: string) => void;
}

export const ReservationForm: Component<ReservationFormProps> = (props) => {
  const [formData, setFormData] = createSignal<ReservationFormData>({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    arrivalTime: null,
    tableSize: 2,
    notes: "",
  });

  const [errors, setErrors] = createSignal<ReservationFormErrors>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [isSuccess, setIsSuccess] = createSignal(false);

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

  const validateForm = (data: ReservationFormData): ReservationFormErrors => {
    const newErrors: ReservationFormErrors = {};

    // Validate guest name
    if (!data.guestName.trim()) {
      newErrors.guestName = "Guest name is required";
    } else if (data.guestName.trim().length < 2) {
      newErrors.guestName = "Guest name must be at least 2 characters";
    } else if (data.guestName.trim().length > 100) {
      newErrors.guestName = "Guest name must not exceed 100 characters";
    }

    // Validate phone number
    if (!data.guestPhone.trim()) {
      newErrors.guestPhone = "Phone number is required";
    } else if (!isValidPhoneNumber(data.guestPhone)) {
      newErrors.guestPhone = "Please enter a valid phone number";
    }

    // Validate email
    if (!data.guestEmail.trim()) {
      newErrors.guestEmail = "Email address is required";
    } else if (!isValidEmail(data.guestEmail)) {
      newErrors.guestEmail = "Please enter a valid email address";
    }

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

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    const phoneRegex = /^(\+\d{1,3})?[\d\s\-\(\)]{7,15}$/;
    return (
      phoneRegex.test(phone.trim()) &&
      cleanPhone.length >= 7 &&
      cleanPhone.length <= 18
    );
  };

  const handleInputChange = (field: keyof ReservationFormData, value: any) => {
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
      const reservationInput: CreateReservationInput = {
        guestName: data.guestName.trim(),
        guestPhone: data.guestPhone.trim(),
        guestEmail: data.guestEmail.trim(),
        arrivalTime: data.arrivalTime!,
        tableSize: data.tableSize,
        notes: data.notes.trim() || undefined,
      };

      const reservation = await reservationService.createReservation(
        reservationInput
      );

      setIsSuccess(true);

      if (props.onSuccess) {
        props.onSuccess(reservation.id);
      }
    } catch (error) {
      console.error("Reservation creation failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create reservation. Please try again.";
      setErrors({ general: errorMessage });

      if (props.onError) {
        props.onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      arrivalTime: null,
      tableSize: 2,
      notes: "",
    });
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <div class="max-w-2xl mx-auto">
      <Show
        when={!isSuccess()}
        fallback={
          <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div class="text-green-600 text-4xl mb-4">✓</div>
            <h2 class="text-2xl font-bold text-green-800 mb-2">
              Reservation Confirmed!
            </h2>
            <p class="text-green-700 mb-4">
              Your reservation has been successfully submitted. You will receive
              a confirmation email shortly.
            </p>
            <Button onClick={resetForm} variant="primary">
              Make Another Reservation
            </Button>
          </div>
        }
      >
        <div class="bg-white rounded-lg shadow-md p-8">
          <h1 class="text-2xl font-bold text-center mb-8">
            Make a Reservation
          </h1>

          <Show when={errors().general}>
            <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{errors().general}</p>
            </div>
          </Show>

          <form onSubmit={handleSubmit} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Guest Name"
                type="text"
                placeholder="Enter your full name"
                value={formData().guestName}
                error={errors().guestName}
                onInput={(e) =>
                  handleInputChange("guestName", e.currentTarget.value)
                }
                disabled={isSubmitting()}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                value={formData().guestPhone}
                error={errors().guestPhone}
                onInput={(e) =>
                  handleInputChange("guestPhone", e.currentTarget.value)
                }
                disabled={isSubmitting()}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={formData().guestEmail}
              error={errors().guestEmail}
              onInput={(e) =>
                handleInputChange("guestEmail", e.currentTarget.value)
              }
              disabled={isSubmitting()}
              required
            />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DateTimePicker
                label="Arrival Date & Time"
                value={formData().arrivalTime}
                onChange={(date) => handleInputChange("arrivalTime", date)}
                error={errors().arrivalTime}
                helperText="Select your preferred arrival date and time"
                disabled={isSubmitting()}
                required
              />

              <Select
                label="Table Size"
                options={tableSizeOptions}
                value={formData().tableSize.toString()}
                onChange={(e) =>
                  handleInputChange(
                    "tableSize",
                    parseInt(e.currentTarget.value)
                  )
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
                onInput={(e) =>
                  handleInputChange("notes", e.currentTarget.value)
                }
                disabled={isSubmitting()}
                rows={3}
                maxLength={500}
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p class="text-sm text-gray-500 mt-1">
                {formData().notes.length}/500 characters
              </p>
            </div>

            <div class="pt-4">
              <Button
                type="submit"
                variant="primary"
                class="w-full"
                loading={isSubmitting()}
                disabled={isSubmitting()}
              >
                {isSubmitting()
                  ? "Creating Reservation..."
                  : "Create Reservation"}
              </Button>
            </div>
          </form>
        </div>
      </Show>
    </div>
  );
};
