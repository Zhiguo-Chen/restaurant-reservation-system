import { graphqlClient } from "./graphqlClient";
import {
  CreateReservationInput,
  Reservation,
  ReservationStatus,
} from "@restaurant-reservation/shared";

export interface CreateReservationResponse {
  createReservation: Reservation;
}

export interface GetReservationResponse {
  getReservation: Reservation;
}

export interface GetReservationsResponse {
  getReservations: {
    data: Reservation[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface ReservationFilters {
  startDate?: Date;
  endDate?: Date;
  status?: ReservationStatus[];
  guestName?: string;
  guestEmail?: string;
  tableSize?: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field?: "arrivalTime" | "createdAt" | "guestName" | "status";
  direction?: "ASC" | "DESC";
}

export class ReservationService {
  async getReservations(
    filters?: ReservationFilters,
    pagination?: PaginationOptions,
    sort?: SortOptions
  ): Promise<GetReservationsResponse["getReservations"]> {
    const query = `
      query GetReservations(
        $filters: ReservationFilters
        $pagination: PaginationInput
        $sort: SortInput
      ) {
        getReservations(filters: $filters, pagination: $pagination, sort: $sort) {
          data {
            id
            guestName
            guestPhone
            guestEmail
            arrivalTime
            tableSize
            status
            notes
            createdAt
            updatedAt
          }
          pagination {
            total
            limit
            offset
            hasMore
          }
        }
      }
    `;

    const variables: any = {};

    if (filters) {
      variables.filters = {
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      };
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    if (sort) {
      variables.sort = sort;
    }

    const response = await graphqlClient.query<GetReservationsResponse>(
      query,
      variables
    );

    return response.getReservations;
  }

  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const mutation = `
      mutation CreateReservation($input: CreateReservationInput!) {
        createReservation(input: $input) {
          id
          guestName
          guestPhone
          guestEmail
          arrivalTime
          tableSize
          status
          notes
          createdAt
          updatedAt
        }
      }
    `;

    const response = await graphqlClient.mutate<CreateReservationResponse>(
      mutation,
      { input }
    );

    return response.createReservation;
  }

  async getReservation(id: string): Promise<Reservation> {
    const query = `
      query GetReservation($id: ID!) {
        getReservation(id: $id) {
          id
          guestName
          guestPhone
          guestEmail
          arrivalTime
          tableSize
          status
          notes
          createdAt
          updatedAt
        }
      }
    `;

    const response = await graphqlClient.query<GetReservationResponse>(query, {
      id,
    });

    return response.getReservation;
  }

  async updateReservation(
    id: string,
    input: Partial<CreateReservationInput>
  ): Promise<Reservation> {
    const mutation = `
      mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
        updateReservation(id: $id, input: $input) {
          id
          guestName
          guestPhone
          guestEmail
          arrivalTime
          tableSize
          status
          notes
          createdAt
          updatedAt
        }
      }
    `;

    const response = await graphqlClient.mutate<{
      updateReservation: Reservation;
    }>(mutation, { id, input });

    return response.updateReservation;
  }

  async cancelReservation(id: string): Promise<Reservation> {
    const mutation = `
      mutation CancelReservation($id: ID!) {
        cancelReservation(id: $id) {
          id
          guestName
          guestPhone
          guestEmail
          arrivalTime
          tableSize
          status
          notes
          createdAt
          updatedAt
        }
      }
    `;

    const response = await graphqlClient.mutate<{
      cancelReservation: Reservation;
    }>(mutation, { id });

    return response.cancelReservation;
  }

  async updateReservationStatus(
    id: string,
    status: ReservationStatus
  ): Promise<Reservation> {
    const mutation = `
      mutation UpdateReservationStatus($id: ID!, $status: ReservationStatus!) {
        updateReservationStatus(id: $id, status: $status) {
          id
          guestName
          guestPhone
          guestEmail
          arrivalTime
          tableSize
          status
          notes
          createdAt
          updatedAt
        }
      }
    `;

    const response = await graphqlClient.mutate<{
      updateReservationStatus: Reservation;
    }>(mutation, { id, status });

    return response.updateReservationStatus;
  }
}

export const reservationService = new ReservationService();
