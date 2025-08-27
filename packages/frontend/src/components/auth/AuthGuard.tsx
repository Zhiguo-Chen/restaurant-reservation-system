import { Component, Show, JSX, createEffect } from "solid-js";
import { Navigate, useLocation } from "@solidjs/router";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface AuthGuardProps {
  children: JSX.Element;
  redirectTo?: string;
  requireRole?: string[];
}

export const AuthGuard: Component<AuthGuardProps> = (props) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const redirectPath = props.redirectTo || "/login";

  // Store the attempted URL for redirect after login
  createEffect(() => {
    if (!isAuthenticated() && !isLoading()) {
      const currentPath = location.pathname + location.search;
      if (currentPath !== "/login") {
        sessionStorage.setItem("redirectAfterLogin", currentPath);
      }
    }
  });

  const hasRequiredRole = () => {
    if (!props.requireRole || props.requireRole.length === 0) {
      return true;
    }

    const currentUser = user();
    if (!currentUser) {
      return false;
    }

    return props.requireRole.includes(currentUser.role);
  };

  return (
    <Show
      when={!isLoading()}
      fallback={
        <div class="flex justify-center items-center min-h-64">
          <LoadingSpinner />
          <span class="ml-2 text-gray-600">Verifying authentication...</span>
        </div>
      }
    >
      <Show
        when={isAuthenticated()}
        fallback={<Navigate href={redirectPath} />}
      >
        <Show
          when={hasRequiredRole()}
          fallback={
            <div class="flex flex-col items-center justify-center min-h-64 text-center">
              <div class="text-red-600 text-6xl mb-4">🚫</div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p class="text-gray-600 mb-4">
                You don't have permission to access this page.
              </p>
              <Navigate href="/employee" />
            </div>
          }
        >
          {props.children}
        </Show>
      </Show>
    </Show>
  );
};
