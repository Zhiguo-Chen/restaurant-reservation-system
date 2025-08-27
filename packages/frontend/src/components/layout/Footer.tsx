import { Component } from "solid-js";

export const Footer: Component = () => {
  return (
    <footer class="bg-gray-800 text-white py-8">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div>
            <h3 class="text-lg font-semibold mb-4">Contact Us</h3>
            <div class="space-y-2 text-gray-300">
              <p>123 Restaurant Street</p>
              <p>City, State 12345</p>
              <p>Phone: (555) 123-4567</p>
              <p>Email: info@restaurant.com</p>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 class="text-lg font-semibold mb-4">Hours</h3>
            <div class="space-y-2 text-gray-300">
              <p>Monday: Closed</p>
              <p>Tuesday - Thursday: 10:00 AM - 10:00 PM</p>
              <p>Friday - Saturday: 10:00 AM - 11:00 PM</p>
              <p>Sunday: 10:00 AM - 9:00 PM</p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
            <div class="space-y-2">
              <a
                href="/guest/reserve"
                class="block text-gray-300 hover:text-white transition-colors"
              >
                Make a Reservation
              </a>
              <a
                href="/guest/manage"
                class="block text-gray-300 hover:text-white transition-colors"
              >
                Manage Reservation
              </a>
              <a
                href="/login"
                class="block text-gray-300 hover:text-white transition-colors"
              >
                Employee Portal
              </a>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Restaurant Reservation System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
