import { Request, Response } from "express";
import {
  Reservation,
  ReservationFilter,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationStatus,
  LoginRequest,
  AuthResponse,
  UserInfo,
} from "../types/shared";

export interface AuthController {
  login(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  validateToken(req: Request, res: Response): Promise<void>;
}

export interface ReservationResolver {
  // Queries
  getReservations(filter: ReservationFilter): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation>;

  // Mutations
  createReservation(input: CreateReservationInput): Promise<Reservation>;
  updateReservation(
    id: string,
    input: UpdateReservationInput
  ): Promise<Reservation>;
  cancelReservation(id: string): Promise<Reservation>;
  updateReservationStatus(
    id: string,
    status: ReservationStatus
  ): Promise<Reservation>;
}
