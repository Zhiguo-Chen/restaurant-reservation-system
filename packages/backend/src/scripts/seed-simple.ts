import { DatabaseConnection } from "../config/database";
import { UserRepository } from "../repositories/UserRepository";
import { ReservationRepository } from "../repositories/ReservationRepository";
import { PasswordUtils } from "../utils/password";
import {
  User,
  UserRole,
  Reservation,
  ReservationStatus,
} from "../types/shared";
import { v4 as uuidv4 } from "uuid";

// Employee seed data
const employees = [
  {
    username: "admin",
    password: "admin123",
    firstName: "System",
    lastName: "Administrator",
    email: "admin@restaurant.com",
    role: UserRole.ADMIN,
  },
  {
    username: "manager",
    password: "manager123",
    firstName: "Restaurant",
    lastName: "Manager",
    email: "manager@restaurant.com",
    role: UserRole.MANAGER,
  },
  {
    username: "staff1",
    password: "staff123",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@restaurant.com",
    role: UserRole.EMPLOYEE,
  },
  {
    username: "staff2",
    password: "staff123",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@restaurant.com",
    role: UserRole.EMPLOYEE,
  },
];

// Reservation seed data
const reservations = [
  {
    guestName: "Alice Johnson",
    guestEmail: "alice@example.com",
    guestPhone: "+1-555-0101",
    arrivalTime: "2025-01-15T19:00:00.000Z",
    partySize: 2,
    status: ReservationStatus.CONFIRMED,
    specialRequests: "Window table preferred",
  },
  {
    guestName: "Bob Wilson",
    guestEmail: "bob@example.com",
    guestPhone: "+1-555-0102",
    arrivalTime: "2025-01-15T20:00:00.000Z",
    partySize: 4,
    status: ReservationStatus.CONFIRMED,
  },
  {
    guestName: "Carol Brown",
    guestEmail: "carol@example.com",
    guestPhone: "+1-555-0103",
    arrivalTime: "2025-01-16T18:30:00.000Z",
    partySize: 6,
    status: ReservationStatus.REQUESTED,
    specialRequests: "Birthday celebration - need high chair",
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Database configuration
    const dbConfig = {
      connectionString:
        process.env.COUCHBASE_CONNECTION_STRING || "couchbase://localhost",
      username: process.env.COUCHBASE_USERNAME || "Administrator",
      password: process.env.COUCHBASE_PASSWORD || "password",
      bucketName: process.env.COUCHBASE_BUCKET || "restaurant",
    };

    // Connect to database
    const dbConnection = DatabaseConnection.getInstance(dbConfig);
    await dbConnection.connect();

    const bucket = dbConnection.getBucket();
    const userRepository = new UserRepository(bucket);
    const reservationRepository = new ReservationRepository(bucket);

    // Seed employees
    console.log("👥 Seeding employees...");
    for (const emp of employees) {
      try {
        const existingUser = await userRepository.findByUsername(emp.username);
        if (existingUser) {
          console.log(
            `⚠️  Employee ${emp.username} already exists, skipping...`
          );
          continue;
        }

        const hashedPassword = await PasswordUtils.hashPassword(emp.password);
        const user: User = {
          id: uuidv4(),
          username: emp.username,
          email: emp.email,
          passwordHash: hashedPassword,
          role: emp.role,
          firstName: emp.firstName,
          lastName: emp.lastName,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await userRepository.create(user);
        console.log(
          `✅ Created employee: ${emp.firstName} ${emp.lastName} (${emp.username})`
        );
      } catch (error) {
        console.error(`❌ Failed to create employee ${emp.username}:`, error);
      }
    }

    // Seed reservations
    console.log("🍽️  Seeding reservations...");
    for (const res of reservations) {
      try {
        const reservation: Reservation = {
          id: uuidv4(),
          guestName: res.guestName,
          guestEmail: res.guestEmail,
          guestPhone: res.guestPhone,
          partySize: res.partySize,
          tableSize: res.partySize, // Map partySize to tableSize for GraphQL compatibility
          arrivalTime: new Date(res.arrivalTime),
          status: res.status,
          specialRequests: res.specialRequests || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await reservationRepository.create(reservation);
        console.log(
          `✅ Created reservation: ${res.guestName} - ${res.arrivalTime}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to create reservation for ${res.guestName}:`,
          error
        );
      }
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("");
    console.log("📋 Seeded Data Summary:");
    console.log(`   • ${employees.length} employees`);
    console.log(`   • ${reservations.length} reservations`);
    console.log("");
    console.log("🔐 Employee Login Credentials:");
    employees.forEach((emp) => {
      console.log(
        `   • ${emp.firstName} ${emp.lastName}: ${emp.username} / ${emp.password} (${emp.role})`
      );
    });

    await dbConnection.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
