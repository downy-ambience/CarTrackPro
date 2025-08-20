import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertDriveRecordSchema,
  updateDriveRecordSchema,
  insertVehiclePhotoSchema,
  insertMaintenanceRecordSchema,
  updateMaintenanceRecordSchema,
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { sendDriveRecordNotification, sendMaintenanceNotification } from "./slack";

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "사용자 목록을 가져오는데 실패했습니다" });
    }
  });

  app.get("/api/users/current", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Return first user as current user for now
      if (users.length > 0) {
        res.json(users[0]);
      } else {
        res.status(404).json({ error: "사용자가 없습니다" });
      }
    } catch (error) {
      console.error("Error getting current user:", error);
      res.status(500).json({ error: "현재 사용자 정보를 가져오는데 실패했습니다" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "사용자 생성에 실패했습니다" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "사용자 정보 업데이트에 실패했습니다" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error getting vehicles:", error);
      res.status(500).json({ error: "차량 목록을 가져오는데 실패했습니다" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "차량을 찾을 수 없습니다" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error getting vehicle:", error);
      res.status(500).json({ error: "차량 정보를 가져오는데 실패했습니다" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.updateVehicle(req.params.id, req.body);
      if (!vehicle) {
        return res.status(404).json({ error: "차량을 찾을 수 없습니다" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ error: "차량 정보 업데이트에 실패했습니다" });
    }
  });

  // Drive record routes
  app.get("/api/drive-records", async (req, res) => {
    try {
      const { vehicleId, driverId } = req.query;
      
      let records;
      if (vehicleId) {
        records = await storage.getDriveRecordsByVehicle(vehicleId as string);
      } else if (driverId) {
        records = await storage.getDriveRecordsByDriver(driverId as string);
      } else {
        records = await storage.getAllDriveRecords();
      }
      
      res.json(records);
    } catch (error) {
      console.error("Error getting drive records:", error);
      res.status(500).json({ error: "운행 기록을 가져오는데 실패했습니다" });
    }
  });

  app.get("/api/drive-records/:id", async (req, res) => {
    try {
      const record = await storage.getDriveRecord(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "운행 기록을 찾을 수 없습니다" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error getting drive record:", error);
      res.status(500).json({ error: "운행 기록을 가져오는데 실패했습니다" });
    }
  });

  app.post("/api/drive-records", async (req, res) => {
    try {
      const validatedData = insertDriveRecordSchema.parse(req.body);
      const record = await storage.createDriveRecord(validatedData);
      
      // Update vehicle status to in_use
      await storage.updateVehicle(validatedData.vehicleId, { status: "in_use" });
      
      // Send Slack notification for new drive record
      const vehicle = await storage.getVehicle(validatedData.vehicleId);
      const driver = await storage.getUser(validatedData.driverId);
      
      if (vehicle && driver) {
        await sendDriveRecordNotification(record, vehicle, driver);
        await storage.updateDriveRecord(record.id, { slackNotified: true });
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error creating drive record:", error);
      res.status(500).json({ error: "운행 기록 생성에 실패했습니다" });
    }
  });

  app.patch("/api/drive-records/:id", async (req, res) => {
    try {
      const validatedData = updateDriveRecordSchema.parse(req.body);
      const record = await storage.updateDriveRecord(req.params.id, validatedData);
      
      if (!record) {
        return res.status(404).json({ error: "운행 기록을 찾을 수 없습니다" });
      }

      // If completing the drive, update vehicle status and mileage
      if (validatedData.status === "completed" && validatedData.endMileage) {
        await storage.updateVehicle(record.vehicleId, { 
          status: "available",
          currentMileage: validatedData.endMileage,
        });

        // Send completion Slack notification
        const vehicle = await storage.getVehicle(record.vehicleId);
        const driver = await storage.getUser(record.driverId);
        
        if (vehicle && driver && !record.slackNotified) {
          await sendDriveRecordNotification(record, vehicle, driver);
          await storage.updateDriveRecord(record.id, { slackNotified: true });
        }
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error updating drive record:", error);
      res.status(500).json({ error: "운행 기록 업데이트에 실패했습니다" });
    }
  });

  // Vehicle photos routes
  app.get("/api/drive-records/:driveRecordId/photos", async (req, res) => {
    try {
      const photos = await storage.getVehiclePhotosByDriveRecord(req.params.driveRecordId);
      res.json(photos);
    } catch (error) {
      console.error("Error getting photos:", error);
      res.status(500).json({ error: "사진을 가져오는데 실패했습니다" });
    }
  });

  app.post("/api/vehicle-photos", async (req, res) => {
    try {
      const validatedData = insertVehiclePhotoSchema.parse(req.body);
      const photo = await storage.createVehiclePhoto(validatedData);
      res.json(photo);
    } catch (error) {
      console.error("Error creating vehicle photo:", error);
      res.status(500).json({ error: "사진 기록 생성에 실패했습니다" });
    }
  });

  // Maintenance records routes
  app.get("/api/vehicles/:vehicleId/maintenance", async (req, res) => {
    try {
      const records = await storage.getMaintenanceRecordsByVehicle(req.params.vehicleId);
      res.json(records);
    } catch (error) {
      console.error("Error getting maintenance records:", error);
      res.status(500).json({ error: "정비 기록을 가져오는데 실패했습니다" });
    }
  });

  app.post("/api/maintenance-records", async (req, res) => {
    try {
      const validatedData = insertMaintenanceRecordSchema.parse(req.body);
      const record = await storage.createMaintenanceRecord(validatedData);
      
      // Update vehicle's last check date to the service date
      await storage.updateVehicle(validatedData.vehicleId, {
        lastCheckDate: validatedData.serviceDate || new Date()
      });
      
      // Send Slack notification for maintenance
      const vehicle = await storage.getVehicle(validatedData.vehicleId);
      if (vehicle) {
        await sendMaintenanceNotification(
          vehicle, 
          validatedData.type || "정비", 
          validatedData.description || "정비 작업 완료"
        );
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error creating maintenance record:", error);
      res.status(500).json({ error: "정비 기록 생성에 실패했습니다" });
    }
  });

  app.patch("/api/maintenance-records/:id", async (req, res) => {
    try {
      const validatedData = updateMaintenanceRecordSchema.parse(req.body);
      const record = await storage.updateMaintenanceRecord(req.params.id, validatedData);
      
      if (!record) {
        return res.status(404).json({ error: "정비 기록을 찾을 수 없습니다" });
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      res.status(500).json({ error: "정비 기록 업데이트에 실패했습니다" });
    }
  });

  // Object storage routes for photo uploads
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "업로드 URL 생성에 실패했습니다" });
    }
  });

  app.put("/api/vehicle-photo-upload", async (req, res) => {
    try {
      if (!req.body.photoURL) {
        return res.status(400).json({ error: "photoURL이 필요합니다" });
      }

      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.photoURL);
      res.json({ objectPath });
    } catch (error) {
      console.error("Error processing photo upload:", error);
      res.status(500).json({ error: "사진 업로드 처리에 실패했습니다" });
    }
  });

  // Vehicle photos CRUD endpoints
  app.post("/api/vehicle-photos", async (req, res) => {
    try {
      const validatedData = insertVehiclePhotoSchema.parse(req.body);
      const photo = await storage.createVehiclePhoto(validatedData);
      res.json(photo);
    } catch (error) {
      console.error("Error creating vehicle photo:", error);
      res.status(500).json({ error: "차량 사진 저장에 실패했습니다" });
    }
  });

  app.get("/api/drive-records/:id/photos", async (req, res) => {
    try {
      const photos = await storage.getVehiclePhotosByDriveRecord(req.params.id);
      res.json(photos);
    } catch (error) {
      console.error("Error getting vehicle photos:", error);
      res.status(500).json({ error: "차량 사진을 가져오는데 실패했습니다" });
    }
  });

  // Users route (for getting default user)
  app.get("/api/users/current", async (req, res) => {
    try {
      // For simplicity, return the first user (in production, use proper authentication)
      const user = await storage.getUserByUsername("driver1");
      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error getting current user:", error);
      res.status(500).json({ error: "사용자 정보를 가져오는데 실패했습니다" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
