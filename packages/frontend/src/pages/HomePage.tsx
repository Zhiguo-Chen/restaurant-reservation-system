import { Component } from "solid-js";
import { A } from "@solidjs/router";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types";

const HomePage: Component = () => {
  const { user, isAuthenticated } = useAuth();

  // Check if user is an employee (EMPLOYEE or ADMIN role)
  const isEmployee = () => {
    const currentUser = user();
    return (
      currentUser &&
      (currentUser.role === UserRole.EMPLOYEE ||
        currentUser.role === UserRole.ADMIN)
    );
  };

  return (
    <div class="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div class="text-center py-16">
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to Our Restaurant
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Experience exceptional dining with our easy-to-use reservation system.
          Book your table in just a few clicks and enjoy a memorable meal with
          us.
        </p>
        <div class="space-x-4">
          <A
            href="/guest/reserve"
            class="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Make a Reservation
          </A>
          {isEmployee() && (
            <A
              href="/employee/"
              class="inline-block bg-gray-200 text-gray-800 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Manage Existing
            </A>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
        <div class="text-center">
          <div class="text-4xl mb-4">🍽️</div>
          <h3 class="text-xl font-semibold mb-2">Easy Booking</h3>
          <p class="text-gray-600">
            Reserve your table in just a few clicks with our intuitive booking
            system.
          </p>
        </div>
        <div class="text-center">
          <div class="text-4xl mb-4">📱</div>
          <h3 class="text-xl font-semibold mb-2">Manage Anytime</h3>
          <p class="text-gray-600">
            View, modify, or cancel your reservations easily from any device.
          </p>
        </div>
        <div class="text-center">
          <div class="text-4xl mb-4">⭐</div>
          <h3 class="text-xl font-semibold mb-2">Premium Experience</h3>
          <p class="text-gray-600">
            Enjoy exceptional service and cuisine in our welcoming atmosphere.
          </p>
        </div>
      </div>

      {/* Hours Section */}
      <div class="bg-white rounded-lg shadow-md p-8 mb-16">
        <h2 class="text-2xl font-bold text-center mb-8">Restaurant Hours</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-medium">Monday</span>
              <span class="text-red-600">Closed</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Tuesday - Thursday</span>
              <span>10:00 AM - 10:00 PM</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Friday - Saturday</span>
              <span>10:00 AM - 11:00 PM</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Sunday</span>
              <span>10:00 AM - 9:00 PM</span>
            </div>
          </div>
          <div class="text-center md:text-left">
            <p class="text-gray-600 mb-4">
              Please note that reservations are available during our operating
              hours. We recommend booking in advance, especially for weekends.
            </p>
            <p class="text-sm text-gray-500">
              Large parties (9+ people) require at least 24 hours advance
              notice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
