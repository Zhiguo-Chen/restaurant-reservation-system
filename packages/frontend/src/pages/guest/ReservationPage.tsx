import { Component, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { ReservationForm } from "../../components/reservation/ReservationForm";

const ReservationPage: Component = () => {
  const navigate = useNavigate();
  const [reservationId, setReservationId] = createSignal<string | null>(null);

  const handleSuccess = (id: string) => {
    setReservationId(id);
    // Could navigate to a confirmation page or show success message
    console.log("Reservation created successfully:", id);
  };

  const handleError = (error: string) => {
    console.error("Reservation error:", error);
    // Error is already handled in the form component
  };

  return (
    <div class="min-h-screen bg-gray-50 py-8">
      <ReservationForm onSuccess={handleSuccess} onError={handleError} />
    </div>
  );
};

export default ReservationPage;
