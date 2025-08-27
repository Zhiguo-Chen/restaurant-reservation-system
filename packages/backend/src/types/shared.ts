// Shared types for the restaurant reservation system

export enum ReservationStatus {
  REQUESTED = "requested",
  CONFIRMED = "confirmed",
  APPROVED = "approved",
  SEATED = "seated",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum UserRole {
  GUEST = "guest",
  EMPLOYEE = "employee",
  MANAGER = "manager",
  ADMIN = "admin",
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  tableSize?: number;
  arrivalTime: Date;
  status: ReservationStatus;
  specialRequests?: string;
  notes?: string;
  tableNumber?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateReservationInput {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  tableSize?: number;
  arrivalTime: Date;
  specialRequests?: string;
  notes?: string;
}

export interface UpdateReservationInput {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  partySize?: number;
  tableSize?: number;
  arrivalTime?: Date;
  specialRequests?: string;
  notes?: string;
  tableNumber?: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
}

export interface JwtPayload {
  id: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface GraphQLContext {
  req: any;
  res: any;
  authService: any;
  user?: User;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: ApiError;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface CreateReservationData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  tableSize?: number;
  arrivalTime: Date;
  specialRequests?: string;
  notes?: string;
}

export interface UpdateReservationData {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  partySize?: number;
  tableSize?: number;
  arrivalTime?: Date;
  specialRequests?: string;
  notes?: string;
  tableNumber?: number;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface ReservationFilter {
  status?: ReservationStatus;
  startDate?: Date;
  endDate?: Date;
  guestEmail?: string;
  guestName?: string;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
