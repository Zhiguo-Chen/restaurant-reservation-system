import { graphqlClient } from "./apolloClient";
import {
  GET_RESERVATIONS_QUERY,
  GET_RESERVATION_QUERY,
  GET_RESERVATIONS_BY_EMAIL_QUERY,
  CREATE_RESERVATION_MUTATION,
  UPDATE_RESERVATION_MUTATION,
  CANCEL_RESERVATION_MUTATION,
  UPDATE_RESERVATION_STATUS_MUTATION,
} from "./graphql/queries";
import {
  Reservation,
  ReservationStatus,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationFilter,
  PaginationInput,
  ReservationConnection,
  GetReservationsQueryResult,
  GetReservationQueryResult,
  GetReservationsByEmailQueryResult,
  CreateReservationMutationResult,
  UpdateReservationMutationResult,
  CancelReservationMutationResult,
  UpdateReservationStatusMutationResult,
} from "../types/graphql";

export interface ReservationFilters {
  startDate?: Date;
  endDate?: Date;
  status?: ReservationStatus;
  guestName?: string;
  guestEmail?: string;
  tableSize?: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field?: string;
  direction?: "ASC" | "DESC";
}

export class ReservationService {
  async getReservations(
    filters?: ReservationFilters,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): Promise<ReservationConnection> {
    const filter: ReservationFilter = {};

    if (filters) {
      if (filters.startDate) filter.startDate = filters.startDate.toISOString();
      if (filters.endDate) filter.endDate = filters.endDate.toISOString();
      if (filters.status) filter.status = filters.status;
      if (filters.guestName) filter.guestName = filters.guestName;
      if (filters.guestEmail) filter.guestEmail = filters.guestEmail;
      if (filters.tableSize) filter.tableSize = filters.tableSize;
    }

    const paginationInput: PaginationInput = {
      limit: pagination?.limit || 20,
      offset: pagination?.offset || 0,
    };

    const data = await graphqlClient.request<GetReservationsQueryResult>(
      GET_RESERVATIONS_QUERY,
      { filter, pagination: paginationInput }
    );

    return data.reservations;
  }

  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const data = await graphqlClient.request<CreateReservationMutationResult>(
      CREATE_RESERVATION_MUTATION,
      { input }
    );

    if (!data?.createReservation) {
      throw new Error("Failed to create reservation");
    }

    return data.createReservation;
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const data = await graphqlClient.request<GetReservationQueryResult>(
      GET_RESERVATION_QUERY,
      { id }
    );

    return data?.reservation || null;
  }

  async getReservationsByEmail(email: string): Promise<Reservation[]> {
    const data = await graphqlClient.request<GetReservationsByEmailQueryResult>(
      GET_RESERVATIONS_BY_EMAIL_QUERY,
      { email }
    );

    return data?.reservationsByEmail || [];
  }

  async updateReservation(
    id: string,
    input: UpdateReservationInput
  ): Promise<Reservation> {
    const data = await graphqlClient.request<UpdateReservationMutationResult>(
      UPDATE_RESERVATION_MUTATION,
      { id, input }
    );

    if (!data?.updateReservation) {
      throw new Error("Failed to update reservation");
    }

    return data.updateReservation;
  }

  async cancelReservation(id: string): Promise<Reservation> {
    const data = await graphqlClient.request<CancelReservationMutationResult>(
      CANCEL_RESERVATION_MUTATION,
      { id }
    );

    if (!data?.cancelReservation) {
      throw new Error("Failed to cancel reservation");
    }

    return data.cancelReservation;
  }

  async updateReservationStatus(
    id: string,
    status: ReservationStatus
  ): Promise<Reservation> {
    const data =
      await graphqlClient.request<UpdateReservationStatusMutationResult>(
        UPDATE_RESERVATION_STATUS_MUTATION,
        { id, status }
      );

    if (!data?.updateReservationStatus) {
      throw new Error("Failed to update reservation status");
    }

    return data.updateReservationStatus;
  }
}

export const reservationService = new ReservationService();
