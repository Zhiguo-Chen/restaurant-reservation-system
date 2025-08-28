import { apolloClient } from "./apolloClient";
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

export class ReservationService {
  async getReservations(
    filters?: ReservationFilters,
    pagination?: PaginationOptions
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

    const { data } = await apolloClient.query<GetReservationsQueryResult>({
      query: GET_RESERVATIONS_QUERY,
      variables: { filter, pagination: paginationInput },
      fetchPolicy: "cache-first",
    });

    return data.reservations;
  }

  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const { data } = await apolloClient.mutate<CreateReservationMutationResult>(
      {
        mutation: CREATE_RESERVATION_MUTATION,
        variables: { input },
        // 更新缓存
        refetchQueries: [{ query: GET_RESERVATIONS_QUERY }],
      }
    );

    if (!data?.createReservation) {
      throw new Error("Failed to create reservation");
    }

    return data.createReservation;
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const { data } = await apolloClient.query<GetReservationQueryResult>({
      query: GET_RESERVATION_QUERY,
      variables: { id },
      fetchPolicy: "cache-first",
    });

    return data?.reservation || null;
  }

  async getReservationsByEmail(email: string): Promise<Reservation[]> {
    const { data } =
      await apolloClient.query<GetReservationsByEmailQueryResult>({
        query: GET_RESERVATIONS_BY_EMAIL_QUERY,
        variables: { email },
        fetchPolicy: "cache-first",
      });

    return data?.reservationsByEmail || [];
  }

  async updateReservation(
    id: string,
    input: UpdateReservationInput
  ): Promise<Reservation> {
    const { data } = await apolloClient.mutate<UpdateReservationMutationResult>(
      {
        mutation: UPDATE_RESERVATION_MUTATION,
        variables: { id, input },
        // 更新缓存
        refetchQueries: [
          { query: GET_RESERVATIONS_QUERY },
          { query: GET_RESERVATION_QUERY, variables: { id } },
        ],
      }
    );

    if (!data?.updateReservation) {
      throw new Error("Failed to update reservation");
    }

    return data.updateReservation;
  }

  async cancelReservation(id: string): Promise<Reservation> {
    const { data } = await apolloClient.mutate<CancelReservationMutationResult>(
      {
        mutation: CANCEL_RESERVATION_MUTATION,
        variables: { id },
        // 更新缓存
        refetchQueries: [
          { query: GET_RESERVATIONS_QUERY },
          { query: GET_RESERVATION_QUERY, variables: { id } },
        ],
      }
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
    const { data } =
      await apolloClient.mutate<UpdateReservationStatusMutationResult>({
        mutation: UPDATE_RESERVATION_STATUS_MUTATION,
        variables: { id, status },
        // 更新缓存
        refetchQueries: [
          { query: GET_RESERVATIONS_QUERY },
          { query: GET_RESERVATION_QUERY, variables: { id } },
        ],
      });

    if (!data?.updateReservationStatus) {
      throw new Error("Failed to update reservation status");
    }

    return data.updateReservationStatus;
  }
}

export const reservationService = new ReservationService();
