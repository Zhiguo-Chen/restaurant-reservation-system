import { Component, JSX, splitProps } from "solid-js";

interface CardProps {
  children: JSX.Element;
  class?: string;
}

interface CardHeaderProps {
  children: JSX.Element;
  class?: string;
}

interface CardBodyProps {
  children: JSX.Element;
  class?: string;
}

interface CardFooterProps {
  children: JSX.Element;
  class?: string;
}

export const Card: Component<CardProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <div
      class={`bg-white rounded-lg shadow-md ${local.class || ""}`}
      {...others}
    >
      {local.children}
    </div>
  );
};

export const CardHeader: Component<CardHeaderProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <div
      class={`px-6 py-4 border-b border-gray-200 ${local.class || ""}`}
      {...others}
    >
      {local.children}
    </div>
  );
};

export const CardBody: Component<CardBodyProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <div class={`px-6 py-4 ${local.class || ""}`} {...others}>
      {local.children}
    </div>
  );
};

export const CardFooter: Component<CardFooterProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <div
      class={`px-6 py-4 border-t border-gray-200 ${local.class || ""}`}
      {...others}
    >
      {local.children}
    </div>
  );
};
