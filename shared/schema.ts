import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plateNumber: text("plate_number").notNull().unique(),
  model: text("model").notNull(),
  currentMileage: integer("current_mileage").notNull().default(0),
  status: text("status").notNull().default("available"), // available, in_use
  lastCheckDate: timestamp("last_check_date"),
});

// Drive records table
export const driveRecords = pgTable("drive_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  startMileage: integer("start_mileage").notNull(),
  endMileage: integer("end_mileage"),
  totalDistance: integer("total_distance"),
  purpose: text("purpose").notNull(),
  destination: text("destination").notNull(),
  startTime: timestamp("start_time").notNull().default(sql`now()`),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("in_progress"), // in_progress, completed
  slackNotified: boolean("slack_notified").default(false),
});

// Vehicle photos table
export const vehiclePhotos = pgTable("vehicle_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driveRecordId: varchar("drive_record_id").notNull().references(() => driveRecords.id),
  photoType: text("photo_type").notNull(), // exterior-front, exterior-back, etc.
  photoPath: text("photo_path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
});

// Maintenance records table
export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id),
  type: text("type").notNull(), // oil_change, repair, inspection, etc.
  description: text("description"),
  cost: integer("cost"),
  mileageAtService: integer("mileage_at_service"),
  serviceDate: timestamp("service_date").notNull().default(sql`now()`),
  nextServiceDate: timestamp("next_service_date"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true });
export const insertDriveRecordSchema = createInsertSchema(driveRecords).omit({ 
  id: true, 
  totalDistance: true, 
  endTime: true, 
  slackNotified: true 
});
export const insertVehiclePhotoSchema = createInsertSchema(vehiclePhotos).omit({ id: true, uploadedAt: true });
export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({ id: true });

// Update schemas
export const updateDriveRecordSchema = createInsertSchema(driveRecords).omit({ 
  id: true, 
  vehicleId: true, 
  driverId: true, 
  startTime: true 
}).partial().extend({
  endTime: z.string().transform((str) => new Date(str)).optional(),
});

export const updateMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({ 
  id: true,
  vehicleId: true 
}).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type DriveRecord = typeof driveRecords.$inferSelect;
export type InsertDriveRecord = z.infer<typeof insertDriveRecordSchema>;
export type UpdateDriveRecord = z.infer<typeof updateDriveRecordSchema>;

export type VehiclePhoto = typeof vehiclePhotos.$inferSelect;
export type InsertVehiclePhoto = z.infer<typeof insertVehiclePhotoSchema>;

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type UpdateMaintenanceRecord = z.infer<typeof updateMaintenanceRecordSchema>;
