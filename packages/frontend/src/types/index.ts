// Types previously from ../../types

export enum UserRole {
  GUEST = "guest",
  EMPLOYEE = "employee",
  MANAGER = "manager",
  ADMIN = "admin",
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

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  arrivalTime: string;
  tableSize: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationInput {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  arrivalTime: string;
  tableSize: number;
  notes?: string;
}

export interface UpdateReservationInput {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  arrivalTime?: string;
  tableSize?: number;
  status?: ReservationStatus;
  notes?: string;
}
