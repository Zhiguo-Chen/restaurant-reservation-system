import {
  reservationResolvers,
  setReservationService,
} from "../reservationResolvers";
import { ReservationService } from "../../../interfaces/services";
import {
  Reservation,
  ReservationStatus,
  CreateReservationInput,
  UpdateReservationInput,
  UserRole,
} from "@restaurant-reservation/shared";
import { GraphQLContext } from "../../context";

// Mock the logger
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the context functions
jest.mock("../../context", () => ({
  getCurrentUser: jest.fn(),
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
}));

import { getCurrentUser, requireAuth, requireRole } from "../../context";

describe("Reservation Mutation Resolvers", () => {
  let mockReservationService: jest.Mocked<ReservationService>;
  let mockContext: GraphQLContext;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
  futureDate.setHours(19, 0, 0, 0); // 7 PM

  const mockReservation: Reservation = {
    id: "test-id-1",
    guestName: "John Doe",
    guestPhone: "+1234567890",
    guestEmail: "john@example.com",
    arrivalTime: futureDate,
    tableSize: 4,
    status: ReservationStatus.REQUESTED,
    createdAt: new Date("2024-01-10T10:00:00Z"),
    updatedAt: new Date("2024-01-10T10:00:00Z"),
    notes: "Birthday dinner",
  };

  const mockEmployee = {
    id: "employee-1",
    username: "employee@restaurant.com",
    role: UserRole.EMPLOYEE,
  };

  const mockGuest = {
    id: "guest-1",
    username: "john@example.com",
    role: "GUEST" as any, // Guests don't have employee/admin roles
  };

  beforeEach(() => {
    // Create mock service
    mockReservationService = {
      createReservation: jest.fn(),
      updateReservation: jest.fn(),
      cancelReservation: jest.fn(),
      getReservationsByDateAndStatus: jest.fn(),
      updateStatus: jest.fn(),
      getReservation: jest.fn(),
      getReservationsByEmail: jest.fn(),
      getReservationsWithPagination: jest.fn(),
    };

    // Set up the service
    setReservationService(mockReservationService);

    // Create mock context
    mockContext = {
      req: {
        headers: {
          "x-request-id": "test-request-id",
        },
      },
      user: null,
    } as any;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("createReservation mutation", () => {
    const validFutureDate = new Date();
    validFutureDate.setDate(validFutureDate.getDate() + 1);
    validFutureDate.setHours(19, 0, 0, 0); // 7 PM tomorrow

    const validInput: CreateReservationInput = {
      guestName: "John Doe",
      guestPhone: "+1234567890",
      guestEmail: "john@example.com",
      arrivalTime: validFutureDate,
      tableSize: 4,
      notes: "Birthday dinner",
    };

    it("should create reservation with valid input", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(null);
      mockReservationService.createReservation.mockResolvedValue(
        mockReservation
      );

      // Act
      const result = await reservationResolvers.Mutation.createReservation(
        null,
        { input: validInput },
        mockContext
      );

      // Assert
      expect(result).toEqual(mockReservation);
      expect(mockReservationService.createReservation).toHaveBeenCalledWith({
        ...validInput,
        guestName: "John Doe",
        guestEmail: "john@example.com",
        guestPhone: "+1234567890",
        notes: "Birthday dinner",
        status: ReservationStatus.REQUESTED,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should throw error for missing guest name", async () => {
      // Arrange
      const invalidInput = { ...validInput, guestName: "" };

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.createReservation(
          null,
          { input: invalidInput },
          mockContext
        )
      ).rejects.toThrow("Guest name is required");
    });

    it("should throw error for invalid email format", async () => {
      // Arrange
      const invalidInput = { ...validInput, guestEmail: "invalid-email" };

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.createReservation(
          null,
          { input: invalidInput },
          mockContext
        )
      ).rejects.toThrow("Invalid email format");
    });

    it("should throw error for invalid table size", async () => {
      // Arrange
      const invalidInput = { ...validInput, tableSize: 15 };

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.createReservation(
          null,
          { input: invalidInput },
          mockContext
        )
      ).rejects.toThrow("Table size must be between 1 and 12");
    });

    it("should throw error for past arrival time", async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        arrivalTime: new Date("2020-01-01T19:00:00Z"),
      };

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.createReservation(
          null,
          { input: invalidInput },
          mockContext
        )
      ).rejects.toThrow("Arrival time must be in the future");
    });

    it("should throw error for arrival time outside business hours", async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(8, 0, 0, 0); // 8 AM - before business hours

      const invalidInput = {
        ...validInput,
        arrivalTime: futureDate,
      };

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.createReservation(
          null,
          { input: invalidInput },
          mockContext
        )
      ).rejects.toThrow(
        "Reservations are only available between 10 AM and 10 PM"
      );
    });

    it("should handle service errors gracefully", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(null);
      mockReservationService.createReservation.mockRejectedValue(
        new Error("Database error")
      );

      // Use a valid input that passes validation
      const validServiceErrorInput = {
        ...validInput,
        arrivalTime: validFutureDate,
      };

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.createReservation(
          null,
          { input: validServiceErrorInput },
          mockContext
        )
      ).rejects.toThrow("Failed to create reservation. Please try again.");
    });
  });

  describe("updateReservation mutation", () => {
    const updateFutureDate = new Date();
    updateFutureDate.setDate(updateFutureDate.getDate() + 2);
    updateFutureDate.setHours(20, 0, 0, 0); // 8 PM in 2 days

    const updateInput: UpdateReservationInput = {
      arrivalTime: updateFutureDate,
      tableSize: 6,
      notes: "Updated notes",
    };

    it("should update reservation for authenticated employee", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(mockReservation);
      mockReservationService.updateReservation.mockResolvedValue({
        ...mockReservation,
        ...updateInput,
      });

      // Act
      const result = await reservationResolvers.Mutation.updateReservation(
        null,
        { id: "test-id-1", input: updateInput },
        mockContext
      );

      // Assert
      expect(result).toEqual({ ...mockReservation, ...updateInput });
      expect(mockReservationService.updateReservation).toHaveBeenCalledWith(
        "test-id-1",
        {
          ...updateInput,
          notes: "Updated notes",
          updatedAt: expect.any(Date),
          updatedBy: mockEmployee.id,
        }
      );
    });

    it("should update reservation for guest owner", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(mockGuest);
      mockReservationService.getReservation.mockResolvedValue(mockReservation);
      mockReservationService.updateReservation.mockResolvedValue({
        ...mockReservation,
        ...updateInput,
      });

      // Act
      const result = await reservationResolvers.Mutation.updateReservation(
        null,
        { id: "test-id-1", input: updateInput },
        mockContext
      );

      // Assert
      expect(result).toEqual({ ...mockReservation, ...updateInput });
    });

    it("should throw error for non-existent reservation", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.updateReservation(
          null,
          { id: "non-existent", input: updateInput },
          mockContext
        )
      ).rejects.toThrow("Reservation not found");
    });

    it("should throw error for unauthenticated user", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(null);
      mockReservationService.getReservation.mockResolvedValue(mockReservation);

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.updateReservation(
          null,
          { id: "test-id-1", input: updateInput },
          mockContext
        )
      ).rejects.toThrow("Authentication required to update reservations");
    });

    it("should throw error for guest trying to update another's reservation", async () => {
      // Arrange
      const otherGuest = { ...mockGuest, username: "other@example.com" };
      (getCurrentUser as jest.Mock).mockReturnValue(otherGuest);
      mockReservationService.getReservation.mockResolvedValue(mockReservation);

      // Use input without arrivalTime to avoid validation error
      const simpleUpdateInput = {
        tableSize: 6,
        notes: "Updated notes",
      };

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.updateReservation(
          null,
          { id: "test-id-1", input: simpleUpdateInput },
          mockContext
        )
      ).rejects.toThrow("You can only update your own reservations");
    });

    it("should throw error for updating completed reservation", async () => {
      // Arrange
      const completedReservation = {
        ...mockReservation,
        status: ReservationStatus.COMPLETED,
      };
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(
        completedReservation
      );

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.updateReservation(
          null,
          { id: "test-id-1", input: updateInput },
          mockContext
        )
      ).rejects.toThrow("Cannot update completed reservations");
    });
  });

  describe("cancelReservation mutation", () => {
    it("should cancel reservation for authenticated employee", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(mockReservation);
      const cancelledReservation = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      };
      mockReservationService.cancelReservation.mockResolvedValue(
        cancelledReservation
      );

      // Act
      const result = await reservationResolvers.Mutation.cancelReservation(
        null,
        { id: "test-id-1" },
        mockContext
      );

      // Assert
      expect(result).toEqual(cancelledReservation);
      expect(mockReservationService.cancelReservation).toHaveBeenCalledWith(
        "test-id-1"
      );
    });

    it("should cancel reservation for guest owner with sufficient time", async () => {
      // Arrange
      const futureReservation = {
        ...mockReservation,
        arrivalTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      };
      (getCurrentUser as jest.Mock).mockReturnValue(mockGuest);
      mockReservationService.getReservation.mockResolvedValue(
        futureReservation
      );
      const cancelledReservation = {
        ...futureReservation,
        status: ReservationStatus.CANCELLED,
      };
      mockReservationService.cancelReservation.mockResolvedValue(
        cancelledReservation
      );

      // Act
      const result = await reservationResolvers.Mutation.cancelReservation(
        null,
        { id: "test-id-1" },
        mockContext
      );

      // Assert
      expect(result).toEqual(cancelledReservation);
    });

    it("should throw error for guest cancelling too close to arrival time", async () => {
      // Arrange
      const soonReservation = {
        ...mockReservation,
        arrivalTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      };
      (getCurrentUser as jest.Mock).mockReturnValue(mockGuest);
      mockReservationService.getReservation.mockResolvedValue(soonReservation);

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.cancelReservation(
          null,
          { id: "test-id-1" },
          mockContext
        )
      ).rejects.toThrow(
        "Reservations can only be cancelled at least 2 hours before arrival time"
      );
    });

    it("should throw error for already cancelled reservation", async () => {
      // Arrange
      const cancelledReservation = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      };
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(
        cancelledReservation
      );

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.cancelReservation(
          null,
          { id: "test-id-1" },
          mockContext
        )
      ).rejects.toThrow("Reservation is already cancelled");
    });
  });

  describe("updateReservationStatus mutation", () => {
    it("should update status for employee with valid transition", async () => {
      // Arrange
      (requireRole as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(mockReservation);
      const approvedReservation = {
        ...mockReservation,
        status: ReservationStatus.APPROVED,
      };
      mockReservationService.updateStatus.mockResolvedValue(
        approvedReservation
      );

      // Act
      const result =
        await reservationResolvers.Mutation.updateReservationStatus(
          null,
          { id: "test-id-1", status: ReservationStatus.APPROVED },
          mockContext
        );

      // Assert
      expect(result).toEqual(approvedReservation);
      expect(mockReservationService.updateStatus).toHaveBeenCalledWith(
        "test-id-1",
        ReservationStatus.APPROVED,
        mockEmployee.id
      );
    });

    it("should throw error for invalid status transition", async () => {
      // Arrange
      const completedReservation = {
        ...mockReservation,
        status: ReservationStatus.COMPLETED,
      };
      (requireRole as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(
        completedReservation
      );

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.updateReservationStatus(
          null,
          { id: "test-id-1", status: ReservationStatus.REQUESTED },
          mockContext
        )
      ).rejects.toThrow("Cannot change status from COMPLETED to REQUESTED");
    });

    it("should throw error for non-existent reservation", async () => {
      // Arrange
      (requireRole as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.updateReservationStatus(
          null,
          { id: "non-existent", status: ReservationStatus.APPROVED },
          mockContext
        )
      ).rejects.toThrow("Reservation not found");
    });

    it("should throw error for invalid status", async () => {
      // Arrange
      (requireRole as jest.Mock).mockReturnValue(mockEmployee);

      // Act & Assert
      await expect(
        reservationResolvers.Mutation.updateReservationStatus(
          null,
          { id: "test-id-1", status: "INVALID_STATUS" as ReservationStatus },
          mockContext
        )
      ).rejects.toThrow("Invalid reservation status");
    });
  });
});
