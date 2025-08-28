import { gql } from "apollo-server-express";

export const typeDefs = gql`
  # Scalar types
  scalar DateTime

  # Enums
  enum ReservationStatus {
    REQUESTED
    APPROVED
    CANCELLED
    COMPLETED
  }

  enum UserRole {
    EMPLOYEE
    ADMIN
  }

  # Types
  type User {
    id: ID!
    username: String!
    role: UserRole!
  }

  type Reservation {
    id: ID!
    guestName: String!
    guestPhone: String!
    guestEmail: String!
    arrivalTime: DateTime!
    tableSize: Int!
    status: ReservationStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    updatedBy: String
    notes: String
  }

  # Auth types
  type AuthPayload {
    token: String!
    user: User!
    expiresIn: Int!
  }

  type LogoutResponse {
    message: String!
    timestamp: DateTime!
  }

  type TokenValidationResponse {
    valid: Boolean!
    user: User
    timestamp: DateTime!
  }

  # Input types
  input LoginInput {
    username: String!
    password: String!
  }

  input CreateReservationInput {
    guestName: String!
    guestPhone: String!
    guestEmail: String!
    arrivalTime: DateTime!
    tableSize: Int!
    notes: String
  }

  input UpdateReservationInput {
    arrivalTime: DateTime
    tableSize: Int
    notes: String
  }

  input ReservationFilter {
    startDate: DateTime
    endDate: DateTime
    status: ReservationStatus
    guestName: String
    guestEmail: String
    tableSize: Int
  }

  input PaginationInput {
    limit: Int = 20
    offset: Int = 0
  }

  # Pagination types
  type PaginationInfo {
    total: Int!
    limit: Int!
    offset: Int!
    hasMore: Boolean!
  }

  type ReservationConnection {
    data: [Reservation!]!
    pagination: PaginationInfo!
  }

  # Queries
  type Query {
    # Reservation queries
    reservations(
      filter: ReservationFilter
      pagination: PaginationInput
    ): ReservationConnection!
    reservation(id: ID!): Reservation

    # Search reservations by guest email (for guest access)
    reservationsByEmail(email: String!): [Reservation!]!

    # User queries (for authenticated users)
    me: User

    # Auth queries
    validateToken: TokenValidationResponse!
  }

  # Mutations
  type Mutation {
    # Auth mutations
    login(input: LoginInput!): AuthPayload!
    logout: LogoutResponse!

    # Reservation mutations
    createReservation(input: CreateReservationInput!): Reservation!
    updateReservation(id: ID!, input: UpdateReservationInput!): Reservation!
    cancelReservation(id: ID!): Reservation!

    # Employee/Admin only mutations
    updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!
  }

  # Subscriptions (for future real-time updates)
  type Subscription {
    reservationUpdated: Reservation!
    reservationCreated: Reservation!
  }
`;
