import { gql } from "@apollo/client";

// 认证相关查询
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        role
      }
      expiresIn
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      message
      timestamp
    }
  }
`;

export const VALIDATE_TOKEN_QUERY = gql`
  query ValidateToken {
    validateToken {
      valid
      user {
        id
        username
        role
      }
      timestamp
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      role
    }
  }
`;

// 预订相关查询
export const GET_RESERVATIONS_QUERY = gql`
  query GetReservations(
    $filter: ReservationFilter
    $pagination: PaginationInput
  ) {
    reservations(filter: $filter, pagination: $pagination) {
      data {
        id
        guestName
        guestPhone
        guestEmail
        arrivalTime
        tableSize
        status
        createdAt
        updatedAt
        updatedBy
        notes
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

export const GET_RESERVATION_QUERY = gql`
  query GetReservation($id: ID!) {
    reservation(id: $id) {
      id
      guestName
      guestPhone
      guestEmail
      arrivalTime
      tableSize
      status
      createdAt
      updatedAt
      updatedBy
      notes
    }
  }
`;

export const GET_RESERVATIONS_BY_EMAIL_QUERY = gql`
  query GetReservationsByEmail($email: String!) {
    reservationsByEmail(email: $email) {
      id
      guestName
      guestPhone
      guestEmail
      arrivalTime
      tableSize
      status
      createdAt
      notes
    }
  }
`;

// 预订相关变更
export const CREATE_RESERVATION_MUTATION = gql`
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
      id
      guestName
      guestPhone
      guestEmail
      arrivalTime
      tableSize
      status
      createdAt
      notes
    }
  }
`;

export const UPDATE_RESERVATION_MUTATION = gql`
  mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
    updateReservation(id: $id, input: $input) {
      id
      guestName
      guestPhone
      guestEmail
      arrivalTime
      tableSize
      status
      updatedAt
      updatedBy
      notes
    }
  }
`;

export const CANCEL_RESERVATION_MUTATION = gql`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id) {
      id
      status
      updatedAt
      updatedBy
    }
  }
`;

export const UPDATE_RESERVATION_STATUS_MUTATION = gql`
  mutation UpdateReservationStatus($id: ID!, $status: ReservationStatus!) {
    updateReservationStatus(id: $id, status: $status) {
      id
      status
      updatedAt
      updatedBy
    }
  }
`;

// 订阅（为未来的实时功能预留）
export const RESERVATION_UPDATED_SUBSCRIPTION = gql`
  subscription ReservationUpdated {
    reservationUpdated {
      id
      guestName
      status
      updatedAt
      updatedBy
    }
  }
`;

export const RESERVATION_CREATED_SUBSCRIPTION = gql`
  subscription ReservationCreated {
    reservationCreated {
      id
      guestName
      guestEmail
      arrivalTime
      tableSize
      status
      createdAt
    }
  }
`;
