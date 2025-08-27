import { Component, createSignal, onMount, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";
import { reservationService } from "../../services/reservationService";
import { DetailedReservationView } from "../../components/employee/DetailedReservationView";
import { StatusUpdateInterface } from "../../components/employee/StatusUpdateInterface";
import { useAuth } from "../../contexts/AuthContext";

const ReservationDetail: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reservation, setReservation] = createSignal<Reservation | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [updating, setUpdating] = createSignal(false);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

  // Load reservation details
  const loadReservation = async () => {
    if (!params.id) {
      setError("No reservation ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reservationData = await reservationService.getReservation(
        params.id
      );
      setReservation(reservationData);
    } catch (err) {
      console.error("Failed to load reservation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reservation details"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle status updates
  const handleStatusUpdate = async (
    status: ReservationStatus,
    notes?: string
  ) => {
    if (!reservation()) return;

    setUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedReservation =
        await reservationService.updateReservationStatus(
          reservation()!.id,
          status
        );

      setReservation(updatedReservation);
      setSuccessMessage(
        `Reservation status updated to ${status.toLowerCase()}`
      );

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Failed to update reservation status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update reservation status"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleBack = () => {
    navigate("/employee");
  };

  // Load reservation on mount
  onMount(() => {
    loadReservation();
  });

  return (
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Loading State */}
        <Show when={loading()}>
          <div class="flex justify-center items-center min-h-64">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-2 text-gray-600">
              Loading reservation details...
            </span>
          </div>
        </Show>

        {/* Error State */}
        <Show when={error() && !loading()}>
          <div class="max-w-2xl mx-auto">
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div class="text-red-600 text-4xl mb-4">⚠️</div>
              <h2 class="text-xl font-bold text-red-800 mb-2">
                Error Loading Reservation
              </h2>
              <p class="text-red-700 mb-4">{error()}</p>
              <div class="flex justify-center space-x-4">
                <button
                  onClick={loadReservation}
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleBack}
                  class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </Show>

        {/* Success Message */}
        <Show when={successMessage()}>
          <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
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
                <p class="text-sm text-green-600">{successMessage()}</p>
              </div>
              <div class="ml-auto pl-3">
                <button
                  onClick={() => setSuccessMessage(null)}
                  class="text-green-400 hover:text-green-600"
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

        {/* Update Error */}
        <Show when={error() && !loading() && reservation()}>
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

        {/* Main Content */}
        <Show when={reservation() && !loading()}>
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Reservation Details - Takes up 2 columns */}
            <div class="xl:col-span-2">
              <DetailedReservationView
                reservation={reservation()!}
                onBack={handleBack}
                showActions={true}
              />
            </div>

            {/* Status Management - Takes up 1 column */}
            <div class="xl:col-span-1">
              <StatusUpdateInterface
                reservation={reservation()!}
                onStatusUpdate={handleStatusUpdate}
                loading={updating()}
              />
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default ReservationDetail;
