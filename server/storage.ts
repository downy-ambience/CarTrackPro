import { 
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
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vehicles
  getAllVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined>;

  // Drive Records
  getDriveRecord(id: string): Promise<DriveRecord | undefined>;
  getDriveRecordsByVehicle(vehicleId: string): Promise<DriveRecord[]>;
  getDriveRecordsByDriver(driverId: string): Promise<DriveRecord[]>;
  getAllDriveRecords(): Promise<DriveRecord[]>;
  createDriveRecord(record: InsertDriveRecord): Promise<DriveRecord>;
  updateDriveRecord(id: string, updates: UpdateDriveRecord): Promise<DriveRecord | undefined>;

  // Vehicle Photos
  getVehiclePhotosByDriveRecord(driveRecordId: string): Promise<VehiclePhoto[]>;
  createVehiclePhoto(photo: InsertVehiclePhoto): Promise<VehiclePhoto>;

  // Maintenance Records
  getMaintenanceRecordsByVehicle(vehicleId: string): Promise<MaintenanceRecord[]>;
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: string, updates: UpdateMaintenanceRecord): Promise<MaintenanceRecord | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vehicles: Map<string, Vehicle>;
  private driveRecords: Map<string, DriveRecord>;
  private vehiclePhotos: Map<string, VehiclePhoto>;
  private maintenanceRecords: Map<string, MaintenanceRecord>;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.driveRecords = new Map();
    this.vehiclePhotos = new Map();
    this.maintenanceRecords = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample user
    const user: User = {
      id: randomUUID(),
      username: "driver1",
      name: "김운전",
    };
    this.users.set(user.id, user);

    // Create sample vehicles
    const vehicle1: Vehicle = {
      id: randomUUID(),
      plateNumber: "12가 3456",
      model: "현대 아반떼",
      currentMileage: 45230,
      status: "available",
      lastCheckDate: new Date("2024-01-15"),
    };

    const vehicle2: Vehicle = {
      id: randomUUID(),
      plateNumber: "56나 7890",
      model: "기아 봉고",
      currentMileage: 67890,
      status: "available",
      lastCheckDate: new Date("2024-01-10"),
    };

    this.vehicles.set(vehicle1.id, vehicle1);
    this.vehicles.set(vehicle2.id, vehicle2);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Vehicles
  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id,
      status: insertVehicle.status || "available",
      currentMileage: insertVehicle.currentMileage || 0,
      lastCheckDate: insertVehicle.lastCheckDate || null
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    
    const updatedVehicle = { ...vehicle, ...updates };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  // Drive Records
  async getDriveRecord(id: string): Promise<DriveRecord | undefined> {
    return this.driveRecords.get(id);
  }

  async getDriveRecordsByVehicle(vehicleId: string): Promise<DriveRecord[]> {
    return Array.from(this.driveRecords.values()).filter(record => record.vehicleId === vehicleId);
  }

  async getDriveRecordsByDriver(driverId: string): Promise<DriveRecord[]> {
    return Array.from(this.driveRecords.values()).filter(record => record.driverId === driverId);
  }

  async getAllDriveRecords(): Promise<DriveRecord[]> {
    return Array.from(this.driveRecords.values()).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  async createDriveRecord(insertRecord: InsertDriveRecord): Promise<DriveRecord> {
    const id = randomUUID();
    const record: DriveRecord = { 
      ...insertRecord, 
      id,
      status: insertRecord.status || "in_progress",
      startTime: insertRecord.startTime || new Date(),
      endMileage: null,
      totalDistance: null,
      endTime: null,
      slackNotified: false,
    };
    this.driveRecords.set(id, record);
    return record;
  }

  async updateDriveRecord(id: string, updates: UpdateDriveRecord): Promise<DriveRecord | undefined> {
    const record = this.driveRecords.get(id);
    if (!record) return undefined;

    // Calculate total distance if endMileage is provided
    let calculatedUpdates = { ...updates };
    if (updates.endMileage && record.startMileage) {
      calculatedUpdates.totalDistance = updates.endMileage - record.startMileage;
    }

    const updatedRecord = { ...record, ...calculatedUpdates };
    this.driveRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Vehicle Photos
  async getVehiclePhotosByDriveRecord(driveRecordId: string): Promise<VehiclePhoto[]> {
    return Array.from(this.vehiclePhotos.values()).filter(photo => photo.driveRecordId === driveRecordId);
  }

  async createVehiclePhoto(insertPhoto: InsertVehiclePhoto): Promise<VehiclePhoto> {
    const id = randomUUID();
    const photo: VehiclePhoto = { 
      ...insertPhoto, 
      id,
      uploadedAt: new Date(),
    };
    this.vehiclePhotos.set(id, photo);
    return photo;
  }

  // Maintenance Records
  async getMaintenanceRecordsByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return Array.from(this.maintenanceRecords.values())
      .filter(record => record.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  }

  async createMaintenanceRecord(insertRecord: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const id = randomUUID();
    const record: MaintenanceRecord = { 
      ...insertRecord, 
      id,
      description: insertRecord.description || null,
      cost: insertRecord.cost || null,
      mileageAtService: insertRecord.mileageAtService || null,
      serviceDate: insertRecord.serviceDate || new Date(),
      nextServiceDate: insertRecord.nextServiceDate || null,
    };
    this.maintenanceRecords.set(id, record);
    return record;
  }

  async updateMaintenanceRecord(id: string, updates: UpdateMaintenanceRecord): Promise<MaintenanceRecord | undefined> {
    const record = this.maintenanceRecords.get(id);
    if (!record) return undefined;

    const updatedRecord = { ...record, ...updates };
    this.maintenanceRecords.set(id, updatedRecord);
    return updatedRecord;
  }
}

export const storage = new MemStorage();
