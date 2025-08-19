import { useQuery } from "@tanstack/react-query";
import { Car, Truck, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">차량 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">차량 선택</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vehicles?.map((vehicle) => (
          <Card
            key={vehicle.id}
            className={`p-6 hover:shadow-md transition-shadow cursor-pointer ${
              selectedVehicle?.id === vehicle.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onVehicleSelect(vehicle)}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    vehicle.model.includes("아반떼") ? "bg-blue-100" : "bg-orange-100"
                  }`}>
                    {vehicle.model.includes("아반떼") ? (
                      <Car className="text-primary text-xl" />
                    ) : (
                      <Truck className="text-orange-600 text-xl" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vehicle.plateNumber}</h3>
                    <p className="text-sm text-gray-500">{vehicle.model}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  vehicle.status === "available" ? "status-available" : "status-in-use"
                }`}>
                  <Circle className={`w-2 h-2 mr-1 ${
                    vehicle.status === "available" ? "text-green-400" : "text-red-400"
                  }`} fill="currentColor" />
                  {vehicle.status === "available" ? "사용 가능" : "사용 중"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">누적 주행거리</span>
                  <p className="font-semibold text-gray-900">{vehicle.currentMileage.toLocaleString()} km</p>
                </div>
                <div>
                  <span className="text-gray-500">마지막 점검</span>
                  <p className="font-semibold text-gray-900">
                    {vehicle.lastCheckDate ? new Date(vehicle.lastCheckDate).toLocaleDateString('ko-KR') : "미기록"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
