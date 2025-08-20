import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  vehicles, 
  driveRecords, 
  vehiclePhotos, 
  maintenanceRecords,
  type User, 
  type InsertUser,
  type Vehicle,
  type InsertVehicle,
  type DriveRecord,
  type InsertDriveRecord,
  type UpdateDriveRecord,
  type VehiclePhoto,
  type InsertVehiclePhoto,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type UpdateMaintenanceRecord,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // Users
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Vehicles
  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const result = await db.insert(vehicles).values(insertVehicle).returning();
    return result[0];
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();
    return result[0];
  }

  // Drive Records
  async getDriveRecord(id: string): Promise<DriveRecord | undefined> {
    const result = await db.select().from(driveRecords).where(eq(driveRecords.id, id));
    return result[0];
  }

  async getDriveRecordsByVehicle(vehicleId: string): Promise<DriveRecord[]> {
    return await db.select().from(driveRecords).where(eq(driveRecords.vehicleId, vehicleId));
  }

  async getDriveRecordsByDriver(driverId: string): Promise<DriveRecord[]> {
    return await db.select().from(driveRecords).where(eq(driveRecords.driverId, driverId));
  }

  async getAllDriveRecords(): Promise<DriveRecord[]> {
    return await db.select().from(driveRecords);
  }

  async createDriveRecord(insertRecord: InsertDriveRecord): Promise<DriveRecord> {
    const result = await db.insert(driveRecords).values(insertRecord).returning();
    return result[0];
  }

  async updateDriveRecord(id: string, updates: UpdateDriveRecord): Promise<DriveRecord | undefined> {
    const result = await db.update(driveRecords).set(updates).where(eq(driveRecords.id, id)).returning();
    return result[0];
  }

  // Vehicle Photos
  async getVehiclePhotosByDriveRecord(driveRecordId: string): Promise<VehiclePhoto[]> {
    return await db.select().from(vehiclePhotos).where(eq(vehiclePhotos.driveRecordId, driveRecordId));
  }

  async createVehiclePhoto(insertPhoto: InsertVehiclePhoto): Promise<VehiclePhoto> {
    const result = await db.insert(vehiclePhotos).values(insertPhoto).returning();
    return result[0];
  }

  // Maintenance Records
  async getMaintenanceRecordsByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.vehicleId, vehicleId));
  }

  async createMaintenanceRecord(insertRecord: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const result = await db.insert(maintenanceRecords).values(insertRecord).returning();
    return result[0];
  }

  async updateMaintenanceRecord(id: string, updates: UpdateMaintenanceRecord): Promise<MaintenanceRecord | undefined> {
    const result = await db.update(maintenanceRecords).set(updates).where(eq(maintenanceRecords.id, id)).returning();
    return result[0];
  }
}