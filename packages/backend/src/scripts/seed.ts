import { DatabaseConnection } from "../config/database";
import { UserRepository } from "../repositories/UserRepository";
import { ReservationRepository } from "../repositories/ReservationRepository";
import { AuthServiceImpl } from "../services/AuthService";
import { PasswordUtils } from "../utils/password";
import {
  User,
  UserRole,
  Reservation,
  ReservationStatus,
} from "../types/shared";
import { v4 as uuidv4 } from "uuid";

interface SeedEmployee {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

interface SeedReservation {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  arrivalTime: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string;
}

const seedEmployees: SeedEmployee[] = [
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

const seedReservations: SeedReservation[] = [
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
  {
    guestName: "David Lee",
    guestEmail: "david@example.com",
    guestPhone: "+1-555-0104",
    arrivalTime: "2025-01-16T19:30:00.000Z",
    partySize: 3,
    status: ReservationStatus.CONFIRMED,
  },
  {
    guestName: "Emma Davis",
    guestEmail: "emma@example.com",
    guestPhone: "+1-555-0105",
    arrivalTime: "2025-01-17T20:30:00.000Z",
    partySize: 2,
    status: ReservationStatus.CANCELLED,
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Initialize database connection
    const dbConfig = {
      connectionString:
        process.env.COUCHBASE_CONNECTION_STRING || "couchbase://localhost",
      username: process.env.COUCHBASE_USERNAME || "Administrator",
      password: process.env.COUCHBASE_PASSWORD || "password",
      bucketName: process.env.COUCHBASE_BUCKET || "restaurant",
    };

    const dbConnection = DatabaseConnection.getInstance(dbConfig);
    await dbConnection.connect();

    const bucket = dbConnection.getBucket();
    const userRepository = new UserRepository(bucket);
    const reservationRepository = new ReservationRepository(bucket);

    console.log("📝 Seeding employees...");
    for (const employee of seedEmployees) {
      try {
        // Check if user already exists
        const existingUser = await userRepository.findByUsername(
          employee.username
        );
        if (existingUser) {
          console.log(
            `⚠️  Employee ${employee.username} already exists, skipping...`
          );
          continue;
        }

        const hashedPassword = await PasswordUtils.hashPassword(
          employee.password
        );
        const user: User = {
          id: uuidv4(),
          username: employee.username,
          email: employee.email,
          passwordHash: hashedPassword,
          role: employee.role,
          firstName: employee.firstName,
          lastName: employee.lastName,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await userRepository.create(user);
        console.log(
          `✅ Created employee: ${employee.firstName} ${employee.lastName} (${employee.username})`
        );
      } catch (error) {
        console.error(
          `❌ Failed to create employee ${employee.username}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log("🍽️  Seeding reservations...");
    for (const reservation of seedReservations) {
      try {
        const reservationEntity: Reservation = {
          id: uuidv4(),
          guestName: reservation.guestName,
          guestEmail: reservation.guestEmail,
          guestPhone: reservation.guestPhone,
          partySize: reservation.partySize,
          arrivalTime: new Date(reservation.arrivalTime),
          status: reservation.status,
          specialRequests: reservation.specialRequests || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await reservationRepository.create(reservationEntity);
        console.log(
          `✅ Created reservation: ${reservation.guestName} - ${reservation.arrivalTime}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to create reservation for ${reservation.guestName}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("");
    console.log("📋 Seeded Data Summary:");
    console.log(`   • ${seedEmployees.length} employees`);
    console.log(`   • ${seedReservations.length} reservations`);
    console.log("");
    console.log("🔐 Employee Login Credentials:");
    seedEmployees.forEach((emp) => {
      console.log(
        `   • ${emp.firstName} ${emp.lastName}: ${emp.username} / ${emp.password} (${emp.role})`
      );
    });

    await dbConnection.disconnect();
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✨ Seeding process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding process failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
