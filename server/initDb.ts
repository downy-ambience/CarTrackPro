import { sqlite, saveDatabase } from "./db";
import { db } from "./db";
import { users, vehicles } from "@shared/schema";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");

    // Create tables using raw SQL for SQLite
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        plate_number TEXT NOT NULL UNIQUE,
        model TEXT NOT NULL,
        current_mileage INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'available',
        last_check_date TEXT
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS drive_records (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        driver_id TEXT NOT NULL REFERENCES users(id),
        start_mileage INTEGER NOT NULL,
        end_mileage INTEGER,
        total_distance INTEGER,
        purpose TEXT NOT NULL,
        destination TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        status TEXT NOT NULL DEFAULT 'in_progress',
        slack_notified INTEGER DEFAULT 0
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS vehicle_photos (
        id TEXT PRIMARY KEY,
        drive_record_id TEXT NOT NULL REFERENCES drive_records(id),
        photo_type TEXT NOT NULL,
        photo_path TEXT NOT NULL,
        uploaded_at TEXT NOT NULL
      )
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        type TEXT NOT NULL,
        description TEXT,
        cost INTEGER,
        mileage_at_service INTEGER,
        service_date TEXT NOT NULL,
        next_service_date TEXT
      )
    `);

    // Check if default user exists
    const existingUsers = db.select().from(users).all();
    if (existingUsers.length === 0) {
      console.log("Creating default user...");
      db.insert(users).values({
        username: "driver1",
        name: "김운전",
      }).run();
    }

    // Check if default vehicles exist
    const existingVehicles = db.select().from(vehicles).all();
    if (existingVehicles.length === 0) {
      console.log("Creating default vehicles...");
      db.insert(vehicles).values([
        {
          id: "fixed-tucson-id",
          plateNumber: "42너7839",
          model: "현대 투싼",
          currentMileage: 50000,
          status: "available",
          lastCheckDate: null,
        },
        {
          id: "fixed-starex-id",
          plateNumber: "74라7664",
          model: "현대 스타렉스",
          currentMileage: 75000,
          status: "available",
          lastCheckDate: null,
        }
      ]).run();
    }

    // Save the database after initialization
    saveDatabase();

    console.log("Database initialization complete");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}