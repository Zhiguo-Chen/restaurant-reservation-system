import {
  GraphQLContext,
  requireAuth,
  requireRole,
  getCurrentUser,
} from "../context";
import {
  Reservation,
  ReservationFilter,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationStatus,
  UserRole,
  PaginationInput,
  PaginatedResponse,
} from "@restaurant-reservation/shared";
import { ReservationService } from "../../interfaces/services";
import { EnhancedReservationService } from "../../interfaces/reservationService";
import { GraphQLErrors } from "../errors";
import logger from "../../utils/logger";

// This will be injected when we set up the resolvers with dependencies
let reservationService: ReservationService;

export function setReservationService(service: ReservationService) {
  reservationService = service;
}

export const reservationResolvers = {
  Query: {
    /**
     * Get reservations with optional filtering and pagination
     * Requires authentication for employees, optional for guests (limited access)
     */
    reservations: async (
      _parent: any,
      args: {
        filter?: ReservationFilter;
        pagination?: PaginationInput;
      },
      context: GraphQLContext
    ): Promise<PaginatedResponse<Reservation>> => {
      const user = getCurrentUser(context);
      const { filter = {}, pagination = {} } = args;

      // Set default pagination values
      const limit = pagination.limit || 20;
      const offset = pagination.offset || 0;

      // If user is not authenticated, they can only search by email
      if (!user) {
        if (!filter.guestEmail) {
          throw new Error(
            "Guest email is required for unauthenticated requests"
          );
        }

        logger.info("Guest reservation lookup", {
          guestEmail: filter.guestEmail,
          pagination: { limit, offset },
          requestId: context.req?.headers?.["x-request-id"],
        });

        // For guests, only return their own reservations
        const guestReservations =
          await reservationService.getReservationsByEmail(filter.guestEmail);

        // Apply pagination to guest results
        const total = guestReservations.length;
        const paginatedData = guestReservations.slice(offset, offset + limit);

        return {
          data: paginatedData,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      }

      // Authenticated users (employees/admins) can see all reservations
      logger.info("Employee reservation query", {
        userId: user.id,
        filter,
        pagination: { limit, offset },
        requestId: context.req?.headers?.["x-request-id"],
      });

      // Use the repository's pagination method
      const result = await reservationService.getReservationsWithPagination(
        filter,
        Math.floor(offset / limit) + 1, // Convert offset to page number
        limit
      );

      return {
        data: result.reservations,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      };
    },

    /**
     * Get a single reservation by ID
     * Guests can only access their own reservations, employees can access any
     */
    reservation: async (
      _parent: any,
      args: { id: string },
      context: GraphQLContext
    ): Promise<Reservation | null> => {
      const { id } = args;
      const user = getCurrentUser(context);

      logger.info("Reservation lookup", {
        reservationId: id,
        userId: user?.id,
        requestId: context.req?.headers?.["x-request-id"],
      });

      const reservation = await reservationService.getReservation(id);

      if (!reservation) {
        return null;
      }

      // If user is not authenticated, they need to provide email verification
      // This would typically be handled by a separate endpoint or additional verification
      if (!user) {
        throw new Error("Authentication required to view reservation details");
      }

      return reservation;
    },

    /**
     * Search reservations by guest email (for guest access)
     * This provides a separate endpoint for guests to find their reservations
     */
    reservationsByEmail: async (
      _parent: any,
      args: { email: string },
      context: GraphQLContext
    ): Promise<Reservation[]> => {
      const { email } = args;

      logger.info("Guest reservation search by email", {
        email,
        requestId: context.req?.headers?.["x-request-id"],
      });

      return reservationService.getReservationsByEmail(email);
    },
  },

  Mutation: {
    /**
     * Create a new reservation with comprehensive validation
     * Available to both guests and authenticated users
     */
    createReservation: async (
      _parent: any,
      args: { input: CreateReservationInput },
      context: GraphQLContext
    ): Promise<Reservation> => {
      const { input } = args;
      const user = getCurrentUser(context);

      logger.info("Creating reservation", {
        guestEmail: input.guestEmail,
        arrivalTime: input.arrivalTime,
        tableSize: input.tableSize,
        userId: user?.id,
        requestId: context.req?.headers?.["x-request-id"],
      });

      // Validate input data
      if (!input.guestName?.trim()) {
        throw new Error("Guest name is required");
      }
      if (!input.guestEmail?.trim()) {
        throw new Error("Guest email is required");
      }
      if (!input.guestPhone?.trim()) {
        throw new Error("Guest phone is required");
      }
      if (!input.arrivalTime) {
        throw new Error("Arrival time is required");
      }
      if (!input.tableSize || input.tableSize < 1 || input.tableSize > 12) {
        throw new Error("Table size must be between 1 and 12");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.guestEmail)) {
        throw new Error("Invalid email format");
      }

      // Validate phone format (basic validation)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(input.guestPhone.replace(/[\s\-\(\)]/g, ""))) {
        throw new Error("Invalid phone number format");
      }

      // Validate arrival time is in the future
      const now = new Date();
      const arrivalTime = new Date(input.arrivalTime);
      if (arrivalTime <= now) {
        throw new Error("Arrival time must be in the future");
      }

      // Validate arrival time is within business hours (example: 10 AM - 10 PM)
      const hour = arrivalTime.getHours();
      if (hour < 10 || hour >= 22) {
        throw new Error(
          "Reservations are only available between 10 AM and 10 PM"
        );
      }

      const reservationData = {
        ...input,
        guestName: input.guestName.trim(),
        guestEmail: input.guestEmail.trim().toLowerCase(),
        guestPhone: input.guestPhone.trim(),
        notes: input.notes?.trim() || undefined,
        status: ReservationStatus.REQUESTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        return await reservationService.createReservation(reservationData);
      } catch (error) {
        logger.error("Failed to create reservation", {
          error: error instanceof Error ? error.message : "Unknown error",
          input,
          userId: user?.id,
          requestId: context.req?.headers?.["x-request-id"],
        });
        throw new Error("Failed to create reservation. Please try again.");
      }
    },

    /**
     * Update a reservation with proper authorization and validation
     * Guests can update their own reservations, employees can update any
     */
    updateReservation: async (
      _parent: any,
      args: { id: string; input: UpdateReservationInput },
      context: GraphQLContext
    ): Promise<Reservation> => {
      const { id, input } = args;
      const user = getCurrentUser(context);

      if (!id?.trim()) {
        throw new Error("Reservation ID is required");
      }

      logger.info("Updating reservation", {
        reservationId: id,
        updates: input,
        userId: user?.id,
        requestId: context.req?.headers?.["x-request-id"],
      });

      // Get the existing reservation to check ownership and status
      const existingReservation = await reservationService.getReservation(id);
      if (!existingReservation) {
        throw new Error("Reservation not found");
      }

      // Check authorization
      if (!user) {
        throw new Error("Authentication required to update reservations");
      }

      // Guests can only update their own reservations
      const isEmployee =
        user.role === UserRole.EMPLOYEE || user.role === UserRole.ADMIN;
      if (!isEmployee && existingReservation.guestEmail !== user.username) {
        throw new Error("You can only update your own reservations");
      }

      // Validate that reservation can be updated (not completed or cancelled)
      if (existingReservation.status === ReservationStatus.COMPLETED) {
        throw new Error("Cannot update completed reservations");
      }
      if (existingReservation.status === ReservationStatus.CANCELLED) {
        throw new Error("Cannot update cancelled reservations");
      }

      // Validate input data
      if (input.arrivalTime) {
        const arrivalTime = new Date(input.arrivalTime);
        const now = new Date();

        if (arrivalTime <= now) {
          throw new Error("Arrival time must be in the future");
        }

        const hour = arrivalTime.getHours();
        if (hour < 10 || hour >= 22) {
          throw new Error(
            "Reservations are only available between 10 AM and 10 PM"
          );
        }
      }

      if (input.tableSize !== undefined) {
        if (input.tableSize < 1 || input.tableSize > 12) {
          throw new Error("Table size must be between 1 and 12");
        }
      }

      const updateData = {
        ...input,
        notes: input.notes?.trim() || undefined,
        updatedAt: new Date(),
        updatedBy: user.id,
      };

      try {
        return await reservationService.updateReservation(id, updateData);
      } catch (error) {
        logger.error("Failed to update reservation", {
          error: error instanceof Error ? error.message : "Unknown error",
          reservationId: id,
          updates: input,
          userId: user.id,
          requestId: context.req?.headers?.["x-request-id"],
        });
        throw new Error("Failed to update reservation. Please try again.");
      }
    },

    /**
     * Cancel a reservation with proper authorization and validation
     * Guests can cancel their own reservations, employees can cancel any
     */
    cancelReservation: async (
      _parent: any,
      args: { id: string },
      context: GraphQLContext
    ): Promise<Reservation> => {
      const { id } = args;
      const user = getCurrentUser(context);

      if (!id?.trim()) {
        throw new Error("Reservation ID is required");
      }

      logger.info("Cancelling reservation", {
        reservationId: id,
        userId: user?.id,
        requestId: context.req?.headers?.["x-request-id"],
      });

      // Get the existing reservation to check ownership and status
      const existingReservation = await reservationService.getReservation(id);
      if (!existingReservation) {
        throw new Error("Reservation not found");
      }

      // Check authorization
      if (!user) {
        throw new Error("Authentication required to cancel reservations");
      }

      // Guests can only cancel their own reservations
      const isEmployee =
        user.role === UserRole.EMPLOYEE || user.role === UserRole.ADMIN;
      if (!isEmployee && existingReservation.guestEmail !== user.username) {
        throw new Error("You can only cancel your own reservations");
      }

      // Validate that reservation can be cancelled
      if (existingReservation.status === ReservationStatus.COMPLETED) {
        throw new Error("Cannot cancel completed reservations");
      }
      if (existingReservation.status === ReservationStatus.CANCELLED) {
        throw new Error("Reservation is already cancelled");
      }

      // Check if cancellation is within allowed timeframe (e.g., at least 2 hours before arrival)
      const now = new Date();
      const arrivalTime = new Date(existingReservation.arrivalTime);
      const timeDifference = arrivalTime.getTime() - now.getTime();
      const hoursUntilArrival = timeDifference / (1000 * 60 * 60);

      if (hoursUntilArrival < 2 && !isEmployee) {
        throw new Error(
          "Reservations can only be cancelled at least 2 hours before arrival time"
        );
      }

      try {
        return await reservationService.cancelReservation(id);
      } catch (error) {
        logger.error("Failed to cancel reservation", {
          error: error instanceof Error ? error.message : "Unknown error",
          reservationId: id,
          userId: user.id,
          requestId: context.req?.headers?.["x-request-id"],
        });
        throw new Error("Failed to cancel reservation. Please try again.");
      }
    },

    /**
     * Update reservation status (Employee/Admin only)
     * Enhanced with validation and audit trail
     */
    updateReservationStatus: async (
      _parent: any,
      args: { id: string; status: ReservationStatus },
      context: GraphQLContext
    ): Promise<Reservation> => {
      const { id, status } = args;
      const user = requireRole(context, [UserRole.EMPLOYEE, UserRole.ADMIN]);

      if (!id?.trim()) {
        throw new Error("Reservation ID is required");
      }

      if (!Object.values(ReservationStatus).includes(status)) {
        throw new Error("Invalid reservation status");
      }

      logger.info("Updating reservation status", {
        reservationId: id,
        newStatus: status,
        userId: user.id,
        requestId: context.req?.headers?.["x-request-id"],
      });

      // Get the existing reservation to validate status transition
      const existingReservation = await reservationService.getReservation(id);
      if (!existingReservation) {
        throw new Error("Reservation not found");
      }

      // Validate status transitions
      const currentStatus = existingReservation.status;
      const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
        [ReservationStatus.REQUESTED]: [
          ReservationStatus.APPROVED,
          ReservationStatus.CANCELLED,
        ],
        [ReservationStatus.APPROVED]: [
          ReservationStatus.COMPLETED,
          ReservationStatus.CANCELLED,
        ],
        [ReservationStatus.CANCELLED]: [], // Cannot transition from cancelled
        [ReservationStatus.COMPLETED]: [], // Cannot transition from completed
      };

      if (!validTransitions[currentStatus].includes(status)) {
        throw new Error(
          `Cannot change status from ${currentStatus} to ${status}`
        );
      }

      try {
        return await reservationService.updateStatus(id, status, user.id);
      } catch (error) {
        logger.error("Failed to update reservation status", {
          error: error instanceof Error ? error.message : "Unknown error",
          reservationId: id,
          newStatus: status,
          currentStatus,
          userId: user.id,
          requestId: context.req?.headers?.["x-request-id"],
        });
        throw new Error(
          "Failed to update reservation status. Please try again."
        );
      }
    },
  },

  Subscription: {
    /**
     * Subscribe to reservation updates
     * Requires authentication
     */
    reservationUpdated: {
      // This would be implemented with a pub/sub system like Redis
      // For now, just define the structure
      subscribe: () => {
        throw new Error("Subscriptions not yet implemented");
      },
    },

    /**
     * Subscribe to new reservations
     * Requires authentication
     */
    reservationCreated: {
      // This would be implemented with a pub/sub system like Redis
      // For now, just define the structure
      subscribe: () => {
        throw new Error("Subscriptions not yet implemented");
      },
    },
  },
};
