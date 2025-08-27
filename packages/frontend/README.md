# Frontend - Restaurant Reservation System

This is the frontend SPA (Single Page Application) built with SolidJS and TypeScript for the restaurant reservation system.

## Technology Stack

- **Framework**: SolidJS with TypeScript
- **Routing**: @solidjs/router
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest + SolidJS Testing Library
- **GraphQL Client**: graphql-request
- **State Management**: SolidJS signals and stores

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication-related components
│   ├── common/         # Common utility components
│   ├── layout/         # Layout components (Header, Footer, etc.)
│   └── ui/             # UI component library
├── contexts/           # SolidJS contexts (Auth, etc.)
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── employee/       # Employee interface pages
│   └── guest/          # Guest interface pages
├── routes/             # Routing configuration
├── services/           # API services and utilities
├── styles/             # Global styles and Tailwind config
└── test/               # Test setup and utilities
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and fix code
- `npm run type-check` - Type check without emitting
- `npm run clean` - Clean build directory

## Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Features

### Routing Structure

- **Public Routes**:

  - `/` - Home page
  - `/guest/reserve` - Make reservation
  - `/guest/manage` - Manage existing reservations
  - `/login` - Employee login

- **Protected Routes** (require authentication):
  - `/employee` - Employee dashboard
  - `/employee/reservation/:id` - Reservation details

### Component Library

The UI component library includes:

- **Button** - Versatile button with variants and loading states
- **Input** - Form input with validation support
- **Select** - Dropdown select component
- **Card** - Container component with header/body/footer
- **Modal** - Modal dialog with backdrop
- **Badge** - Status indicators
- **Table** - Data table components
- **LoadingSpinner** - Loading indicator
- **ErrorBoundary** - Error handling wrapper

See `src/components/ui/README.md` for detailed component documentation.

### Authentication

The app uses JWT-based authentication with:

- Login/logout functionality
- Protected routes with AuthGuard
- Authentication context for state management
- Token storage in localStorage

### API Integration

- **REST API** for authentication endpoints
- **GraphQL API** for business operations
- Proxy configuration for development
- Error handling and loading states

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:4000
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

## Testing

The project uses Vitest with SolidJS Testing Library:

- Unit tests for components
- Integration tests for user flows
- Mocked API calls and localStorage
- Coverage reporting

## Build and Deployment

The app builds to static files that can be served by any web server:

```bash
npm run build
```

Output is generated in the `dist/` directory.

## Code Style

- TypeScript strict mode enabled
- ESLint for code linting
- Prettier for code formatting (via ESLint)
- Tailwind CSS for styling
- Component-based architecture

## Browser Support

- Modern browsers with ES2020 support
- Mobile responsive design
- Progressive enhancement approach
