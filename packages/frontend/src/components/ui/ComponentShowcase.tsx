import { Component, createSignal } from "solid-js";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Modal,
  Select,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
} from "./index";

export const ComponentShowcase: Component = () => {
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [inputValue, setInputValue] = createSignal("");
  const [selectValue, setSelectValue] = createSignal("");

  const selectOptions = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  return (
    <div class="p-8 space-y-8">
      <h1 class="text-3xl font-bold text-gray-900">Component Showcase</h1>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Buttons</h2>
        </CardHeader>
        <CardBody>
          <div class="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button loading>Loading</Button>
          </div>
        </CardBody>
      </Card>

      {/* Form Components */}
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Form Components</h2>
        </CardHeader>
        <CardBody>
          <div class="space-y-4 max-w-md">
            <Input
              label="Text Input"
              placeholder="Enter some text"
              value={inputValue()}
              onInput={(e) => setInputValue(e.currentTarget.value)}
            />
            <Select
              label="Select Dropdown"
              options={selectOptions}
              placeholder="Choose an option"
              value={selectValue()}
              onChange={(e) => setSelectValue(e.currentTarget.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Badges</h2>
        </CardHeader>
        <CardBody>
          <div class="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Table</h2>
        </CardHeader>
        <CardBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>John Doe</TableCell>
                <TableCell>
                  <Badge variant="success">Active</Badge>
                </TableCell>
                <TableCell>2024-01-15</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Jane Smith</TableCell>
                <TableCell>
                  <Badge variant="warning">Pending</Badge>
                </TableCell>
                <TableCell>2024-01-14</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal */}
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Modal</h2>
        </CardHeader>
        <CardBody>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        </CardBody>
      </Card>

      <Modal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
      >
        <div class="space-y-4">
          <p>This is an example modal dialog.</p>
          <div class="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
