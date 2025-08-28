import { Component, createSignal, Show } from "solid-js";
import { Input, Button } from "../ui";
import { reservationService } from "../../services/reservationService";
import { Reservation } from "../../types";

interface ReservationLookupData {
  email: string;
  phone: string;
}

interface ReservationLookupErrors {
  email?: string;
  phone?: string;
  general?: string;
}

interface ReservationLookupProps {
  onReservationFound?: (reservation: Reservation) => void;
  onError?: (error: string) => void;
}

export const ReservationLookup: Component<ReservationLookupProps> = (props) => {
  const [formData, setFormData] = createSignal<ReservationLookupData>({
    email: "",
    phone: "",
  });

  const [errors, setErrors] = createSignal<ReservationLookupErrors>({});
  const [isSearching, setIsSearching] = createSignal(false);

  const validateForm = (
    data: ReservationLookupData
  ): ReservationLookupErrors => {
    const newErrors: ReservationLookupErrors = {};

    // Validate email
    if (!data.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!isValidEmail(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate phone number
    if (!data.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(data.phone)) {
      newErrors.phone = "Please enter a valid phone number";
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

  const handleInputChange = (
    field: keyof ReservationLookupData,
    value: string
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

    setIsSearching(true);
    setErrors({});

    try {
      // For now, we'll use a simple approach to find reservations by email and phone
      // In a real implementation, this would be a specific GraphQL query
      // Since we don't have a specific lookup endpoint, we'll simulate this

      // This is a placeholder - in reality, you'd have a specific query like:
      // const reservation = await reservationService.findReservationByContact(data.email, data.phone);

      // For demo purposes, we'll create a mock reservation
      const mockReservation: Reservation = {
        id: "reservation-123",
        guestName: "John Doe",
        guestPhone: data.phone,
        guestEmail: data.email,
        arrivalTime: new Date("2024-12-25T19:00:00"),
        tableSize: 4,
        status: "REQUESTED" as any,
        notes: "Birthday celebration",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (props.onReservationFound) {
        props.onReservationFound(mockReservation);
      }
    } catch (error) {
      console.error("Reservation lookup failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to find reservation. Please check your details and try again.";
      setErrors({ general: errorMessage });

      if (props.onError) {
        props.onError(errorMessage);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-md p-8">
      <h2 class="text-xl font-bold text-center mb-6">Find Your Reservation</h2>
      <p class="text-gray-600 text-center mb-8">
        Enter your email address and phone number to look up your reservation.
      </p>

      <Show when={errors().general}>
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{errors().general}</p>
        </div>
      </Show>

      <form onSubmit={handleSubmit} class="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter the email used for your reservation"
          value={formData().email}
          error={errors().email}
          onInput={(e) => handleInputChange("email", e.currentTarget.value)}
          disabled={isSearching()}
          required
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="Enter the phone number used for your reservation"
          value={formData().phone}
          error={errors().phone}
          onInput={(e) => handleInputChange("phone", e.currentTarget.value)}
          disabled={isSearching()}
          required
        />

        <Button
          type="submit"
          variant="primary"
          class="w-full"
          loading={isSearching()}
          disabled={isSearching()}
        >
          {isSearching() ? "Searching..." : "Find Reservation"}
        </Button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-500">
          Can't find your reservation? Please contact us for assistance.
        </p>
      </div>
    </div>
  );
};
