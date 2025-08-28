// import { createSignal } from "solid-js"; // 暂时不需要
import { useQuery, useMutation, useLazyQuery } from "./useApollo";
import {
  GET_RESERVATIONS_QUERY,
  GET_RESERVATION_QUERY,
  GET_RESERVATIONS_BY_EMAIL_QUERY,
  CREATE_RESERVATION_MUTATION,
  UPDATE_RESERVATION_MUTATION,
  CANCEL_RESERVATION_MUTATION,
  UPDATE_RESERVATION_STATUS_MUTATION,
} from "../services/graphql/queries";
import {
  // Reservation, // 已在其他地方导入
  ReservationStatus,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationFilter,
  PaginationInput,
  GetReservationsQueryResult,
  GetReservationQueryResult,
  GetReservationsByEmailQueryResult,
  CreateReservationMutationResult,
  UpdateReservationMutationResult,
  CancelReservationMutationResult,
  UpdateReservationStatusMutationResult,
} from "../types/graphql";

export interface UseReservationsOptions {
  filter?: ReservationFilter;
  pagination?: PaginationInput;
}

export function useReservations(options?: UseReservationsOptions) {
  const { data, loading, error, refetch } =
    useQuery<GetReservationsQueryResult>(GET_RESERVATIONS_QUERY, {
      variables: {
        filter: options?.filter,
        pagination: options?.pagination || { limit: 20, offset: 0 },
      },
      fetchPolicy: "cache-first",
    });

  return {
    reservations: () => data()?.reservations?.data || [],
    pagination: () => data()?.reservations?.pagination,
    loading,
    error,
    refetch,
  };
}

export function useReservation(id: string) {
  const { data, loading, error, refetch } = useQuery<GetReservationQueryResult>(
    GET_RESERVATION_QUERY,
    {
      variables: { id },
      fetchPolicy: "cache-first",
    }
  );

  return {
    reservation: () => data()?.reservation,
    loading,
    error,
    refetch,
  };
}

export function useReservationsByEmail() {
  const { execute, data, loading, error } =
    useLazyQuery<GetReservationsByEmailQueryResult>(
      GET_RESERVATIONS_BY_EMAIL_QUERY
    );

  const getReservationsByEmail = async (email: string) => {
    return await execute({ variables: { email } });
  };

  return {
    getReservationsByEmail,
    reservations: () => data()?.reservationsByEmail || [],
    loading,
    error,
  };
}

export function useCreateReservation() {
  const { mutate, data, loading, error } =
    useMutation<CreateReservationMutationResult>(CREATE_RESERVATION_MUTATION);

  const createReservation = async (input: CreateReservationInput) => {
    return await mutate({
      variables: { input },
      refetchQueries: [{ query: GET_RESERVATIONS_QUERY }],
    });
  };

  return {
    createReservation,
    reservation: () => data()?.createReservation,
    loading,
    error,
  };
}

export function useUpdateReservation() {
  const { mutate, data, loading, error } =
    useMutation<UpdateReservationMutationResult>(UPDATE_RESERVATION_MUTATION);

  const updateReservation = async (
    id: string,
    input: UpdateReservationInput
  ) => {
    return await mutate({
      variables: { id, input },
      refetchQueries: [
        { query: GET_RESERVATIONS_QUERY },
        { query: GET_RESERVATION_QUERY, variables: { id } },
      ],
    });
  };

  return {
    updateReservation,
    reservation: () => data()?.updateReservation,
    loading,
    error,
  };
}

export function useCancelReservation() {
  const { mutate, data, loading, error } =
    useMutation<CancelReservationMutationResult>(CANCEL_RESERVATION_MUTATION);

  const cancelReservation = async (id: string) => {
    return await mutate({
      variables: { id },
      refetchQueries: [
        { query: GET_RESERVATIONS_QUERY },
        { query: GET_RESERVATION_QUERY, variables: { id } },
      ],
    });
  };

  return {
    cancelReservation,
    reservation: () => data()?.cancelReservation,
    loading,
    error,
  };
}

export function useUpdateReservationStatus() {
  const { mutate, data, loading, error } =
    useMutation<UpdateReservationStatusMutationResult>(
      UPDATE_RESERVATION_STATUS_MUTATION
    );

  const updateReservationStatus = async (
    id: string,
    status: ReservationStatus
  ) => {
    return await mutate({
      variables: { id, status },
      refetchQueries: [
        { query: GET_RESERVATIONS_QUERY },
        { query: GET_RESERVATION_QUERY, variables: { id } },
      ],
    });
  };

  return {
    updateReservationStatus,
    reservation: () => data()?.updateReservationStatus,
    loading,
    error,
  };
}
