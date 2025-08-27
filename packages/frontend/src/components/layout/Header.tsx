import { Component, Show } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useAuth } from "../../contexts/AuthContext";

export const Header: Component = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          {/* Logo */}
          <A href="/" class="text-xl font-bold text-gray-900">
            Restaurant Reservations
          </A>

          {/* Navigation */}
          <nav class="flex items-center space-x-6">
            <A
              href="/guest/reserve"
              class="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Make Reservation
            </A>
            <A
              href="/guest/manage"
              class="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Manage Reservation
            </A>

            <Show
              when={isAuthenticated()}
              fallback={
                <A
                  href="/login"
                  class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Employee Login
                </A>
              }
            >
              <div class="flex items-center space-x-4">
                <A
                  href="/employee"
                  class="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </A>
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-600">
                    Welcome, {user()?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    class="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </Show>
          </nav>
        </div>
      </div>
    </header>
  );
};
