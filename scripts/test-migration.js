#!/usr/bin/env node

const { Cluster } = require("couchbase");

async function testCouchbaseConnection() {
  try {
    console.log("Testing Couchbase connection...");

    const cluster = await Cluster.connect("couchbase://localhost", {
      username: "admin",
      password: "password123",
    });

    const bucket = cluster.bucket("restaurant-reservations");
    const collection = bucket.defaultCollection();

    // Test basic operations
    console.log("✓ Connected to Couchbase");

    // Test document creation
    const testDoc = {
      type: "test",
      id: "test-doc-1",
      message: "Hello Couchbase!",
      timestamp: new Date().toISOString(),
    };

    await collection.upsert("test::test-doc-1", testDoc);
    console.log("✓ Document created successfully");

    // Test document retrieval
    const result = await collection.get("test::test-doc-1");
    console.log("✓ Document retrieved successfully:", result.content.message);

    // Test N1QL query
    const queryResult = await cluster.query(
      "SELECT COUNT(*) as count FROM `restaurant-reservations` WHERE type = $type",
      { parameters: { type: "test" } }
    );
    console.log(
      "✓ N1QL query executed successfully, test documents:",
      queryResult.rows[0].count
    );

    // Cleanup
    await collection.remove("test::test-doc-1");
    console.log("✓ Test document cleaned up");

    await cluster.close();
    console.log("✓ Connection closed");

    console.log("\n🎉 Couchbase migration test completed successfully!");
  } catch (error) {
    console.error("❌ Migration test failed:", error.message);
    process.exit(1);
  }
}

testCouchbaseConnection();
