import { UserRole, ReservationStatus } from "../../types/shared";

/**
 * Enum resolvers for GraphQL
 * Maps between GraphQL enum values and TypeScript enum values
 */
export const enumResolvers = {
  UserRole: {
    GUEST: UserRole.GUEST,
    EMPLOYEE: UserRole.EMPLOYEE,
    MANAGER: UserRole.MANAGER,
    ADMIN: UserRole.ADMIN,
  },

  ReservationStatus: {
    REQUESTED: ReservationStatus.REQUESTED,
    CONFIRMED: ReservationStatus.CONFIRMED,
    APPROVED: ReservationStatus.APPROVED,
    SEATED: ReservationStatus.SEATED,
    COMPLETED: ReservationStatus.COMPLETED,
    CANCELLED: ReservationStatus.CANCELLED,
    NO_SHOW: ReservationStatus.NO_SHOW,
  },
};
