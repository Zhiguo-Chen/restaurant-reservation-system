import { Component, lazy } from "solid-js";
import { Route, Routes } from "@solidjs/router";
import { AuthGuard } from "../components/auth/AuthGuard";
import { Layout } from "../components/layout/Layout";

// Lazy load components for better performance
const HomePage = lazy(() => import("../pages/HomePage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const GuestReservationPage = lazy(
  () => import("../pages/guest/ReservationPage")
);
const GuestManagePage = lazy(() => import("../pages/guest/ManagePage"));
const EmployeeDashboard = lazy(() => import("../pages/employee/Dashboard"));
const EmployeeReservationDetail = lazy(
  () => import("../pages/employee/ReservationDetail")
);
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

export const AppRoutes: Component = () => {
  return (
    <Routes>
      <Route path="/" component={Layout}>
        {/* Public routes */}
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />

        {/* Guest routes */}
        <Route path="/guest">
          <Route path="/reserve" component={GuestReservationPage} />
          <Route path="/manage" component={GuestManagePage} />
        </Route>

        {/* Employee routes - protected */}
        <Route path="/employee">
          <Route
            path="/"
            component={() => (
              <AuthGuard>
                <EmployeeDashboard />
              </AuthGuard>
            )}
          />
          <Route
            path="/reservation/:id"
            component={() => (
              <AuthGuard>
                <EmployeeReservationDetail />
              </AuthGuard>
            )}
          />
        </Route>

        {/* 404 fallback */}
        <Route path="*" component={NotFoundPage} />
      </Route>
    </Routes>
  );
};
