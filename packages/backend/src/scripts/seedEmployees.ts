import { DatabaseConnection } from "../config/database";
import { UserRepository } from "../repositories/UserRepository";
import { PasswordUtils } from "../utils/password";
import { User, UserRole } from "../types/shared";
import { v4 as uuidv4 } from "uuid";

interface SeedEmployee {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

const seedEmployeesData: SeedEmployee[] = [
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

async function seedEmployees() {
  try {
    console.log("👥 Starting employee seeding...");

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

    console.log("📝 Seeding employees...");
    for (const employee of seedEmployeesData) {
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

    console.log("🎉 Employee seeding completed successfully!");
    console.log("");
    console.log("🔐 Employee Login Credentials:");
    seedEmployeesData.forEach((emp) => {
      console.log(
        `   • ${emp.firstName} ${emp.lastName}: ${emp.username} / ${emp.password} (${emp.role})`
      );
    });

    await dbConnection.disconnect();
  } catch (error) {
    console.error("❌ Employee seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedEmployees()
    .then(() => {
      console.log("✨ Employee seeding process completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Employee seeding process failed:", error);
      process.exit(1);
    });
}

export { seedEmployees, seedEmployeesData };
