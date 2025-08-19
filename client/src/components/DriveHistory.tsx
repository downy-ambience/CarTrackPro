import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Filter, Search, Construction, TrendingUp, Route, Fuel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DriveRecord, Vehicle, User } from "@shared/schema";

interface DriveHistoryProps {
  showTitle?: boolean;
}

export default function DriveHistory({ showTitle = true }: DriveHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: driveRecords, isLoading } = useQuery<DriveRecord[]>({
    queryKey: ["/api/drive-records"],
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
  });

  // Calculate statistics
  const completedRecords = driveRecords?.filter(record => record.status === "completed") || [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyRecords = completedRecords.filter(record => {
    const recordDate = new Date(record.startTime);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });

  const monthlyTotal = monthlyRecords.reduce((sum, record) => sum + (record.totalDistance || 0), 0);
  const dailyAverage = monthlyRecords.length > 0 ? Math.round(monthlyTotal / new Date().getDate()) : 0;
  const totalTrips = monthlyRecords.length;
  const fuelEfficiency = 12.5; // Mock data for fuel efficiency

  const getVehicleInfo = (vehicleId: string) => {
    return vehicles?.find(v => v.id === vehicleId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-completed">완료</span>;
      case "in_progress":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-in-progress">진행중</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {showTitle && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <History className="text-primary mr-2" />
            운행 기록
          </h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-32"
              />
            </div>
            <Button size="sm" variant="outline">
              <Filter className="w-4 h-4 mr-1" />
              필터
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">이번 달 총 운행</p>
                <p className="text-2xl font-bold text-blue-900">{monthlyTotal.toLocaleString()} km</p>
              </div>
              <Construction className="text-blue-500 text-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">평균 일일 운행</p>
                <p className="text-2xl font-bold text-green-900">{dailyAverage} km</p>
              </div>
              <TrendingUp className="text-green-500 text-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">총 운행 횟수</p>
                <p className="text-2xl font-bold text-purple-900">{totalTrips}회</p>
              </div>
              <Route className="text-purple-500 text-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">연료 효율</p>
                <p className="text-2xl font-bold text-orange-900">{fuelEfficiency} km/L</p>
              </div>
              <Fuel className="text-orange-500 text-xl" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left font-medium text-gray-900 pb-3">날짜</th>
                  <th className="text-left font-medium text-gray-900 pb-3">차량</th>
                  <th className="text-left font-medium text-gray-900 pb-3">운전자</th>
                  <th className="text-left font-medium text-gray-900 pb-3">운행거리</th>
                  <th className="text-left font-medium text-gray-900 pb-3">목적</th>
                  <th className="text-left font-medium text-gray-900 pb-3">목적지</th>
                  <th className="text-left font-medium text-gray-900 pb-3">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {driveRecords?.map((record) => {
                  const vehicle = getVehicleInfo(record.vehicleId);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="py-3 text-gray-900">
                        {new Date(record.startTime).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3 text-gray-900">
                        {vehicle?.plateNumber || '알 수 없음'}
                      </td>
                      <td className="py-3 text-gray-900">
                        {currentUser?.name || '김운전'}
                      </td>
                      <td className="py-3 text-gray-900">
                        {record.totalDistance ? `${record.totalDistance.toLocaleString()} km` : '-'}
                      </td>
                      <td className="py-3 text-gray-900">{record.purpose}</td>
                      <td className="py-3 text-gray-900">{record.destination}</td>
                      <td className="py-3">
                        {getStatusBadge(record.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {!driveRecords?.length && (
              <div className="text-center py-8 text-gray-500">
                운행 기록이 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
