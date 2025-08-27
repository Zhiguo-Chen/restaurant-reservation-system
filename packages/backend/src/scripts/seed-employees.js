const { Cluster } = require("couchbase");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

async function seedEmployees() {
  try {
    console.log("👥 Employee Seeding Script");
    console.log("=========================");
    console.log("");

    // Read employees data from JSON file
    const employeesPath = path.join(__dirname, "employees.json");
    console.log("📄 Reading employees data from:", employeesPath);

    if (!fs.existsSync(employeesPath)) {
      throw new Error(`Employees file not found: ${employeesPath}`);
    }

    const employeesData = JSON.parse(fs.readFileSync(employeesPath, "utf8"));
    console.log(`✅ Loaded ${employeesData.length} employees from JSON file`);

    // Connect to Couchbase
    console.log("");
    console.log("📡 Connecting to Couchbase...");
    const cluster = await Cluster.connect("couchbase://localhost", {
      username: "admin",
      password: "password123",
    });

    const bucket = cluster.bucket("restaurant-reservations");
    const collection = bucket.defaultCollection();
    console.log("✅ Connected to Couchbase");

    // Hash password for all users (default password: employee123)
    const defaultPassword = "employee123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    console.log("🔐 Password hashed for all employees");

    console.log("");
    console.log("👥 Creating/Updating employees in database...");

    let createdCount = 0;
    let updatedCount = 0;

    // Insert/Update employees
    for (const employee of employeesData) {
      const userDoc = {
        type: "user",
        id: employee.id,
        username: employee.username,
        email: employee.email,
        passwordHash: passwordHash,
        role: employee.role,
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        phone: employee.phone || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        // Try to get existing document first
        try {
          await collection.get(`user::${employee.id}`);
          // If we get here, document exists, so we'll update it
          await collection.upsert(`user::${employee.id}`, userDoc);
          console.log(
            `🔄 Updated ${employee.role.toLowerCase()}: ${employee.username} (${
              employee.firstName
            } ${employee.lastName})`
          );
          updatedCount++;
        } catch (getError) {
          // Document doesn't exist, create new one
          await collection.upsert(`user::${employee.id}`, userDoc);
          console.log(
            `✅ Created ${employee.role.toLowerCase()}: ${employee.username} (${
              employee.firstName
            } ${employee.lastName})`
          );
          createdCount++;
        }
      } catch (error) {
        console.error(
          `❌ Error processing ${employee.username}:`,
          error.message
        );
      }
    }

    await cluster.close();

    console.log("");
    console.log("🎉 Employee seeding completed!");
    console.log(`📊 Summary: ${createdCount} created, ${updatedCount} updated`);
    console.log("");
    console.log("👤 Login Credentials (password for all: employee123):");

    employeesData.forEach((emp) => {
      console.log(
        `   ${emp.firstName} ${emp.lastName} (${emp.role}): ${emp.username} / employee123`
      );
    });

    console.log("");
    console.log("🌐 Access the system:");
    console.log("   Frontend: http://localhost:3000");
    console.log("   Login:    http://localhost:3000/login");
    console.log("");
  } catch (error) {
    console.error("❌ Error seeding employees:", error.message);
    console.error("");
    console.error("Make sure:");
    console.error("1. Couchbase is running: make start");
    console.error("2. Wait for Couchbase to be ready (about 1-2 minutes)");
    console.error("3. employees.json file exists in the scripts directory");
    console.error("4. Try running the script again");
    process.exit(1);
  }
}

// Run the seed function
seedEmployees();
