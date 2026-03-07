import { useQuery } from "@tanstack/react-query";
import { Car, Truck, MapPin, Gauge } from "lucide-react";
import type { Vehicle } from "@shared/schema";

interface VehicleSelectorProps {
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle) => void;
}

export default function VehicleSelector({ selectedVehicle, onVehicleSelect }: VehicleSelectorProps) {
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  if (isLoading) {
    return (
      <div className="mb-8 animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-500" />
          내 차량 상태
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card-static h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-fade-in-delay-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-500" />
          내 차량 상태
        </h2>
        <span className="text-sm text-slate-400">{vehicles?.length || 0}대 등록</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {vehicles?.map((vehicle) => {
          const isSelected = selectedVehicle?.id === vehicle.id;
          const isTucson = vehicle.model.includes("투싼");

          return (
            <div
              key={vehicle.id}
              className={`glass-card gradient-accent cursor-pointer p-5 ${isSelected ? "glow-ring" : ""
                }`}
              onClick={() => onVehicleSelect(vehicle)}
            >
              <div className="flex items-center justify-between mb-4 pt-1">
                <div className="flex items-center gap-3">
                  <div className={`icon-glow ${isTucson ? "" : "orange"}`}>
                    {isTucson ? (
                      <Car className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Truck className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">{vehicle.model}</h3>
                    <p className="text-sm text-slate-400">{vehicle.plateNumber}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${vehicle.status === "available" ? "status-available" : "status-in-use"
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${vehicle.status === "available" ? "bg-green-500" : "bg-red-500"
                    }`} />
                  {vehicle.status === "available" ? "사용 가능" : "사용 중"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">누적 주행거리</p>
                    <p className="text-sm font-semibold text-slate-700">{vehicle.currentMileage.toLocaleString()} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">마지막 점검</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {vehicle.lastCheckDate
                        ? new Date(vehicle.lastCheckDate).toLocaleDateString('ko-KR')
                        : "미기록"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
