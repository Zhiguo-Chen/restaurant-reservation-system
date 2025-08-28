// GraphQL 类型定义

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export enum UserRole {
  GUEST = "GUEST",
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
}

export enum ReservationStatus {
  REQUESTED = "REQUESTED",
  CONFIRMED = "CONFIRMED",
  APPROVED = "APPROVED",
  SEATED = "SEATED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export interface Reservation {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  arrivalTime: string; // ISO date string
  tableSize: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  notes?: string;
}

// Input types
export interface LoginInput {
  username: string;
  password: string;
}

export interface CreateReservationInput {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  arrivalTime: string; // ISO date string
  tableSize: number;
  notes?: string;
}

export interface UpdateReservationInput {
  arrivalTime?: string;
  tableSize?: number;
  notes?: string;
}

export interface ReservationFilter {
  startDate?: string;
  endDate?: string;
  status?: ReservationStatus;
  guestName?: string;
  guestEmail?: string;
  tableSize?: number;
}

export interface PaginationInput {
  limit?: number;
  offset?: number;
}

// Response types
export interface AuthPayload {
  token: string;
  user: User;
  expiresIn: number;
}

export interface LogoutResponse {
  message: string;
  timestamp: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: User;
  timestamp: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ReservationConnection {
  data: Reservation[];
  pagination: PaginationInfo;
}

// Query result types
export interface LoginMutationResult {
  login: AuthPayload;
}

export interface LogoutMutationResult {
  logout: LogoutResponse;
}

export interface ValidateTokenQueryResult {
  validateToken: TokenValidationResponse;
}

export interface MeQueryResult {
  me: User;
}

export interface GetReservationsQueryResult {
  reservations: ReservationConnection;
}

export interface GetReservationQueryResult {
  reservation: Reservation;
}

export interface GetReservationsByEmailQueryResult {
  reservationsByEmail: Reservation[];
}

export interface CreateReservationMutationResult {
  createReservation: Reservation;
}

export interface UpdateReservationMutationResult {
  updateReservation: Reservation;
}

export interface CancelReservationMutationResult {
  cancelReservation: Reservation;
}

export interface UpdateReservationStatusMutationResult {
  updateReservationStatus: Reservation;
}
