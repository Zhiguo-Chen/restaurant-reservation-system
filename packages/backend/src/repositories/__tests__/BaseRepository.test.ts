import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";
import { BaseRepository } from "../BaseRepository";

// Test implementation of BaseRepository
interface TestEntity {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

class TestRepository extends BaseRepository<TestEntity> {
  constructor(db: Db) {
    super(db, "test-entities");
  }

  protected toDomainEntity(doc: any): TestEntity {
    return {
      id: doc._id,
      name: doc.name,
      value: doc.value,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    };
  }

  protected toMongoDocument(entity: TestEntity): any {
    return {
      _id: entity.id,
      name: entity.name,
      value: entity.value,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

describe("BaseRepository", () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let repository: TestRepository;

  const sampleEntity: Omit<TestEntity, "id"> = {
    name: "Test Entity",
    value: 42,
    createdAt: new Date("2024-12-20T10:00:00Z"),
    updatedAt: new Date("2024-12-20T10:00:00Z"),
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("test-database");
    repository = new TestRepository(db);
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the collection before each test
    await db.collection("test-entities").deleteMany({});
  });

  describe("CRUD Operations", () => {
    it("should create an entity", async () => {
      const created = await repository.create(sampleEntity as TestEntity);

      expect(created.id).toBeDefined();
      expect(created.id).toMatch(/^[a-f\d]{24}$/i); // ObjectId format
      expect(created.name).toBe(sampleEntity.name);
      expect(created.value).toBe(sampleEntity.value);
    });

    it("should find entity by ID", async () => {
      const created = await repository.create(sampleEntity as TestEntity);
      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe(sampleEntity.name);
      expect(found!.value).toBe(sampleEntity.value);
    });

    it("should return null for non-existent ID", async () => {
      const found = await repository.findById("nonexistent-id");
      expect(found).toBeNull();
    });

    it("should update an entity", async () => {
      const created = await repository.create(sampleEntity as TestEntity);
      const updateData = { name: "Updated Entity", value: 100 };

      const updated = await repository.update(created.id, updateData);

      expect(updated.name).toBe("Updated Entity");
      expect(updated.value).toBe(100);
      expect(updated.id).toBe(created.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        created.updatedAt.getTime()
      );
    });

    it("should delete an entity", async () => {
      const created = await repository.create(sampleEntity as TestEntity);

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it("should throw error when updating non-existent entity", async () => {
      await expect(
        repository.update("nonexistent-id", { name: "Updated" })
      ).rejects.toThrow("test-entities not found for update");
    });

    it("should throw error when deleting non-existent entity", async () => {
      await expect(repository.delete("nonexistent-id")).rejects.toThrow(
        "test-entities not found for deletion"
      );
    });
  });

  describe("Query Operations", () => {
    beforeEach(async () => {
      // Create test data
      const entities = [
        { ...sampleEntity, name: "Entity 1", value: 10 },
        { ...sampleEntity, name: "Entity 2", value: 20 },
        { ...sampleEntity, name: "Entity 3", value: 30 },
      ];

      for (const entity of entities) {
        await repository.create(entity as TestEntity);
      }
    });

    it("should find all entities", async () => {
      const entities = await repository.findAll();

      expect(entities).toHaveLength(3);
      expect(entities.map((e) => e.name)).toContain("Entity 1");
      expect(entities.map((e) => e.name)).toContain("Entity 2");
      expect(entities.map((e) => e.name)).toContain("Entity 3");
    });

    it("should find all entities with options", async () => {
      const entities = await repository.findAll({
        sort: { value: -1 },
        limit: 2,
      });

      expect(entities).toHaveLength(2);
      expect(entities[0].value).toBe(30); // Highest value first
      expect(entities[1].value).toBe(20);
    });

    it("should check if entity exists", async () => {
      const created = await repository.create(sampleEntity as TestEntity);

      const exists = await repository.exists(created.id);
      const notExists = await repository.exists("nonexistent-id");

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe("Protected Methods", () => {
    it("should generate unique IDs", async () => {
      const entities = [];

      // Create multiple entities and check ID uniqueness
      for (let i = 0; i < 5; i++) {
        const entity = await repository.create({
          ...sampleEntity,
          name: `Entity ${i}`,
        } as TestEntity);
        entities.push(entity);
      }

      const ids = entities.map((e) => e.id);
      const uniqueIds = [...new Set(ids)];

      expect(uniqueIds).toHaveLength(5);
      expect(ids.every((id) => id.match(/^[a-f\d]{24}$/i))).toBe(true);
    });

    it("should handle domain entity conversion", async () => {
      const created = await repository.create(sampleEntity as TestEntity);
      const found = await repository.findById(created.id);

      expect(found).toBeInstanceOf(Object);
      expect(found!.createdAt).toBeInstanceOf(Date);
      expect(found!.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle mongo document conversion", async () => {
      const created = await repository.create(sampleEntity as TestEntity);

      // Verify the document was stored correctly in MongoDB
      const doc = await db
        .collection("test-entities")
        .findOne({ _id: created.id });

      expect(doc).not.toBeNull();
      expect(doc!._id).toBe(created.id);
      expect(doc!.name).toBe(sampleEntity.name);
      expect(doc!.value).toBe(sampleEntity.value);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors gracefully", async () => {
      // Close the connection to simulate error
      await client.close();

      await expect(
        repository.create(sampleEntity as TestEntity)
      ).rejects.toThrow();

      // Reconnect for cleanup
      await client.connect();
      db = client.db("test-database");
      repository = new TestRepository(db);
    });

    it("should handle invalid filter in findWithFilter", async () => {
      // This should not throw but return empty results
      const entities = await (repository as any).findWithFilter({
        invalidField: "value",
      });
      expect(entities).toHaveLength(0);
    });

    it("should handle count operations", async () => {
      await repository.create(sampleEntity as TestEntity);
      await repository.create({
        ...sampleEntity,
        name: "Another Entity",
      } as TestEntity);

      const count = await (repository as any).countWithFilter({});
      expect(count).toBe(2);

      const filteredCount = await (repository as any).countWithFilter({
        name: "Test Entity",
      });
      expect(filteredCount).toBe(1);
    });
  });
});
