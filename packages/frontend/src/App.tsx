import { Component } from "solid-js";
import { Router } from "@solidjs/router";
import { AppRoutes } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./styles/global.css";

const App: Component = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
