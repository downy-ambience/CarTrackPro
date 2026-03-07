import { eq, desc } from "drizzle-orm";
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
    return db.select().from(users).all();
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = db.select().from(users).where(eq(users.id, id)).all();
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = db.select().from(users).where(eq(users.username, username)).all();
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    db.insert(users).values({ ...insertUser, id }).run();
    return db.select().from(users).where(eq(users.id, id)).get()!;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    db.update(users).set(updates).where(eq(users.id, id)).run();
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  // Vehicles
  async getAllVehicles(): Promise<Vehicle[]> {
    return db.select().from(vehicles).all();
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return db.select().from(vehicles).where(eq(vehicles.id, id)).get();
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = crypto.randomUUID();
    db.insert(vehicles).values({ ...insertVehicle, id }).run();
    return db.select().from(vehicles).where(eq(vehicles.id, id)).get()!;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    db.update(vehicles).set(updates).where(eq(vehicles.id, id)).run();
    return db.select().from(vehicles).where(eq(vehicles.id, id)).get();
  }

  // Drive Records
  async getDriveRecord(id: string): Promise<DriveRecord | undefined> {
    return db.select().from(driveRecords).where(eq(driveRecords.id, id)).get();
  }

  async getDriveRecordsByVehicle(vehicleId: string): Promise<DriveRecord[]> {
    return db.select().from(driveRecords).where(eq(driveRecords.vehicleId, vehicleId)).all();
  }

  async getDriveRecordsByDriver(driverId: string): Promise<DriveRecord[]> {
    return db.select().from(driveRecords).where(eq(driveRecords.driverId, driverId)).all();
  }

  async getAllDriveRecords(): Promise<DriveRecord[]> {
    return db.select().from(driveRecords).orderBy(desc(driveRecords.startTime)).all();
  }

  async createDriveRecord(insertRecord: InsertDriveRecord): Promise<DriveRecord> {
    const id = crypto.randomUUID();
    const startTime = insertRecord.startTime || new Date().toISOString();
    db.insert(driveRecords).values({
      ...insertRecord,
      id,
      startTime,
      status: insertRecord.status || "in_progress",
    }).run();
    return db.select().from(driveRecords).where(eq(driveRecords.id, id)).get()!;
  }

  async updateDriveRecord(id: string, updates: UpdateDriveRecord): Promise<DriveRecord | undefined> {
    const record = db.select().from(driveRecords).where(eq(driveRecords.id, id)).get();
    if (!record) return undefined;

    // Calculate total distance if endMileage is provided
    const calculatedUpdates: any = { ...updates };
    if (updates.endMileage && record.startMileage) {
      calculatedUpdates.totalDistance = updates.endMileage - record.startMileage;
    }

    db.update(driveRecords).set(calculatedUpdates).where(eq(driveRecords.id, id)).run();
    return db.select().from(driveRecords).where(eq(driveRecords.id, id)).get();
  }

  // Vehicle Photos
  async getVehiclePhotosByDriveRecord(driveRecordId: string): Promise<VehiclePhoto[]> {
    return db.select().from(vehiclePhotos).where(eq(vehiclePhotos.driveRecordId, driveRecordId)).all();
  }

  async createVehiclePhoto(insertPhoto: InsertVehiclePhoto): Promise<VehiclePhoto> {
    const id = crypto.randomUUID();
    const uploadedAt = new Date().toISOString();
    db.insert(vehiclePhotos).values({ ...insertPhoto, id, uploadedAt }).run();
    return db.select().from(vehiclePhotos).where(eq(vehiclePhotos.id, id)).get()!;
  }

  // Maintenance Records
  async getMaintenanceRecordsByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return db.select().from(maintenanceRecords)
      .where(eq(maintenanceRecords.vehicleId, vehicleId))
      .orderBy(desc(maintenanceRecords.serviceDate))
      .all();
  }

  async createMaintenanceRecord(insertRecord: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const id = crypto.randomUUID();
    const serviceDate = insertRecord.serviceDate || new Date().toISOString();
    db.insert(maintenanceRecords).values({ ...insertRecord, id, serviceDate }).run();
    return db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id)).get()!;
  }

  async updateMaintenanceRecord(id: string, updates: UpdateMaintenanceRecord): Promise<MaintenanceRecord | undefined> {
    db.update(maintenanceRecords).set(updates).where(eq(maintenanceRecords.id, id)).run();
    return db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id)).get();
  }
}