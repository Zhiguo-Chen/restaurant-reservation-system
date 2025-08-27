import { Component } from "solid-js";
import { A } from "@solidjs/router";

const NotFoundPage: Component = () => {
  return (
    <div class="min-h-96 flex items-center justify-center">
      <div class="text-center">
        <div class="text-9xl font-bold text-gray-300 mb-4">404</div>
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p class="text-gray-600 mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved, deleted, or you entered the wrong URL.
        </p>
        <div class="space-x-4">
          <A
            href="/"
            class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Home
          </A>
          <A
            href="/guest/reserve"
            class="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Make Reservation
          </A>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
