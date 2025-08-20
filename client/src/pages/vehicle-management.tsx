import Navigation from "@/components/Navigation";
import VehicleSelector from "@/components/VehicleSelector";
import MaintenanceSection from "@/components/MaintenanceSection";
import VehicleEditModal from "@/components/VehicleEditModal";
import { useState } from "react";
import type { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Edit3, Car } from "lucide-react";

export default function VehicleManagement() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">앰비언스 차량 관리</h1>
          <p className="text-sm sm:text-base text-gray-600">차량 상태와 정비 기록을 관리하세요.</p>
        </div>

        <div className="mb-8">
          <VehicleSelector 
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
          />
        </div>

        {selectedVehicle && (
          <div className="space-y-6">
            {/* Vehicle Info Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedVehicle.model}
                    </h2>
                    <p className="text-gray-500">{selectedVehicle.plateNumber}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>차량 정보 수정</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">상태</span>
                  <p className="font-medium">
                    {selectedVehicle.status === "available" ? "사용 가능" : "사용 중"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">현재 주행거리</span>
                  <p className="font-medium">{selectedVehicle.currentMileage?.toLocaleString()} km</p>
                </div>
                <div>
                  <span className="text-gray-500">마지막 점검일</span>
                  <p className="font-medium">
                    {selectedVehicle.lastCheckDate 
                      ? new Date(selectedVehicle.lastCheckDate).toLocaleDateString('ko-KR')
                      : "미정"
                    }
                  </p>
                </div>
              </div>
            </div>

            <MaintenanceSection vehicle={selectedVehicle} />
          </div>
        )}

        {/* Vehicle Edit Modal */}
        <VehicleEditModal
          vehicle={selectedVehicle}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updatedVehicle) => {
            setSelectedVehicle(updatedVehicle);
          }}
        />
      </div>
    </div>
  );
}
