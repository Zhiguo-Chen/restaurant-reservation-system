// Types previously from ../../types

export enum UserRole {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

export enum ReservationStatus {
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
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
