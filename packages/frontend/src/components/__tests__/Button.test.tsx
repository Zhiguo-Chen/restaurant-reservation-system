import { render, screen } from "@solidjs/testing-library";
import { vi } from "vitest";
import { Button } from "../ui/Button";

describe("Button", () => {
  it("renders with default props", () => {
    render(() => <Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-blue-600");
  });

  it("renders with different variants", () => {
    render(() => <Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole("button", { name: "Secondary" });
    expect(button).toHaveClass("bg-gray-200");
  });

  it("renders with different sizes", () => {
    render(() => <Button size="lg">Large Button</Button>);

    const button = screen.getByRole("button", { name: "Large Button" });
    expect(button).toHaveClass("px-6", "py-3");
  });

  it("shows loading state", () => {
    render(() => <Button loading>Loading</Button>);

    const button = screen.getByRole("button", { name: "Loading" });
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(() => <Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
