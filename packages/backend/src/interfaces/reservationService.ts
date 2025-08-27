import {
  Reservation,
  ReservationStatus,
  ReservationFilter,
  PaginationInput,
  PaginatedResponse,
} from "@restaurant-reservation/shared";

export interface EnhancedReservationService {
  // Basic CRUD operations
  getReservation(id: string): Promise<Reservation | null>;

  // Query operations with filtering and pagination
  getReservations(
    filter?: ReservationFilter,
    pagination?: PaginationInput
  ): Promise<PaginatedResponse<Reservation>>;

  // Search by guest email
  getReservationsByEmail(email: string): Promise<Reservation[]>;

  // Date-based queries
  getReservationsByDateRange(
    startDate: Date,
    endDate: Date,
    status?: ReservationStatus
  ): Promise<Reservation[]>;

  // Status-based queries
  getReservationsByStatus(status: ReservationStatus): Promise<Reservation[]>;

  // Guest-specific queries
  getReservationsByGuest(
    guestName?: string,
    guestEmail?: string,
    guestPhone?: string
  ): Promise<Reservation[]>;

  // Table size queries
  getReservationsByTableSize(
    tableSize: number,
    date?: Date
  ): Promise<Reservation[]>;

  // Count operations
  countReservations(filter?: ReservationFilter): Promise<number>;
  countReservationsByStatus(status: ReservationStatus): Promise<number>;
  countReservationsByDate(date: Date): Promise<number>;
}
