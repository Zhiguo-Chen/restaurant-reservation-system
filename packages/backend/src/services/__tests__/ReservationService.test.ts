import { ReservationService } from "../ReservationService";
import { ReservationRepository } from "../../interfaces/repositories";
import {
  Reservation,
  ReservationStatus,
  CreateReservationData,
  UpdateReservationData,
} from "@restaurant-reservation/shared";

// Mock the logger
jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("ReservationService", () => {
  let reservationService: ReservationService;
  let mockRepository: jest.Mocked<ReservationRepository>;

  const mockReservation: Reservation = {
    id: "RES_TEST_123",
    guestName: "John Doe",
    guestPhone: "+1234567890",
    guestEmail: "john@example.com",
    arrivalTime: new Date("2024-01-15T19:00:00Z"),
    tableSize: 4,
    status: ReservationStatus.REQUESTED,
    createdAt: new Date("2024-01-10T10:00:00Z"),
    updatedAt: new Date("2024-01-10T10:00:00Z"),
    notes: "Birthday dinner",
  };

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByDateRange: jest.fn(),
      findByStatus: jest.fn(),
      findByGuestEmail: jest.fn(),
      findByDateAndStatus: jest.fn(),
      findWithPagination: jest.fn(),
    } as any;

    reservationService = new ReservationService(mockRepository);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("createReservation", () => {
    const createData: CreateReservationData = {
      guestName: "John Doe",
      guestPhone: "+1234567890",
      guestEmail: "john@example.com",
      arrivalTime: new Date("2024-01-15T19:00:00Z"),
      tableSize: 4,
      status: ReservationStatus.REQUESTED,
      createdAt: new Date("2024-01-10T10:00:00Z"),
      updatedAt: new Date("2024-01-10T10:00:00Z"),
      notes: "Birthday dinner",
    };

    it("should create reservation successfully when no conflicts", async () => {
      // Arrange
      mockRepository.findByDateRange.mockResolvedValue([]); // No conflicts
      mockRepository.create.mockResolvedValue(mockReservation);

      // Act
      const result = await reservationService.createReservation(createData);

      // Assert
      expect(result).toEqual(mockReservation);
      expect(mockRepository.findByDateRange).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          id: expect.stringMatching(/^RES_[A-Z0-9_]+$/),
        })
      );
    });

    it("should throw error when time slot conflict exists", async () => {
      // Arrange - Create many reservations to exceed capacity
      const conflictingReservations = Array.from({ length: 15 }, (_, i) => ({
        ...mockReservation,
        id: `CONFLICT_${i}`,
        status: ReservationStatus.APPROVED,
        tableSize: 4,
      }));
      mockRepository.findByDateRange.mockResolvedValue(conflictingReservations);

      // Act & Assert
      await expect(
        reservationService.createReservation(createData)
      ).rejects.toThrow(
        "The requested time slot is not available. Please choose a different time."
      );

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange
      mockRepository.findByDateRange.mockResolvedValue([]);
      mockRepository.create.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(
        reservationService.createReservation(createData)
      ).rejects.toThrow("Failed to create reservation");
    });

    it("should ignore cancelled reservations in conflict detection", async () => {
      // Arrange
      const cancelledReservation = {
        ...mockReservation,
        id: "CANCELLED_123",
        status: ReservationStatus.CANCELLED,
      };
      mockRepository.findByDateRange.mockResolvedValue([cancelledReservation]);
      mockRepository.create.mockResolvedValue(mockReservation);

      // Act
      const result = await reservationService.createReservation(createData);

      // Assert
      expect(result).toEqual(mockReservation);
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe("updateReservation", () => {
    const updateData: UpdateReservationData = {
      arrivalTime: new Date("2024-01-16T20:00:00Z"),
      tableSize: 6,
      notes: "Updated notes",
      updatedAt: new Date(),
      updatedBy: "user-123",
    };

    it("should update reservation successfully when no conflicts", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockReservation);
      mockRepository.findByDateRange.mockResolvedValue([]); // No conflicts
      const updatedReservation = { ...mockReservation, ...updateData };
      mockRepository.update.mockResolvedValue(updatedReservation);

      // Act
      const result = await reservationService.updateReservation(
        "RES_TEST_123",
        updateData
      );

      // Assert
      expect(result).toEqual(updatedReservation);
      expect(mockRepository.findById).toHaveBeenCalledWith("RES_TEST_123");
      expect(mockRepository.update).toHaveBeenCalledWith(
        "RES_TEST_123",
        updateData
      );
    });

    it("should throw error when reservation not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reservationService.updateReservation("NON_EXISTENT", updateData)
      ).rejects.toThrow("Reservation not found");

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should check for conflicts when updating arrival time", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockReservation);
      // Create many reservations to exceed capacity
      const conflictingReservations = Array.from({ length: 15 }, (_, i) => ({
        ...mockReservation,
        id: `CONFLICT_${i}`,
        status: ReservationStatus.APPROVED,
        tableSize: 4,
      }));
      mockRepository.findByDateRange.mockResolvedValue(conflictingReservations);

      // Act & Assert
      await expect(
        reservationService.updateReservation("RES_TEST_123", updateData)
      ).rejects.toThrow(
        "The requested time slot is not available. Please choose a different time."
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should exclude current reservation from conflict check", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockReservation);
      // Return the same reservation as a "conflict" - should be ignored
      mockRepository.findByDateRange.mockResolvedValue([mockReservation]);
      const updatedReservation = { ...mockReservation, ...updateData };
      mockRepository.update.mockResolvedValue(updatedReservation);

      // Act
      const result = await reservationService.updateReservation(
        "RES_TEST_123",
        updateData
      );

      // Assert
      expect(result).toEqual(updatedReservation);
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe("cancelReservation", () => {
    it("should cancel reservation successfully", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockReservation);
      const cancelledReservation = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      };
      mockRepository.update.mockResolvedValue(cancelledReservation);

      // Act
      const result = await reservationService.cancelReservation("RES_TEST_123");

      // Assert
      expect(result).toEqual(cancelledReservation);
      expect(mockRepository.findById).toHaveBeenCalledWith("RES_TEST_123");
    });

    it("should throw error when reservation not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reservationService.cancelReservation("NON_EXISTENT")
      ).rejects.toThrow("Reservation not found");
    });

    it("should throw error when reservation is already cancelled", async () => {
      // Arrange
      const cancelledReservation = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      };
      mockRepository.findById.mockResolvedValue(cancelledReservation);

      // Act & Assert
      await expect(
        reservationService.cancelReservation("RES_TEST_123")
      ).rejects.toThrow("Reservation is already cancelled");
    });

    it("should throw error when reservation is completed", async () => {
      // Arrange
      const completedReservation = {
        ...mockReservation,
        status: ReservationStatus.COMPLETED,
      };
      mockRepository.findById.mockResolvedValue(completedReservation);

      // Act & Assert
      await expect(
        reservationService.cancelReservation("RES_TEST_123")
      ).rejects.toThrow("Cannot cancel completed reservation");
    });
  });

  describe("updateStatus", () => {
    it("should update status with valid transition", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockReservation);
      const approvedReservation = {
        ...mockReservation,
        status: ReservationStatus.APPROVED,
      };
      mockRepository.update.mockResolvedValue(approvedReservation);

      // Act
      const result = await reservationService.updateStatus(
        "RES_TEST_123",
        ReservationStatus.APPROVED,
        "employee-123"
      );

      // Assert
      expect(result.status).toBe(ReservationStatus.APPROVED);
      expect(mockRepository.findById).toHaveBeenCalledWith("RES_TEST_123");
    });

    it("should throw error for invalid status transition", async () => {
      // Arrange
      const completedReservation = {
        ...mockReservation,
        status: ReservationStatus.COMPLETED,
      };
      mockRepository.findById.mockResolvedValue(completedReservation);

      // Act & Assert
      await expect(
        reservationService.updateStatus(
          "RES_TEST_123",
          ReservationStatus.REQUESTED,
          "employee-123"
        )
      ).rejects.toThrow(
        "Invalid status transition from COMPLETED to REQUESTED"
      );
    });

    it("should throw error when reservation not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        reservationService.updateStatus(
          "NON_EXISTENT",
          ReservationStatus.APPROVED,
          "employee-123"
        )
      ).rejects.toThrow("Reservation not found");
    });
  });

  describe("getReservation", () => {
    it("should return reservation when found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockReservation);

      // Act
      const result = await reservationService.getReservation("RES_TEST_123");

      // Assert
      expect(result).toEqual(mockReservation);
      expect(mockRepository.findById).toHaveBeenCalledWith("RES_TEST_123");
    });

    it("should return null when reservation not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await reservationService.getReservation("NON_EXISTENT");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle repository errors", async () => {
      // Arrange
      mockRepository.findById.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(
        reservationService.getReservation("RES_TEST_123")
      ).rejects.toThrow("Failed to retrieve reservation");
    });
  });

  describe("getReservationsByDateAndStatus", () => {
    it("should return reservations for date and status", async () => {
      // Arrange
      const date = new Date("2024-01-15");
      const reservations = [mockReservation];
      mockRepository.findByDateAndStatus.mockResolvedValue(reservations);

      // Act
      const result = await reservationService.getReservationsByDateAndStatus(
        date,
        ReservationStatus.REQUESTED
      );

      // Assert
      expect(result).toEqual(reservations);
      expect(mockRepository.findByDateAndStatus).toHaveBeenCalledWith(
        date,
        ReservationStatus.REQUESTED
      );
    });

    it("should handle repository errors", async () => {
      // Arrange
      const date = new Date("2024-01-15");
      mockRepository.findByDateAndStatus.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(
        reservationService.getReservationsByDateAndStatus(date)
      ).rejects.toThrow("Failed to retrieve reservations");
    });
  });

  describe("getReservationsByEmail", () => {
    it("should return reservations for email", async () => {
      // Arrange
      const email = "john@example.com";
      const reservations = [mockReservation];
      mockRepository.findByGuestEmail.mockResolvedValue(reservations);

      // Act
      const result = await reservationService.getReservationsByEmail(email);

      // Assert
      expect(result).toEqual(reservations);
      expect(mockRepository.findByGuestEmail).toHaveBeenCalledWith(email);
    });

    it("should handle repository errors", async () => {
      // Arrange
      const email = "john@example.com";
      mockRepository.findByGuestEmail.mockRejectedValue(
        new Error("Database error")
      );

      // Act & Assert
      await expect(
        reservationService.getReservationsByEmail(email)
      ).rejects.toThrow("Failed to retrieve reservations");
    });
  });

  describe("getReservationsWithPagination", () => {
    it("should return paginated reservations", async () => {
      // Arrange
      const filter = { status: ReservationStatus.REQUESTED };
      const paginationResult = {
        reservations: [mockReservation],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      (mockRepository as any).findWithPagination = jest
        .fn()
        .mockResolvedValue(paginationResult);

      // Act
      const result = await reservationService.getReservationsWithPagination(
        filter,
        1,
        20
      );

      // Assert
      expect(result).toEqual(paginationResult);
      expect((mockRepository as any).findWithPagination).toHaveBeenCalledWith(
        {
          startDate: undefined,
          endDate: undefined,
          status: ReservationStatus.REQUESTED,
          guestName: undefined,
          guestEmail: undefined,
        },
        1,
        20
      );
    });

    it("should handle repository errors", async () => {
      // Arrange
      const filter = { status: ReservationStatus.REQUESTED };
      (mockRepository as any).findWithPagination = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(
        reservationService.getReservationsWithPagination(filter, 1, 20)
      ).rejects.toThrow("Failed to retrieve reservations");
    });
  });

  describe("conflict detection", () => {
    it("should detect capacity conflicts", async () => {
      // Arrange
      const createData: CreateReservationData = {
        guestName: "John Doe",
        guestPhone: "+1234567890",
        guestEmail: "john@example.com",
        arrivalTime: new Date("2024-01-15T19:00:00Z"),
        tableSize: 8, // Large table
        status: ReservationStatus.REQUESTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create many existing reservations to exceed capacity
      const existingReservations = Array.from({ length: 15 }, (_, i) => ({
        ...mockReservation,
        id: `RES_${i}`,
        tableSize: 4,
        status: ReservationStatus.APPROVED,
      }));

      mockRepository.findByDateRange.mockResolvedValue(existingReservations);

      // Act & Assert
      await expect(
        reservationService.createReservation(createData)
      ).rejects.toThrow(
        "The requested time slot is not available. Please choose a different time."
      );
    });
  });

  describe("status transition validation", () => {
    const testCases = [
      {
        from: ReservationStatus.REQUESTED,
        to: ReservationStatus.APPROVED,
        valid: true,
      },
      {
        from: ReservationStatus.REQUESTED,
        to: ReservationStatus.CANCELLED,
        valid: true,
      },
      {
        from: ReservationStatus.APPROVED,
        to: ReservationStatus.COMPLETED,
        valid: true,
      },
      {
        from: ReservationStatus.APPROVED,
        to: ReservationStatus.CANCELLED,
        valid: true,
      },
      {
        from: ReservationStatus.CANCELLED,
        to: ReservationStatus.APPROVED,
        valid: false,
      },
      {
        from: ReservationStatus.COMPLETED,
        to: ReservationStatus.REQUESTED,
        valid: false,
      },
    ];

    testCases.forEach(({ from, to, valid }) => {
      it(`should ${
        valid ? "allow" : "reject"
      } transition from ${from} to ${to}`, async () => {
        // Arrange
        const reservation = { ...mockReservation, status: from };
        mockRepository.findById.mockResolvedValue(reservation);

        if (valid) {
          const updatedReservation = { ...reservation, status: to };
          mockRepository.update.mockResolvedValue(updatedReservation);
        }

        // Act & Assert
        if (valid) {
          await expect(
            reservationService.updateStatus("RES_TEST_123", to, "employee-123")
          ).resolves.toBeDefined();
        } else {
          await expect(
            reservationService.updateStatus("RES_TEST_123", to, "employee-123")
          ).rejects.toThrow(`Invalid status transition from ${from} to ${to}`);
        }
      });
    });
  });
});
