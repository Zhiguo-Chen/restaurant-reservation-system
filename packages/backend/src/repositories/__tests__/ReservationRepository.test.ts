import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";
import { ReservationRepository } from "../ReservationRepository";
import { Reservation, ReservationStatus } from "@restaurant-reservation/shared";

describe("ReservationRepository", () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let repository: ReservationRepository;

  const sampleReservation: Omit<Reservation, "id"> = {
    guestName: "John Doe",
    guestPhone: "+1234567890",
    guestEmail: "john@example.com",
    arrivalTime: new Date("2024-12-25T19:00:00Z"),
    tableSize: 4,
    status: ReservationStatus.REQUESTED,
    createdAt: new Date("2024-12-20T10:00:00Z"),
    updatedAt: new Date("2024-12-20T10:00:00Z"),
    notes: "Birthday celebration",
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("test-restaurant-reservations");
    repository = new ReservationRepository(db);
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await db.collection("reservations").deleteMany({});
  });

  describe("CRUD Operations", () => {
    it("should create a reservation", async () => {
      const created = await repository.create(sampleReservation as Reservation);

      expect(created.id).toBeDefined();
      expect(created.guestName).toBe(sampleReservation.guestName);
      expect(created.guestEmail).toBe(sampleReservation.guestEmail);
      expect(created.status).toBe(sampleReservation.status);
    });

    it("should find reservation by ID", async () => {
      const created = await repository.create(sampleReservation as Reservation);
      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.guestName).toBe(sampleReservation.guestName);
    });

    it("should return null for non-existent ID", async () => {
      const found = await repository.findById("nonexistent-id");
      expect(found).toBeNull();
    });

    it("should update a reservation", async () => {
      const created = await repository.create(sampleReservation as Reservation);
      const updateData = { tableSize: 6, notes: "Updated notes" };

      const updated = await repository.update(created.id, updateData);

      expect(updated.tableSize).toBe(6);
      expect(updated.notes).toBe("Updated notes");
      expect(updated.guestName).toBe(sampleReservation.guestName); // Unchanged
    });

    it("should delete a reservation", async () => {
      const created = await repository.create(sampleReservation as Reservation);

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it("should throw error when updating non-existent reservation", async () => {
      await expect(
        repository.update("nonexistent-id", { tableSize: 6 })
      ).rejects.toThrow("reservations not found for update");
    });

    it("should throw error when deleting non-existent reservation", async () => {
      await expect(repository.delete("nonexistent-id")).rejects.toThrow(
        "reservations not found for deletion"
      );
    });
  });

  describe("Query Methods", () => {
    beforeEach(async () => {
      // Create test data
      const reservations = [
        {
          ...sampleReservation,
          arrivalTime: new Date("2024-12-25T19:00:00Z"),
          status: ReservationStatus.REQUESTED,
        },
        {
          ...sampleReservation,
          guestName: "Jane Smith",
          guestEmail: "jane@example.com",
          arrivalTime: new Date("2024-12-26T20:00:00Z"),
          status: ReservationStatus.APPROVED,
        },
        {
          ...sampleReservation,
          guestName: "Bob Johnson",
          guestEmail: "bob@example.com",
          arrivalTime: new Date("2024-12-27T18:00:00Z"),
          status: ReservationStatus.CANCELLED,
        },
      ];

      for (const reservation of reservations) {
        await repository.create(reservation as Reservation);
      }
    });

    it("should find reservations by date range", async () => {
      const startDate = new Date("2024-12-25T00:00:00Z");
      const endDate = new Date("2024-12-26T23:59:59Z");

      const reservations = await repository.findByDateRange(startDate, endDate);

      expect(reservations).toHaveLength(2);
      expect(reservations[0].arrivalTime.getTime()).toBeLessThanOrEqual(
        reservations[1].arrivalTime.getTime()
      );
    });

    it("should find reservations by status", async () => {
      const requestedReservations = await repository.findByStatus(
        ReservationStatus.REQUESTED
      );
      const approvedReservations = await repository.findByStatus(
        ReservationStatus.APPROVED
      );

      expect(requestedReservations).toHaveLength(1);
      expect(approvedReservations).toHaveLength(1);
      expect(requestedReservations[0].status).toBe(ReservationStatus.REQUESTED);
      expect(approvedReservations[0].status).toBe(ReservationStatus.APPROVED);
    });

    it("should find reservations by guest email", async () => {
      const reservations = await repository.findByGuestEmail(
        "jane@example.com"
      );

      expect(reservations).toHaveLength(1);
      expect(reservations[0].guestEmail).toBe("jane@example.com");
      expect(reservations[0].guestName).toBe("Jane Smith");
    });

    it("should find reservations by date and status", async () => {
      const date = new Date("2024-12-25T12:00:00Z");
      const reservations = await repository.findByDateAndStatus(
        date,
        ReservationStatus.REQUESTED
      );

      expect(reservations).toHaveLength(1);
      expect(reservations[0].status).toBe(ReservationStatus.REQUESTED);
    });

    it("should find reservations by date without status filter", async () => {
      const date = new Date("2024-12-25T12:00:00Z");
      const reservations = await repository.findByDateAndStatus(date);

      expect(reservations).toHaveLength(1);
    });
  });

  describe("Pagination", () => {
    beforeEach(async () => {
      // Create 25 test reservations
      const reservations = Array.from({ length: 25 }, (_, i) => ({
        ...sampleReservation,
        guestName: `Guest ${i + 1}`,
        guestEmail: `guest${i + 1}@example.com`,
        arrivalTime: new Date(`2024-12-${(i % 30) + 1}T19:00:00Z`),
      }));

      for (const reservation of reservations) {
        await repository.create(reservation as Reservation);
      }
    });

    it("should paginate reservations", async () => {
      const result = await repository.findWithPagination({}, 1, 10);

      expect(result.reservations).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
    });

    it("should filter and paginate reservations", async () => {
      const result = await repository.findWithPagination(
        { status: ReservationStatus.REQUESTED },
        1,
        10
      );

      expect(result.reservations).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(
        result.reservations.every(
          (r) => r.status === ReservationStatus.REQUESTED
        )
      ).toBe(true);
    });

    it("should handle guest name filter", async () => {
      const result = await repository.findWithPagination(
        { guestName: "Guest 1" },
        1,
        10
      );

      expect(result.reservations.length).toBeGreaterThan(0);
      expect(
        result.reservations.every((r) => r.guestName.includes("Guest 1"))
      ).toBe(true);
    });
  });

  describe("Conflict Detection", () => {
    beforeEach(async () => {
      await repository.create({
        ...sampleReservation,
        arrivalTime: new Date("2024-12-25T19:00:00Z"),
        status: ReservationStatus.APPROVED,
      } as Reservation);
    });

    it("should find conflicting reservations", async () => {
      const conflicts = await repository.findConflictingReservations(
        new Date("2024-12-25T20:00:00Z"), // 1 hour later
        8
      );

      expect(conflicts).toHaveLength(1);
    });

    it("should exclude specific reservation from conflict check", async () => {
      const created = await repository.create({
        ...sampleReservation,
        guestName: "Test Guest",
        arrivalTime: new Date("2024-12-25T20:30:00Z"),
      } as Reservation);

      const conflicts = await repository.findConflictingReservations(
        new Date("2024-12-25T20:00:00Z"),
        8,
        created.id
      );

      expect(conflicts).toHaveLength(1); // Should only find the first reservation, not the excluded one
    });
  });

  describe("Statistics", () => {
    beforeEach(async () => {
      const reservations = [
        {
          ...sampleReservation,
          status: ReservationStatus.REQUESTED,
          tableSize: 4,
        },
        {
          ...sampleReservation,
          status: ReservationStatus.APPROVED,
          tableSize: 6,
        },
        {
          ...sampleReservation,
          status: ReservationStatus.COMPLETED,
          tableSize: 2,
        },
        {
          ...sampleReservation,
          status: ReservationStatus.CANCELLED,
          tableSize: 8,
        },
      ];

      for (const reservation of reservations) {
        await repository.create(reservation as Reservation);
      }
    });

    it("should get reservation statistics", async () => {
      const startDate = new Date("2024-12-20T00:00:00Z");
      const endDate = new Date("2024-12-30T23:59:59Z");

      const stats = await repository.getStatistics(startDate, endDate);

      expect(stats.total).toBe(4);
      expect(stats.byStatus[ReservationStatus.REQUESTED]).toBe(1);
      expect(stats.byStatus[ReservationStatus.APPROVED]).toBe(1);
      expect(stats.byStatus[ReservationStatus.COMPLETED]).toBe(1);
      expect(stats.byStatus[ReservationStatus.CANCELLED]).toBe(1);
      expect(stats.totalGuests).toBe(20); // 4 + 6 + 2 + 8
      expect(stats.averageTableSize).toBe(5); // 20 / 4
    });

    it("should return empty statistics for no data", async () => {
      await db.collection("reservations").deleteMany({});

      const startDate = new Date("2024-12-20T00:00:00Z");
      const endDate = new Date("2024-12-30T23:59:59Z");

      const stats = await repository.getStatistics(startDate, endDate);

      expect(stats.total).toBe(0);
      expect(stats.totalGuests).toBe(0);
      expect(stats.averageTableSize).toBe(0);
      expect(Object.values(stats.byStatus).every((count) => count === 0)).toBe(
        true
      );
    });
  });
});
