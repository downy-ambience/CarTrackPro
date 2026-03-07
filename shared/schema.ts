import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
});

// Vehicles table
export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  plateNumber: text("plate_number").notNull().unique(),
  model: text("model").notNull(),
  currentMileage: integer("current_mileage").notNull().default(0),
  status: text("status").notNull().default("available"), // available, in_use
  lastCheckDate: text("last_check_date"),
});

// Drive records table
export const driveRecords = sqliteTable("drive_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id),
  driverId: text("driver_id").notNull().references(() => users.id),
  startMileage: integer("start_mileage").notNull(),
  endMileage: integer("end_mileage"),
  totalDistance: integer("total_distance"),
  purpose: text("purpose").notNull(),
  destination: text("destination").notNull(),
  startTime: text("start_time").notNull().$defaultFn(() => new Date().toISOString()),
  endTime: text("end_time"),
  status: text("status").notNull().default("in_progress"), // in_progress, completed
  slackNotified: integer("slack_notified", { mode: "boolean" }).default(false),
});

// Vehicle photos table
export const vehiclePhotos = sqliteTable("vehicle_photos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  driveRecordId: text("drive_record_id").notNull().references(() => driveRecords.id),
  photoType: text("photo_type").notNull(), // exterior-front, exterior-back, etc.
  photoPath: text("photo_path").notNull(),
  uploadedAt: text("uploaded_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Maintenance records table
export const maintenanceRecords = sqliteTable("maintenance_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id),
  type: text("type").notNull(), // oil_change, repair, inspection, etc.
  description: text("description"),
  cost: integer("cost"),
  mileageAtService: integer("mileage_at_service"),
  serviceDate: text("service_date").notNull().$defaultFn(() => new Date().toISOString()),
  nextServiceDate: text("next_service_date"),
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
}).partial();

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
