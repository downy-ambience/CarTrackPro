import Navigation from "@/components/Navigation";
import VehicleSelector from "@/components/VehicleSelector";
import MaintenanceSection from "@/components/MaintenanceSection";
import VehicleEditModal from "@/components/VehicleEditModal";
import { useState } from "react";
import type { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Edit3, Car, Gauge, MapPin, Activity } from "lucide-react";

export default function VehicleManagement() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">앰비언스 차량 관리</h1>
          <p className="text-sm sm:text-base text-slate-400">차량 상태와 정비 기록을 관리하세요.</p>
        </div>

        <div className="mb-8">
          <VehicleSelector selectedVehicle={selectedVehicle} onVehicleSelect={setSelectedVehicle} />
        </div>

        {selectedVehicle && (
          <div className="space-y-6 animate-fade-in-delay-2">
            <div className="glass-card-static p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="icon-glow"><Car className="h-5 w-5 text-blue-500" /></div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">{selectedVehicle.model}</h2>
                    <p className="text-sm text-slate-400">{selectedVehicle.plateNumber}</p>
                  </div>
                </div>
                <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" /><span>차량 정보 수정</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <Activity className="w-4 h-4 text-green-500" />
                  <div><p className="text-xs text-slate-400">상태</p><p className="text-sm font-medium text-slate-700">{selectedVehicle.status === "available" ? "사용 가능" : "사용 중"}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <Gauge className="w-4 h-4 text-blue-500" />
                  <div><p className="text-xs text-slate-400">현재 주행거리</p><p className="text-sm font-medium text-slate-700">{selectedVehicle.currentMileage?.toLocaleString()} km</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <div><p className="text-xs text-slate-400">마지막 점검일</p><p className="text-sm font-medium text-slate-700">{selectedVehicle.lastCheckDate ? new Date(selectedVehicle.lastCheckDate).toLocaleDateString('ko-KR') : "미정"}</p></div>
                </div>
              </div>
            </div>
            <MaintenanceSection vehicle={selectedVehicle} />
          </div>
        )}

        <VehicleEditModal vehicle={selectedVehicle} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={(v) => setSelectedVehicle(v)} />
      </div>
    </div>
  );
}
