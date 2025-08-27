/**
 * GraphQL Playground configuration and sample queries
 */

export const playgroundConfig = {
  settings: {
    "request.credentials": "include",
    "general.betaUpdates": false,
    "editor.theme": "dark",
    "editor.cursorShape": "line",
    "editor.reuseHeaders": true,
    "tracing.hideTracingResponse": true,
    "queryPlan.hideQueryPlanResponse": true,
    "editor.fontSize": 14,
    "editor.fontFamily":
      "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
  },
  tabs: [
    {
      endpoint: "/graphql",
      query: `# Welcome to the Restaurant Reservation System GraphQL API!
# 
# This is GraphQL Playground - an interactive GraphQL IDE.
# You can write queries, mutations, and explore the schema here.
#
# To get started, try these sample queries:

# 1. Get current user info (requires authentication)
query GetCurrentUser {
  me {
    id
    username
    role
  }
}

# 2. Get today's reservations
query GetTodaysReservations {
  reservations(filter: { startDate: "2024-01-01T00:00:00.000Z" }) {
    id
    guestName
    guestEmail
    arrivalTime
    tableSize
    status
    createdAt
  }
}

# 3. Create a new reservation
mutation CreateReservation {
  createReservation(input: {
    guestName: "John Doe"
    guestEmail: "john@example.com"
    guestPhone: "+1234567890"
    arrivalTime: "2024-01-01T19:00:00.000Z"
    tableSize: 4
    notes: "Birthday celebration"
  }) {
    id
    guestName
    status
    arrivalTime
    createdAt
  }
}`,
      variables: "{}",
      headers: {
        Authorization: "Bearer YOUR_JWT_TOKEN_HERE",
      },
    },
    {
      endpoint: "/graphql",
      query: `# Employee/Admin Operations
# These operations require authentication with EMPLOYEE or ADMIN role

# Update reservation status
mutation UpdateReservationStatus {
  updateReservationStatus(id: "reservation-id", status: APPROVED) {
    id
    status
    updatedAt
    updatedBy
  }
}

# Get reservations with filtering
query GetFilteredReservations {
  reservations(filter: {
    startDate: "2024-01-01T00:00:00.000Z"
    endDate: "2024-01-02T00:00:00.000Z"
    status: REQUESTED
  }) {
    id
    guestName
    guestEmail
    arrivalTime
    tableSize
    status
    notes
  }
}`,
      variables: "{}",
      headers: {
        Authorization: "Bearer YOUR_JWT_TOKEN_HERE",
      },
    },
  ],
};

export const sampleQueries = {
  // Authentication queries
  getCurrentUser: `
    query GetCurrentUser {
      me {
        id
        username
        role
      }
    }
  `,

  // Reservation queries
  getTodaysReservations: `
    query GetTodaysReservations($date: DateTime!) {
      reservations(filter: { startDate: $date }) {
        id
        guestName
        guestEmail
        guestPhone
        arrivalTime
        tableSize
        status
        createdAt
        updatedAt
        notes
      }
    }
  `,

  getReservationById: `
    query GetReservation($id: ID!) {
      reservation(id: $id) {
        id
        guestName
        guestEmail
        guestPhone
        arrivalTime
        tableSize
        status
        createdAt
        updatedAt
        updatedBy
        notes
      }
    }
  `,

  // Reservation mutations
  createReservation: `
    mutation CreateReservation($input: CreateReservationInput!) {
      createReservation(input: $input) {
        id
        guestName
        guestEmail
        arrivalTime
        tableSize
        status
        createdAt
      }
    }
  `,

  updateReservation: `
    mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
      updateReservation(id: $id, input: $input) {
        id
        arrivalTime
        tableSize
        notes
        updatedAt
        updatedBy
      }
    }
  `,

  cancelReservation: `
    mutation CancelReservation($id: ID!) {
      cancelReservation(id: $id) {
        id
        status
        updatedAt
      }
    }
  `,

  updateReservationStatus: `
    mutation UpdateReservationStatus($id: ID!, $status: ReservationStatus!) {
      updateReservationStatus(id: $id, status: $status) {
        id
        status
        updatedAt
        updatedBy
      }
    }
  `,
};

export const sampleVariables = {
  createReservation: {
    input: {
      guestName: "John Doe",
      guestEmail: "john@example.com",
      guestPhone: "+1234567890",
      arrivalTime: "2024-01-01T19:00:00.000Z",
      tableSize: 4,
      notes: "Birthday celebration",
    },
  },

  updateReservation: {
    id: "reservation-id",
    input: {
      arrivalTime: "2024-01-01T20:00:00.000Z",
      tableSize: 6,
      notes: "Updated for larger party",
    },
  },

  getTodaysReservations: {
    date: new Date().toISOString(),
  },

  getReservationById: {
    id: "reservation-id",
  },

  cancelReservation: {
    id: "reservation-id",
  },

  updateReservationStatus: {
    id: "reservation-id",
    status: "APPROVED",
  },
};
