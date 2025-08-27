import { Component, createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthRedirect } from "../../hooks/useAuthRedirect";
import { Button, Input, Card, CardBody } from "../../components/ui";

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginFormErrors {
  username?: string;
  password?: string;
  general?: string;
}

const LoginPage: Component = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();
  const { redirectAfterLogin } = useAuthRedirect();

  const [formData, setFormData] = createSignal<LoginFormData>({
    username: "",
    password: "",
  });

  const [errors, setErrors] = createSignal<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Redirect if already authenticated
  if (isAuthenticated()) {
    navigate("/employee");
    return null;
  }

  const validateForm = (data: LoginFormData): LoginFormErrors => {
    const newErrors: LoginFormErrors = {};

    if (!data.username.trim()) {
      newErrors.username = "Username is required";
    } else if (data.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!data.password.trim()) {
      newErrors.password = "Password is required";
    } else if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors()[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const data = formData();
    const formErrors = validateForm(data);

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(data.username, data.password);
      redirectAfterLogin();
    } catch (error) {
      console.error("Login failed:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class="max-w-md mx-auto">
      <Card>
        <CardBody>
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-gray-900">Employee Login</h1>
            <p class="text-gray-600 mt-2">
              Sign in to access the reservation management system
            </p>
          </div>

          <Show when={errors().general}>
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{errors().general}</p>
            </div>
          </Show>

          <form onSubmit={handleSubmit} class="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="Enter your username"
              value={formData().username}
              error={errors().username}
              onInput={(e) =>
                handleInputChange("username", e.currentTarget.value)
              }
              disabled={isSubmitting() || isLoading()}
              autocomplete="username"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData().password}
              error={errors().password}
              onInput={(e) =>
                handleInputChange("password", e.currentTarget.value)
              }
              disabled={isSubmitting() || isLoading()}
              autocomplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              class="w-full"
              loading={isSubmitting() || isLoading()}
              disabled={isSubmitting() || isLoading()}
            >
              {isSubmitting() || isLoading() ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-500">
              For demo purposes, you can use any username/password combination
              that meets the validation requirements.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;
