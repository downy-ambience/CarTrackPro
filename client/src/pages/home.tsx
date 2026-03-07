import Navigation from "@/components/Navigation";
import VehicleSelector from "@/components/VehicleSelector";
import DriveRegistrationForm from "@/components/DriveRegistrationForm";
import MaintenanceSection from "@/components/MaintenanceSection";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle, DriveRecord, User } from "@shared/schema";

export default function Home() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentDriveRecord, setCurrentDriveRecord] = useState<DriveRecord | null>(null);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  const currentUser = users[0];

  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
            안녕하세요, {currentUser?.name || "운전자"}님 👋
          </h1>
          <p className="text-sm sm:text-base text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {dateStr} · 오늘도 안전 운행 하세요
          </p>
        </div>

        <VehicleSelector
          selectedVehicle={selectedVehicle}
          onVehicleSelect={setSelectedVehicle}
        />

        {selectedVehicle && (
          <div className="mb-8 animate-fade-in-delay-2">
            <DriveRegistrationForm
              vehicle={selectedVehicle}
              driveRecord={currentDriveRecord}
              onDriveRecordUpdate={setCurrentDriveRecord}
            />
          </div>
        )}

        {selectedVehicle && (
          <div className="animate-fade-in-delay-3">
            <MaintenanceSection vehicle={selectedVehicle} />
          </div>
        )}
      </div>
    </div>
  );
}
