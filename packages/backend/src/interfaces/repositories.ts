import { Reservation, ReservationStatus, User } from "../types/shared";

export interface BaseRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface ReservationRepository extends BaseRepository<Reservation> {
  findByDateRange(startDate: Date, endDate: Date): Promise<Reservation[]>;
  findByStatus(status: ReservationStatus): Promise<Reservation[]>;
  findByGuestEmail(email: string): Promise<Reservation[]>;
  findByDateAndStatus(
    date: Date,
    status?: ReservationStatus
  ): Promise<Reservation[]>;
}

export interface UserRepository extends BaseRepository<User> {
  findByUsername(username: string): Promise<User | null>;
}
