import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationService } from "../reservationService";
import { graphqlClient } from "../graphqlClient";
import { ReservationStatus } from "@restaurant-reservation/shared";

// Mock the GraphQL client
vi.mock("../graphqlClient", () => ({
  graphqlClient: {
    mutate: vi.fn(),
    query: vi.fn(),
  },
}));

const mockGraphQLClient = graphqlClient as any;

describe("ReservationService", () => {
  let service: ReservationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReservationService();
  });

  describe("createReservation", () => {
    it("should create a reservation successfully", async () => {
      const mockInput = {
        guestName: "John Doe",
        guestPhone: "+1234567890",
        guestEmail: "john@example.com",
        arrivalTime: new Date("2024-12-25T19:00:00"),
        tableSize: 4,
        notes: "Birthday celebration",
      };

      const mockReservation = {
        id: "reservation-123",
        ...mockInput,
        status: ReservationStatus.REQUESTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGraphQLClient.mutate.mockResolvedValue({
        createReservation: mockReservation,
      });

      const result = await service.createReservation(mockInput);

      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining("mutation CreateReservation"),
        { input: mockInput }
      );

      expect(result).toEqual(mockReservation);
    });

    it("should handle creation errors", async () => {
      const mockInput = {
        guestName: "John Doe",
        guestPhone: "+1234567890",
        guestEmail: "john@example.com",
        arrivalTime: new Date("2024-12-25T19:00:00"),
        tableSize: 4,
      };

      mockGraphQLClient.mutate.mockRejectedValue(
        new Error("Validation failed")
      );

      await expect(service.createReservation(mockInput)).rejects.toThrow(
        "Validation failed"
      );
    });
  });

  describe("getReservation", () => {
    it("should get a reservation by ID", async () => {
      const mockReservation = {
        id: "reservation-123",
        guestName: "John Doe",
        guestPhone: "+1234567890",
        guestEmail: "john@example.com",
        arrivalTime: new Date("2024-12-25T19:00:00"),
        tableSize: 4,
        status: ReservationStatus.REQUESTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGraphQLClient.query.mockResolvedValue({
        getReservation: mockReservation,
      });

      const result = await service.getReservation("reservation-123");

      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining("query GetReservation"),
        { id: "reservation-123" }
      );

      expect(result).toEqual(mockReservation);
    });

    it("should handle get reservation errors", async () => {
      mockGraphQLClient.query.mockRejectedValue(
        new Error("Reservation not found")
      );

      await expect(service.getReservation("invalid-id")).rejects.toThrow(
        "Reservation not found"
      );
    });
  });

  describe("updateReservation", () => {
    it("should update a reservation successfully", async () => {
      const mockInput = {
        arrivalTime: new Date("2024-12-26T20:00:00"),
        tableSize: 6,
        notes: "Updated celebration",
      };

      const mockUpdatedReservation = {
        id: "reservation-123",
        guestName: "John Doe",
        guestPhone: "+1234567890",
        guestEmail: "john@example.com",
        ...mockInput,
        status: ReservationStatus.REQUESTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGraphQLClient.mutate.mockResolvedValue({
        updateReservation: mockUpdatedReservation,
      });

      const result = await service.updateReservation(
        "reservation-123",
        mockInput
      );

      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining("mutation UpdateReservation"),
        { id: "reservation-123", input: mockInput }
      );

      expect(result).toEqual(mockUpdatedReservation);
    });

    it("should handle update errors", async () => {
      mockGraphQLClient.mutate.mockRejectedValue(new Error("Update failed"));

      await expect(
        service.updateReservation("reservation-123", { tableSize: 8 })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("cancelReservation", () => {
    it("should cancel a reservation successfully", async () => {
      const mockCancelledReservation = {
        id: "reservation-123",
        guestName: "John Doe",
        guestPhone: "+1234567890",
        guestEmail: "john@example.com",
        arrivalTime: new Date("2024-12-25T19:00:00"),
        tableSize: 4,
        status: ReservationStatus.CANCELLED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGraphQLClient.mutate.mockResolvedValue({
        cancelReservation: mockCancelledReservation,
      });

      const result = await service.cancelReservation("reservation-123");

      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining("mutation CancelReservation"),
        { id: "reservation-123" }
      );

      expect(result).toEqual(mockCancelledReservation);
    });

    it("should handle cancellation errors", async () => {
      mockGraphQLClient.mutate.mockRejectedValue(
        new Error("Cancellation failed")
      );

      await expect(
        service.cancelReservation("reservation-123")
      ).rejects.toThrow("Cancellation failed");
    });
  });
});
