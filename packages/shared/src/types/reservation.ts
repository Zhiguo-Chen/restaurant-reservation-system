export enum ReservationStatus {
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export interface Reservation {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  arrivalTime: Date;
  tableSize: number;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  notes?: string;
}

export interface CreateReservationInput {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  arrivalTime: Date;
  tableSize: number;
  notes?: string;
}

export interface UpdateReservationInput {
  arrivalTime?: Date;
  tableSize?: number;
  notes?: string;
}

export interface ReservationFilter {
  startDate?: Date;
  endDate?: Date;
  status?: ReservationStatus;
  guestName?: string;
  guestEmail?: string;
  tableSize?: number;
}

export interface CreateReservationData extends CreateReservationInput {
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateReservationData {
  arrivalTime?: Date;
  tableSize?: number;
  notes?: string;
  updatedAt: Date;
  updatedBy?: string;
}
