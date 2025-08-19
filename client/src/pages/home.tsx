import Navigation from "@/components/Navigation";
import VehicleSelector from "@/components/VehicleSelector";
import DriveRegistrationForm from "@/components/DriveRegistrationForm";
import PhotoCapture from "@/components/PhotoCapture";
import MaintenanceSection from "@/components/MaintenanceSection";
import { useState } from "react";
import type { Vehicle, DriveRecord } from "@shared/schema";

export default function Home() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentDriveRecord, setCurrentDriveRecord] = useState<DriveRecord | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Vehicle Selection */}
        <div className="mb-8">
          <VehicleSelector 
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
          />
        </div>

        {selectedVehicle && (
          <>
            {/* Drive Registration */}
            <div className="mb-8">
              <DriveRegistrationForm
                vehicle={selectedVehicle}
                driveRecord={currentDriveRecord}
                onDriveRecordUpdate={setCurrentDriveRecord}
              />
            </div>

            {/* Photo Capture */}
            {currentDriveRecord && (
              <div className="mb-8">
                <PhotoCapture
                  driveRecord={currentDriveRecord}
                  capturedPhotos={capturedPhotos}
                  onPhotoCaptured={setCapturedPhotos}
                />
              </div>
            )}

            {/* Maintenance Section */}
            <div className="mb-8">
              <MaintenanceSection vehicle={selectedVehicle} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
