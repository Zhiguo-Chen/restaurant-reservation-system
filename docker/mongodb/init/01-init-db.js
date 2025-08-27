// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the restaurant-reservations database
db = db.getSiblingDB("restaurant-reservations");

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "passwordHash", "role"],
      properties: {
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 50,
          description: "Username must be a string between 3-50 characters",
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Email must be a valid email address",
        },
        passwordHash: {
          bsonType: "string",
          description: "Password hash is required",
        },
        role: {
          enum: ["EMPLOYEE", "ADMIN"],
          description: "Role must be either EMPLOYEE or ADMIN",
        },
        createdAt: {
          bsonType: "date",
          description: "Creation timestamp",
        },
        updatedAt: {
          bsonType: "date",
          description: "Last update timestamp",
        },
      },
    },
  },
});

db.createCollection("reservations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "guestName",
        "guestEmail",
        "guestPhone",
        "arrivalTime",
        "tableSize",
        "status",
      ],
      properties: {
        guestName: {
          bsonType: "string",
          minLength: 1,
          maxLength: 100,
          description: "Guest name is required",
        },
        guestEmail: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Valid email is required",
        },
        guestPhone: {
          bsonType: "string",
          minLength: 10,
          maxLength: 20,
          description: "Phone number is required",
        },
        arrivalTime: {
          bsonType: "date",
          description: "Arrival time is required",
        },
        tableSize: {
          bsonType: "int",
          minimum: 1,
          maximum: 12,
          description: "Table size must be between 1-12",
        },
        status: {
          enum: ["REQUESTED", "APPROVED", "CANCELLED", "COMPLETED"],
          description: "Status must be a valid reservation status",
        },
        notes: {
          bsonType: "string",
          maxLength: 500,
          description: "Notes cannot exceed 500 characters",
        },
        createdAt: {
          bsonType: "date",
          description: "Creation timestamp",
        },
        updatedAt: {
          bsonType: "date",
          description: "Last update timestamp",
        },
      },
    },
  },
});

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.reservations.createIndex({ guestEmail: 1 });
db.reservations.createIndex({ arrivalTime: 1 });
db.reservations.createIndex({ status: 1 });
db.reservations.createIndex({ createdAt: 1 });
db.reservations.createIndex({ guestEmail: 1, arrivalTime: 1 });

// Insert default admin user
// Password: admin123 (hashed with bcrypt)
db.users.insertOne({
  username: "admin",
  email: "admin@restaurant.com",
  passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ", // admin123
  role: "ADMIN",
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Insert sample employee user
// Password: employee123 (hashed with bcrypt)
db.users.insertOne({
  username: "employee",
  email: "employee@restaurant.com",
  passwordHash: "$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ", // employee123
  role: "EMPLOYEE",
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Insert sample reservations for testing
const sampleReservations = [
  {
    guestName: "John Doe",
    guestEmail: "john.doe@example.com",
    guestPhone: "+1234567890",
    arrivalTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    tableSize: 2,
    status: "APPROVED",
    notes: "Window seat preferred",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    guestName: "Jane Smith",
    guestEmail: "jane.smith@example.com",
    guestPhone: "+1234567891",
    arrivalTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    tableSize: 4,
    status: "REQUESTED",
    notes: "Birthday celebration",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    guestName: "Bob Johnson",
    guestEmail: "bob.johnson@example.com",
    guestPhone: "+1234567892",
    arrivalTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Three days from now
    tableSize: 6,
    status: "APPROVED",
    notes: "Business dinner",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

db.reservations.insertMany(sampleReservations);

print("Database initialization completed successfully!");
print("Created collections: users, reservations");
print("Created indexes for performance optimization");
print("Inserted sample data for testing");
print("Default admin user: admin / admin123");
print("Default employee user: employee / employee123");
