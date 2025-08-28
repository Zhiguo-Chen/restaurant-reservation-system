import { Component, createSignal, Show } from "solid-js";
import { Reservation } from "../../types";
import { ReservationLookup } from "../../components/reservation/ReservationLookup";
import { ReservationDetails } from "../../components/reservation/ReservationDetails";
import { ReservationUpdateForm } from "../../components/reservation/ReservationUpdateForm";
import { CancellationDialog } from "../../components/reservation/CancellationDialog";
import { Button } from "../../components/ui";

type ViewState = "lookup" | "details" | "edit";

const ManagePage: Component = () => {
  const [currentView, setCurrentView] = createSignal<ViewState>("lookup");
  const [reservation, setReservation] = createSignal<Reservation | null>(null);
  const [showCancellationDialog, setShowCancellationDialog] =
    createSignal(false);
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const handleReservationFound = (foundReservation: Reservation) => {
    setReservation(foundReservation);
    setCurrentView("details");
    setSuccessMessage("Reservation found successfully!");
    setErrorMessage(null);
  };

  const handleLookupError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage(null);
  };

  const handleEditReservation = () => {
    setCurrentView("edit");
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleCancelReservation = () => {
    setShowCancellationDialog(true);
  };

  const handleUpdateSuccess = (updatedReservation: Reservation) => {
    setReservation(updatedReservation);
    setCurrentView("details");
    setSuccessMessage("Reservation updated successfully!");
    setErrorMessage(null);
  };

  const handleUpdateError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage(null);
  };

  const handleCancelSuccess = (cancelledReservation: Reservation) => {
    setReservation(cancelledReservation);
    setCurrentView("details");
    setSuccessMessage("Reservation cancelled successfully.");
    setErrorMessage(null);
  };

  const handleCancelError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage(null);
  };

  const handleBackToLookup = () => {
    setCurrentView("lookup");
    setReservation(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleBackToDetails = () => {
    setCurrentView("details");
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Manage Your Reservation
          </h1>
          <p class="text-gray-600 mt-2">
            Look up, modify, or cancel your existing reservation
          </p>
        </div>

        {/* Success/Error Messages */}
        <Show when={successMessage()}>
          <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p class="text-sm text-green-600">{successMessage()}</p>
          </div>
        </Show>

        <Show when={errorMessage()}>
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm text-red-600">{errorMessage()}</p>
          </div>
        </Show>

        {/* Navigation Breadcrumb */}
        <Show when={currentView() !== "lookup"}>
          <div class="mb-6">
            <nav class="flex" aria-label="Breadcrumb">
              <ol class="flex items-center space-x-4">
                <li>
                  <button
                    onClick={handleBackToLookup}
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Find Reservation
                  </button>
                </li>
                <li class="flex items-center">
                  <svg
                    class="flex-shrink-0 h-4 w-4 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <Show
                    when={currentView() === "details"}
                    fallback={
                      <button
                        onClick={handleBackToDetails}
                        class="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Reservation Details
                      </button>
                    }
                  >
                    <span class="ml-4 text-sm font-medium text-gray-500">
                      Reservation Details
                    </span>
                  </Show>
                </li>
                <Show when={currentView() === "edit"}>
                  <li class="flex items-center">
                    <svg
                      class="flex-shrink-0 h-4 w-4 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span class="ml-4 text-sm font-medium text-gray-500">
                      Modify Reservation
                    </span>
                  </li>
                </Show>
              </ol>
            </nav>
          </div>
        </Show>

        {/* Main Content */}
        <Show when={currentView() === "lookup"}>
          <div class="max-w-2xl mx-auto">
            <ReservationLookup
              onReservationFound={handleReservationFound}
              onError={handleLookupError}
            />
          </div>
        </Show>

        <Show when={currentView() === "details" && reservation()}>
          <ReservationDetails
            reservation={reservation()!}
            onEdit={handleEditReservation}
            onCancel={handleCancelReservation}
            showActions={true}
          />
        </Show>

        <Show when={currentView() === "edit" && reservation()}>
          <div class="max-w-2xl mx-auto">
            <ReservationUpdateForm
              reservation={reservation()!}
              onSuccess={handleUpdateSuccess}
              onCancel={handleBackToDetails}
              onError={handleUpdateError}
            />
          </div>
        </Show>

        {/* Cancellation Dialog */}
        <CancellationDialog
          isOpen={showCancellationDialog()}
          reservation={reservation()}
          onClose={() => setShowCancellationDialog(false)}
          onSuccess={handleCancelSuccess}
          onError={handleCancelError}
        />
      </div>
    </div>
  );
};

export default ManagePage;
