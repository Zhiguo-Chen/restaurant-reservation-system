import { ReservationStatus } from "./reservation";

/**
 * Business rule constants
 */
export const BUSINESS_RULES = {
  RESERVATION: {
    MIN_ADVANCE_HOURS: 1,
    MAX_ADVANCE_DAYS: 30,
    MODIFICATION_CUTOFF_HOURS: 2,
    CANCELLATION_CUTOFF_MINUTES: 30,
    LARGE_PARTY_THRESHOLD: 8,
  },
  RESTAURANT: {
    OPENING_HOUR: 11,
    CLOSING_HOUR: 22,
    CLOSED_DAYS: [1], // Monday = 1
    MAX_TABLE_SIZE: 20,
    MIN_TABLE_SIZE: 1,
  },
} as const;

/**
 * Status transition matrix
 */
export const STATUS_TRANSITIONS: Record<
  ReservationStatus,
  ReservationStatus[]
> = {
  [ReservationStatus.REQUESTED]: [
    ReservationStatus.APPROVED,
    ReservationStatus.CANCELLED,
  ],
  [ReservationStatus.APPROVED]: [
    ReservationStatus.CANCELLED,
    ReservationStatus.COMPLETED,
  ],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.COMPLETED]: [],
};

/**
 * Business validation error codes
 */
export enum BusinessErrorCode {
  MIN_ADVANCE_TIME = "MIN_ADVANCE_TIME",
  MAX_ADVANCE_TIME = "MAX_ADVANCE_TIME",
  OUTSIDE_BUSINESS_HOURS = "OUTSIDE_BUSINESS_HOURS",
  RESTAURANT_CLOSED = "RESTAURANT_CLOSED",
  MIN_TABLE_SIZE = "MIN_TABLE_SIZE",
  MAX_TABLE_SIZE = "MAX_TABLE_SIZE",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",
  RESERVATION_CANCELLED = "RESERVATION_CANCELLED",
  RESERVATION_COMPLETED = "RESERVATION_COMPLETED",
  TOO_CLOSE_TO_ARRIVAL = "TOO_CLOSE_TO_ARRIVAL",
  ALREADY_CANCELLED = "ALREADY_CANCELLED",
  POTENTIAL_CONFLICT = "POTENTIAL_CONFLICT",
}

/**
 * Large party warning result
 */
export interface LargePartyWarning {
  requiresApproval: boolean;
  message?: string;
}
