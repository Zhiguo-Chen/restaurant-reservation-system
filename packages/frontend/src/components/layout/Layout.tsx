import { Component } from "solid-js";
import { Outlet } from "@solidjs/router";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout: Component = () => {
  return (
    <div class="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main class="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
