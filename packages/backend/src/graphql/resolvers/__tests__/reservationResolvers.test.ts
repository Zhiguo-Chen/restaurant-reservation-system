import {
  reservationResolvers,
  setReservationService,
} from "../reservationResolvers";
import { ReservationService } from "../../../interfaces/services";
import {
  Reservation,
  ReservationStatus,
  ReservationFilter,
  PaginationInput,
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

describe("Reservation Query Resolvers", () => {
  let mockReservationService: jest.Mocked<ReservationService>;
  let mockContext: GraphQLContext;

  const mockReservation: Reservation = {
    id: "test-id-1",
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

  const mockEmployee = {
    id: "employee-1",
    username: "employee",
    role: UserRole.EMPLOYEE,
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

  describe("reservations query", () => {
    it("should return paginated reservations for authenticated employees", async () => {
      // Arrange
      const filter: ReservationFilter = {
        status: ReservationStatus.REQUESTED,
        startDate: new Date("2024-01-15T00:00:00Z"),
      };
      const pagination: PaginationInput = { limit: 10, offset: 0 };

      const mockPaginationResult = {
        reservations: [mockReservation],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservationsWithPagination.mockResolvedValue(
        mockPaginationResult
      );

      // Act
      const result = await reservationResolvers.Query.reservations(
        null,
        { filter, pagination },
        mockContext
      );

      // Assert
      expect(result).toEqual({
        data: [mockReservation],
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      });

      expect(
        mockReservationService.getReservationsWithPagination
      ).toHaveBeenCalledWith(
        filter,
        1, // page number
        10 // limit
      );
    });

    it("should return guest reservations when email filter is provided for unauthenticated users", async () => {
      // Arrange
      const filter: ReservationFilter = {
        guestEmail: "john@example.com",
      };
      const pagination: PaginationInput = { limit: 20, offset: 0 };

      (getCurrentUser as jest.Mock).mockReturnValue(null);
      mockReservationService.getReservationsByEmail.mockResolvedValue([
        mockReservation,
      ]);

      // Act
      const result = await reservationResolvers.Query.reservations(
        null,
        { filter, pagination },
        mockContext
      );

      // Assert
      expect(result).toEqual({
        data: [mockReservation],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });

      expect(
        mockReservationService.getReservationsByEmail
      ).toHaveBeenCalledWith("john@example.com");
    });

    it("should throw error for unauthenticated users without email filter", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(null);

      // Act & Assert
      await expect(
        reservationResolvers.Query.reservations(
          null,
          { filter: {} },
          mockContext
        )
      ).rejects.toThrow("Guest email is required for unauthenticated requests");
    });

    it("should use default pagination values when not provided", async () => {
      // Arrange
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservationsWithPagination.mockResolvedValue({
        reservations: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      // Act
      await reservationResolvers.Query.reservations(
        null,
        { filter: {} },
        mockContext
      );

      // Assert
      expect(
        mockReservationService.getReservationsWithPagination
      ).toHaveBeenCalledWith(
        {},
        1, // default page
        20 // default limit
      );
    });

    it("should handle pagination with offset correctly", async () => {
      // Arrange
      const pagination: PaginationInput = { limit: 5, offset: 10 };
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservationsWithPagination.mockResolvedValue({
        reservations: [],
        total: 15,
        page: 3,
        totalPages: 3,
      });

      // Act
      const result = await reservationResolvers.Query.reservations(
        null,
        { filter: {}, pagination },
        mockContext
      );

      // Assert
      expect(
        mockReservationService.getReservationsWithPagination
      ).toHaveBeenCalledWith(
        {},
        3, // page number (offset 10 / limit 5 + 1)
        5
      );

      expect(result.pagination).toEqual({
        total: 15,
        limit: 5,
        offset: 10,
        hasMore: false, // 10 + 5 = 15, so no more items
      });
    });
  });

  describe("reservation query", () => {
    it("should return reservation by ID for authenticated users", async () => {
      // Arrange
      const reservationId = "test-id-1";
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(mockReservation);

      // Act
      const result = await reservationResolvers.Query.reservation(
        null,
        { id: reservationId },
        mockContext
      );

      // Assert
      expect(result).toEqual(mockReservation);
      expect(mockReservationService.getReservation).toHaveBeenCalledWith(
        reservationId
      );
    });

    it("should return null when reservation is not found", async () => {
      // Arrange
      const reservationId = "non-existent-id";
      (getCurrentUser as jest.Mock).mockReturnValue(mockEmployee);
      mockReservationService.getReservation.mockResolvedValue(null);

      // Act
      const result = await reservationResolvers.Query.reservation(
        null,
        { id: reservationId },
        mockContext
      );

      // Assert
      expect(result).toBeNull();
      expect(mockReservationService.getReservation).toHaveBeenCalledWith(
        reservationId
      );
    });

    it("should throw error for unauthenticated users", async () => {
      // Arrange
      const reservationId = "test-id-1";
      (getCurrentUser as jest.Mock).mockReturnValue(null);
      mockReservationService.getReservation.mockResolvedValue(mockReservation);

      // Act & Assert
      await expect(
        reservationResolvers.Query.reservation(
          null,
          { id: reservationId },
          mockContext
        )
      ).rejects.toThrow("Authentication required to view reservation details");
    });
  });

  describe("reservationsByEmail query", () => {
    it("should return reservations by email", async () => {
      // Arrange
      const email = "john@example.com";
      mockReservationService.getReservationsByEmail.mockResolvedValue([
        mockReservation,
      ]);

      // Act
      const result = await reservationResolvers.Query.reservationsByEmail(
        null,
        { email },
        mockContext
      );

      // Assert
      expect(result).toEqual([mockReservation]);
      expect(
        mockReservationService.getReservationsByEmail
      ).toHaveBeenCalledWith(email);
    });

    it("should return empty array when no reservations found", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      mockReservationService.getReservationsByEmail.mockResolvedValue([]);

      // Act
      const result = await reservationResolvers.Query.reservationsByEmail(
        null,
        { email },
        mockContext
      );

      // Assert
      expect(result).toEqual([]);
      expect(
        mockReservationService.getReservationsByEmail
      ).toHaveBeenCalledWith(email);
    });
  });
});
