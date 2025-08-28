const { Cluster } = require("couchbase");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

async function seedDatabase() {
  try {
    console.log("🍽️  Restaurant Reservation System - Database Seeding");
    console.log("===================================================");
    console.log("");

    // Connect to Couchbase
    console.log("📡 Connecting to Couchbase...");
    const cluster = await Cluster.connect("couchbase://couchbase", {
      username: "admin",
      password: "password123",
    });

    const bucket = cluster.bucket("restaurant-reservations");
    const collection = bucket.defaultCollection();

    console.log("✅ Connected to Couchbase");

    // Read employees data from JSON file
    const employeesPath = path.join(__dirname, "employees.json");
    console.log("� Resading employees data from:", employeesPath);

    if (!fs.existsSync(employeesPath)) {
      throw new Error(`Employees file not found: ${employeesPath}`);
    }

    const employees = JSON.parse(fs.readFileSync(employeesPath, "utf8"));
    console.log(`✅ Loaded ${employees.length} employees from JSON file`);

    // Hash password for all users
    const passwordHash = await bcrypt.hash("employee123", 10);
    console.log("🔐 Password hashed");

    // Sample reservations data
    const reservations = [
      {
        id: "res1",
        guestName: "John Doe",
        guestEmail: "john.doe@example.com",
        guestPhone: "+1234567890",
        arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        tableSize: 2,
        status: "APPROVED",
        notes: "Window seat preferred",
      },
      {
        id: "res2",
        guestName: "Jane Smith",
        guestEmail: "jane.smith@example.com",
        guestPhone: "+1234567891",
        arrivalTime: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // Day after tomorrow
        tableSize: 4,
        status: "REQUESTED",
        notes: "Birthday celebration",
      },
      {
        id: "res3",
        guestName: "Bob Johnson",
        guestEmail: "bob.johnson@example.com",
        guestPhone: "+1234567892",
        arrivalTime: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(), // Three days from now
        tableSize: 6,
        status: "APPROVED",
        notes: "Business dinner",
      },
    ];

    console.log("");
    console.log("👥 Creating employees...");

    // Insert employees
    for (const employee of employees) {
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
        await collection.upsert(`user::${employee.id}`, userDoc);
        console.log(
          `✅ Created ${employee.role.toLowerCase()}: ${employee.username} (${
            employee.firstName
          } ${employee.lastName})`
        );
      } catch (error) {
        console.log(
          `⚠️  Updated ${employee.role.toLowerCase()}: ${employee.username} (${
            employee.firstName
          } ${employee.lastName})`
        );
      }
    }

    console.log("");
    console.log("📋 Creating sample reservations...");

    // Insert reservations
    for (const reservation of reservations) {
      const reservationDoc = {
        type: "reservation",
        id: reservation.id,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail,
        guestPhone: reservation.guestPhone,
        arrivalTime: reservation.arrivalTime,
        tableSize: reservation.tableSize,
        status: reservation.status,
        notes: reservation.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await collection.upsert(
          `reservation::${reservation.id}`,
          reservationDoc
        );
        console.log(`✅ Created reservation for: ${reservation.guestName}`);
      } catch (error) {
        console.log(`⚠️  Updated reservation for: ${reservation.guestName}`);
      }
    }

    await cluster.close();

    console.log("");
    console.log("🎉 Database seeding completed successfully!");
    console.log("");
    console.log("👤 Login Credentials (password for all: employee123):");
    employees.forEach((emp) => {
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
    console.error("❌ Error seeding database:", error.message);
    console.error("");
    console.error("Make sure:");
    console.error("1. Couchbase is running: make start");
    console.error("2. Wait for Couchbase to be ready (about 1-2 minutes)");
    console.error("3. Try running the seed script again");
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
