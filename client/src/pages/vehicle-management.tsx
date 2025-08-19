import Navigation from "@/components/Navigation";
import VehicleSelector from "@/components/VehicleSelector";
import MaintenanceSection from "@/components/MaintenanceSection";
import { useState } from "react";
import type { Vehicle } from "@shared/schema";

export default function VehicleManagement() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">차량 관리</h1>
          <p className="text-gray-600">차량 상태와 정비 기록을 관리하세요.</p>
        </div>

        <div className="mb-8">
          <VehicleSelector 
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
          />
        </div>

        {selectedVehicle && (
          <MaintenanceSection vehicle={selectedVehicle} />
        )}
      </div>
    </div>
  );
}
