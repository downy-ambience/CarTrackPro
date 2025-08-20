import { db } from "./db";
import { users, vehicles } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Check if default user exists
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("Creating default user...");
      await db.insert(users).values({
        username: "driver1",
        name: "김운전",
      });
    }

    // Check if default vehicles exist
    const existingVehicles = await db.select().from(vehicles);
    if (existingVehicles.length === 0) {
      console.log("Creating default vehicles...");
      await db.insert(vehicles).values([
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
      ]);
    }

    console.log("Database initialization complete");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}