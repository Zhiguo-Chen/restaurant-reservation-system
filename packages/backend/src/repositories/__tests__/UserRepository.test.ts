import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";
import { UserRepository } from "../UserRepository";
import { User, UserRole } from "@restaurant-reservation/shared";

describe("UserRepository", () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let repository: UserRepository;

  const sampleUser: Omit<User, "id"> = {
    username: "testuser",
    role: UserRole.EMPLOYEE,
    createdAt: new Date("2024-12-20T10:00:00Z"),
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("test-restaurant-reservations");
    repository = new UserRepository(db);
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await db.collection("users").deleteMany({});
  });

  describe("CRUD Operations", () => {
    it("should create a user", async () => {
      const created = await repository.create(sampleUser as User);

      expect(created.id).toBeDefined();
      expect(created.username).toBe(sampleUser.username);
      expect(created.role).toBe(sampleUser.role);
      expect(created.createdAt).toEqual(sampleUser.createdAt);
    });

    it("should find user by ID", async () => {
      const created = await repository.create(sampleUser as User);
      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.username).toBe(sampleUser.username);
    });

    it("should return null for non-existent ID", async () => {
      const found = await repository.findById("nonexistent-id");
      expect(found).toBeNull();
    });

    it("should update a user", async () => {
      const created = await repository.create(sampleUser as User);
      const updateData = { role: UserRole.ADMIN };

      const updated = await repository.update(created.id, updateData);

      expect(updated.role).toBe(UserRole.ADMIN);
      expect(updated.username).toBe(sampleUser.username); // Unchanged
    });

    it("should delete a user", async () => {
      const created = await repository.create(sampleUser as User);

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it("should throw error when updating non-existent user", async () => {
      await expect(
        repository.update("nonexistent-id", { role: UserRole.ADMIN })
      ).rejects.toThrow("users not found for update");
    });

    it("should throw error when deleting non-existent user", async () => {
      await expect(repository.delete("nonexistent-id")).rejects.toThrow(
        "users not found for deletion"
      );
    });
  });

  describe("Username Operations", () => {
    beforeEach(async () => {
      await repository.create(sampleUser as User);
    });

    it("should find user by username", async () => {
      const found = await repository.findByUsername("testuser");

      expect(found).not.toBeNull();
      expect(found!.username).toBe("testuser");
      expect(found!.role).toBe(UserRole.EMPLOYEE);
    });

    it("should return null for non-existent username", async () => {
      const found = await repository.findByUsername("nonexistent");
      expect(found).toBeNull();
    });

    it("should check if username exists", async () => {
      const exists = await repository.usernameExists("testuser");
      const notExists = await repository.usernameExists("nonexistent");

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it("should check username existence excluding specific ID", async () => {
      const created = await repository.create({
        ...sampleUser,
        username: "anotheruser",
      } as User);

      const exists = await repository.usernameExists("testuser", created.id);
      expect(exists).toBe(true); // Should still find the original user

      const notExists = await repository.usernameExists(
        "anotheruser",
        created.id
      );
      expect(notExists).toBe(false); // Should exclude the specified user
    });

    it("should prevent creating user with duplicate username", async () => {
      await expect(repository.create(sampleUser as User)).rejects.toThrow(
        "Username 'testuser' already exists"
      );
    });

    it("should prevent updating to duplicate username", async () => {
      const anotherUser = await repository.create({
        ...sampleUser,
        username: "anotheruser",
      } as User);

      await expect(
        repository.update(anotherUser.id, { username: "testuser" })
      ).rejects.toThrow("Username 'testuser' already exists");
    });

    it("should allow updating user with same username", async () => {
      const created = await repository.create({
        ...sampleUser,
        username: "uniqueuser",
      } as User);

      // Should not throw error when updating with same username
      const updated = await repository.update(created.id, {
        username: "uniqueuser",
        role: UserRole.ADMIN,
      });

      expect(updated.username).toBe("uniqueuser");
      expect(updated.role).toBe(UserRole.ADMIN);
    });
  });

  describe("Role Operations", () => {
    beforeEach(async () => {
      const users = [
        { ...sampleUser, username: "employee1", role: UserRole.EMPLOYEE },
        { ...sampleUser, username: "employee2", role: UserRole.EMPLOYEE },
        { ...sampleUser, username: "admin1", role: UserRole.ADMIN },
        { ...sampleUser, username: "admin2", role: UserRole.ADMIN },
      ];

      for (const user of users) {
        await repository.create(user as User);
      }
    });

    it("should find users by role", async () => {
      const employees = await repository.findByRole(UserRole.EMPLOYEE);
      const admins = await repository.findByRole(UserRole.ADMIN);

      expect(employees).toHaveLength(2);
      expect(admins).toHaveLength(2);
      expect(employees.every((u) => u.role === UserRole.EMPLOYEE)).toBe(true);
      expect(admins.every((u) => u.role === UserRole.ADMIN)).toBe(true);
    });

    it("should sort users by creation date (newest first)", async () => {
      const employees = await repository.findByRole(UserRole.EMPLOYEE);

      expect(employees).toHaveLength(2);
      // Should be sorted by createdAt descending
      for (let i = 1; i < employees.length; i++) {
        expect(employees[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          employees[i].createdAt.getTime()
        );
      }
    });
  });

  describe("Statistics", () => {
    beforeEach(async () => {
      const users = [
        {
          ...sampleUser,
          username: "employee1",
          role: UserRole.EMPLOYEE,
          createdAt: new Date("2024-12-01T10:00:00Z"),
        },
        {
          ...sampleUser,
          username: "employee2",
          role: UserRole.EMPLOYEE,
          createdAt: new Date("2024-12-02T10:00:00Z"),
        },
        {
          ...sampleUser,
          username: "employee3",
          role: UserRole.EMPLOYEE,
          createdAt: new Date("2024-12-03T10:00:00Z"),
        },
        {
          ...sampleUser,
          username: "admin1",
          role: UserRole.ADMIN,
          createdAt: new Date("2024-12-04T10:00:00Z"),
        },
        {
          ...sampleUser,
          username: "admin2",
          role: UserRole.ADMIN,
          createdAt: new Date("2024-12-05T10:00:00Z"),
        },
      ];

      for (const user of users) {
        await repository.create(user as User);
      }
    });

    it("should get user statistics", async () => {
      const stats = await repository.getStatistics();

      expect(stats.total).toBe(5);
      expect(stats.byRole[UserRole.EMPLOYEE]).toBe(3);
      expect(stats.byRole[UserRole.ADMIN]).toBe(2);
      expect(stats.recentUsers).toHaveLength(5);

      // Recent users should be sorted by creation date (newest first)
      for (let i = 1; i < stats.recentUsers.length; i++) {
        expect(
          stats.recentUsers[i - 1].createdAt.getTime()
        ).toBeGreaterThanOrEqual(stats.recentUsers[i].createdAt.getTime());
      }
    });

    it("should limit recent users to 10", async () => {
      // Create 15 more users
      for (let i = 6; i <= 20; i++) {
        await repository.create({
          ...sampleUser,
          username: `user${i}`,
          createdAt: new Date(
            `2024-12-${i.toString().padStart(2, "0")}T10:00:00Z`
          ),
        } as User);
      }

      const stats = await repository.getStatistics();

      expect(stats.total).toBe(20);
      expect(stats.recentUsers).toHaveLength(10);
    });

    it("should return empty statistics for no data", async () => {
      await db.collection("users").deleteMany({});

      const stats = await repository.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.byRole[UserRole.EMPLOYEE]).toBe(0);
      expect(stats.byRole[UserRole.ADMIN]).toBe(0);
      expect(stats.recentUsers).toHaveLength(0);
    });
  });

  describe("Utility Methods", () => {
    beforeEach(async () => {
      await repository.create(sampleUser as User);
    });

    it("should check if user exists", async () => {
      const created = await repository.create({
        ...sampleUser,
        username: "existinguser",
      } as User);

      const exists = await repository.exists(created.id);
      const notExists = await repository.exists("nonexistent-id");

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it("should find all users", async () => {
      await repository.create({
        ...sampleUser,
        username: "anotheruser",
      } as User);

      const allUsers = await repository.findAll();

      expect(allUsers).toHaveLength(2);
    });
  });
});
