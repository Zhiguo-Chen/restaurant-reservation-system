import { Component, JSX, splitProps } from "solid-js";

interface TableProps {
  children: JSX.Element;
  class?: string;
}

interface TableHeaderProps {
  children: JSX.Element;
  class?: string;
}

interface TableBodyProps {
  children: JSX.Element;
  class?: string;
}

interface TableRowProps {
  children: JSX.Element;
  class?: string;
}

interface TableCellProps {
  children: JSX.Element;
  class?: string;
}

interface TableHeadCellProps {
  children: JSX.Element;
  class?: string;
}

export const Table: Component<TableProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <div class="overflow-x-auto">
      <table
        class={`min-w-full divide-y divide-gray-200 ${local.class || ""}`}
        {...others}
      >
        {local.children}
      </table>
    </div>
  );
};

export const TableHeader: Component<TableHeaderProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <thead class={`bg-gray-50 ${local.class || ""}`} {...others}>
      {local.children}
    </thead>
  );
};

export const TableBody: Component<TableBodyProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <tbody
      class={`bg-white divide-y divide-gray-200 ${local.class || ""}`}
      {...others}
    >
      {local.children}
    </tbody>
  );
};

export const TableRow: Component<TableRowProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <tr class={`hover:bg-gray-50 ${local.class || ""}`} {...others}>
      {local.children}
    </tr>
  );
};

export const TableCell: Component<TableCellProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <td
      class={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
        local.class || ""
      }`}
      {...others}
    >
      {local.children}
    </td>
  );
};

export const TableHeadCell: Component<TableHeadCellProps> = (props) => {
  const [local, others] = splitProps(props, ["children", "class"]);

  return (
    <th
      class={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        local.class || ""
      }`}
      {...others}
    >
      {local.children}
    </th>
  );
};
