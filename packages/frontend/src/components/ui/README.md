# UI Component Library

This directory contains reusable UI components for the restaurant reservation system frontend.

## Components

### Button

A versatile button component with multiple variants and sizes.

**Props:**

- `variant`: "primary" | "secondary" | "danger" | "ghost"
- `size`: "sm" | "md" | "lg"
- `loading`: boolean
- Standard HTML button attributes

**Usage:**

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

### Input

A form input component with label, error, and helper text support.

**Props:**

- `label`: string
- `error`: string
- `helperText`: string
- Standard HTML input attributes

**Usage:**

```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
/>
```

### Card

A container component with header, body, and footer sections.

**Components:**

- `Card`: Main container
- `CardHeader`: Header section
- `CardBody`: Main content area
- `CardFooter`: Footer section

**Usage:**

```tsx
<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Modal

A modal dialog component with backdrop and escape key handling.

**Props:**

- `isOpen`: boolean
- `onClose`: () => void
- `title`: string (optional)
- `size`: "sm" | "md" | "lg" | "xl"

**Usage:**

```tsx
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title">
  <p>Modal content</p>
</Modal>
```

### Select

A dropdown select component with options and validation support.

**Props:**

- `label`: string
- `error`: string
- `helperText`: string
- `options`: Array<{value: string, label: string}>
- `placeholder`: string
- Standard HTML select attributes

**Usage:**

```tsx
<Select
  label="Status"
  options={[
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ]}
  placeholder="Select status"
/>
```

### Badge

A small status indicator component.

**Props:**

- `variant`: "default" | "success" | "warning" | "danger" | "info"
- `size`: "sm" | "md"

**Usage:**

```tsx
<Badge variant="success">Active</Badge>
```

### Table

A set of table components for displaying tabular data.

**Components:**

- `Table`: Main table container
- `TableHeader`: Table header
- `TableBody`: Table body
- `TableRow`: Table row
- `TableCell`: Table data cell
- `TableHeadCell`: Table header cell

**Usage:**

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHeadCell>Name</TableHeadCell>
      <TableHeadCell>Status</TableHeadCell>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>
        <Badge variant="success">Active</Badge>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Styling

All components use Tailwind CSS classes and follow the design system defined in `global.css`. Components are designed to be:

- Responsive and mobile-friendly
- Accessible with proper ARIA attributes
- Consistent with the overall design language
- Customizable through props and CSS classes

## Testing

Each component should have corresponding test files in the `__tests__` directory. Tests should cover:

- Rendering with default props
- Rendering with different prop variations
- User interactions (clicks, form submissions, etc.)
- Accessibility requirements
