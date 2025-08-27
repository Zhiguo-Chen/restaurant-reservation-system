import { Component, JSX, splitProps } from "solid-js";

interface BadgeProps {
  children: JSX.Element;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  class?: string;
}

export const Badge: Component<BadgeProps> = (props) => {
  const [local, others] = splitProps(props, [
    "children",
    "variant",
    "size",
    "class",
  ]);

  const baseClasses =
    "inline-flex items-center font-medium rounded-full px-2.5 py-0.5";

  const variantClasses = () => {
    switch (local.variant || "default") {
      case "default":
        return "bg-gray-100 text-gray-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "danger":
        return "bg-red-100 text-red-800";
      case "info":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sizeClasses = () => {
    switch (local.size || "md") {
      case "sm":
        return "text-xs";
      case "md":
        return "text-sm";
      default:
        return "text-sm";
    }
  };

  const classes = () =>
    [baseClasses, variantClasses(), sizeClasses(), local.class || ""].join(" ");

  return (
    <span class={classes()} {...others}>
      {local.children}
    </span>
  );
};
