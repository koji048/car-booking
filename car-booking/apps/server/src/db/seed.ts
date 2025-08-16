import "dotenv/config";
import { db } from "./index";
import { vehicles, departments, user, bookings, bookingTravelers, approvals } from "./schema";
import { hashPassword } from "better-auth/crypto";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await db.delete(bookingTravelers);
    await db.delete(approvals);
    await db.delete(bookings);
    await db.delete(vehicles);
    await db.delete(user);
    await db.delete(departments);

    // Create departments
    console.log("Creating departments...");
    const [salesDept, engineeringDept, hrDept] = await db.insert(departments).values([
      { name: "Sales", code: "SALES" },
      { name: "Engineering", code: "ENG" },
      { name: "Human Resources", code: "HR" }
    ]).returning();

    // Create users
    console.log("Creating users...");
    const passwordHash = await hashPassword("password123"); // In production, use different passwords

    const [adminUser] = await db.insert(user).values({
      id: "admin-001",
      email: "admin@company.com",
      name: "Admin User",
      emailVerified: true,
      role: "admin",
      departmentId: engineeringDept.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const [hrManager] = await db.insert(user).values({
      id: "hr-001",
      email: "hr@company.com",
      name: "HR Manager",
      emailVerified: true,
      role: "hr",
      departmentId: hrDept.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const [salesManager] = await db.insert(user).values({
      id: "manager-001",
      email: "sales.manager@company.com",
      name: "Sales Manager",
      emailVerified: true,
      role: "manager",
      departmentId: salesDept.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const [engManager] = await db.insert(user).values({
      id: "manager-002",
      email: "eng.manager@company.com",
      name: "Engineering Manager",
      emailVerified: true,
      role: "manager",
      departmentId: engineeringDept.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const [employee1] = await db.insert(user).values({
      id: "emp-001",
      email: "john.doe@company.com",
      name: "John Doe",
      emailVerified: true,
      role: "employee",
      departmentId: salesDept.id,
      managerId: salesManager.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const [employee2] = await db.insert(user).values({
      id: "emp-002",
      email: "jane.smith@company.com",
      name: "Jane Smith",
      emailVerified: true,
      role: "employee",
      departmentId: engineeringDept.id,
      managerId: engManager.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const [employee3] = await db.insert(user).values({
      id: "emp-003",
      email: "bob.wilson@company.com",
      name: "Bob Wilson",
      emailVerified: true,
      role: "employee",
      departmentId: salesDept.id,
      managerId: salesManager.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Create vehicles
    console.log("Creating vehicles...");
    const vehiclesData = await db.insert(vehicles).values([
      {
        name: "Toyota Camry",
        type: "sedan",
        seats: 5,
        licensePlate: "ABC-1234",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"
      },
      {
        name: "Honda CR-V",
        type: "suv",
        seats: 7,
        licensePlate: "XYZ-5678",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop"
      },
      {
        name: "Ford Focus",
        type: "compact",
        seats: 5,
        licensePlate: "DEF-9012",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop"
      },
      {
        name: "Chevrolet Suburban",
        type: "large-suv",
        seats: 8,
        licensePlate: "GHI-3456",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop"
      },
      {
        name: "Toyota Hiace",
        type: "van",
        seats: 12,
        licensePlate: "JKL-7890",
        status: "available",
        imageUrl: "https://images.unsplash.com/photo-1570733117311-d990c3816c47?w=400&h=300&fit=crop"
      }
    ]).returning();

    // Create sample bookings
    console.log("Creating sample bookings...");
    
    // Approved booking
    const [booking1] = await db.insert(bookings).values({
      userId: employee1.id,
      vehicleId: vehiclesData[0].id,
      departureDate: getFutureDate(5),
      departureTime: "09:00",
      returnDate: getFutureDate(5),
      returnTime: "17:00",
      destination: "Client Office - Downtown",
      reason: "client-meeting",
      reasonDetails: "Quarterly business review with ABC Corp",
      status: "approved",
      numberOfDrivers: 1,
      numberOfCompanions: 2
    }).returning();

    await db.insert(bookingTravelers).values([
      { bookingId: booking1.id, name: "John Doe", type: "driver", isPrimary: true },
      { bookingId: booking1.id, name: "Sarah Johnson", type: "companion" },
      { bookingId: booking1.id, name: "Mike Chen", type: "companion" }
    ]);

    await db.insert(approvals).values([
      {
        bookingId: booking1.id,
        approverId: salesManager.id,
        approvalLevel: "manager",
        status: "approved",
        comments: "Approved for important client meeting"
      },
      {
        bookingId: booking1.id,
        approverId: hrManager.id,
        approvalLevel: "hr",
        status: "approved",
        comments: "All paperwork in order"
      }
    ]);

    // Pending HR approval
    const [booking2] = await db.insert(bookings).values({
      userId: employee2.id,
      vehicleId: vehiclesData[1].id,
      departureDate: getFutureDate(7),
      departureTime: "08:00",
      returnDate: getFutureDate(7),
      returnTime: "18:00",
      destination: "Conference Center",
      reason: "conference",
      reasonDetails: "Annual Tech Conference 2024",
      status: "pending_hr",
      numberOfDrivers: 1,
      numberOfCompanions: 3
    }).returning();

    await db.insert(bookingTravelers).values([
      { bookingId: booking2.id, name: "Jane Smith", type: "driver", isPrimary: true },
      { bookingId: booking2.id, name: "Tom Anderson", type: "companion" },
      { bookingId: booking2.id, name: "Lisa Wang", type: "companion" },
      { bookingId: booking2.id, name: "David Kim", type: "companion" }
    ]);

    await db.insert(approvals).values([
      {
        bookingId: booking2.id,
        approverId: engManager.id,
        approvalLevel: "manager",
        status: "approved",
        comments: "Team conference attendance approved"
      },
      {
        bookingId: booking2.id,
        approverId: hrManager.id,
        approvalLevel: "hr",
        status: "pending"
      }
    ]);

    // Pending manager approval
    const [booking3] = await db.insert(bookings).values({
      userId: employee3.id,
      vehicleId: vehiclesData[2].id,
      departureDate: getFutureDate(3),
      departureTime: "10:00",
      returnDate: getFutureDate(3),
      returnTime: "16:00",
      destination: "Airport",
      reason: "airport-transfer",
      reasonDetails: "Picking up visiting executive from headquarters",
      status: "pending_manager",
      numberOfDrivers: 1,
      numberOfCompanions: 0
    }).returning();

    await db.insert(bookingTravelers).values([
      { bookingId: booking3.id, name: "Bob Wilson", type: "driver", isPrimary: true }
    ]);

    await db.insert(approvals).values({
      bookingId: booking3.id,
      approverId: salesManager.id,
      approvalLevel: "manager",
      status: "pending"
    });

    // Rejected booking
    const [booking4] = await db.insert(bookings).values({
      userId: employee1.id,
      vehicleId: vehiclesData[3].id,
      departureDate: getFutureDate(10),
      departureTime: "09:00",
      returnDate: getFutureDate(12),
      returnTime: "17:00",
      destination: "Vacation Resort",
      reason: "other",
      reasonDetails: "Personal trip",
      status: "rejected",
      numberOfDrivers: 1,
      numberOfCompanions: 3
    }).returning();

    await db.insert(approvals).values({
      bookingId: booking4.id,
      approverId: salesManager.id,
      approvalLevel: "manager",
      status: "rejected",
      comments: "Company vehicles cannot be used for personal trips"
    });

    console.log("✅ Database seeded successfully!");
    console.log("\n📧 Test User Credentials:");
    console.log("Admin: admin@company.com / password123");
    console.log("HR Manager: hr@company.com / password123");
    console.log("Sales Manager: sales.manager@company.com / password123");
    console.log("Engineering Manager: eng.manager@company.com / password123");
    console.log("Employee (Sales): john.doe@company.com / password123");
    console.log("Employee (Engineering): jane.smith@company.com / password123");
    console.log("Employee (Sales): bob.wilson@company.com / password123");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seed };