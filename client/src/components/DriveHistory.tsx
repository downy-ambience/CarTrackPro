import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Filter, Search, TrendingUp, Route, Fuel, Activity, Calendar, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DriveRecord, Vehicle, User } from "@shared/schema";

interface DriveHistoryProps { showTitle?: boolean; }

export default function DriveHistory({ showTitle = true }: DriveHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");

  const { data: driveRecords, isLoading } = useQuery<DriveRecord[]>({ queryKey: ["/api/drive-records"] });
  const { data: vehicles } = useQuery<Vehicle[]>({ queryKey: ["/api/vehicles"] });
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/users/current"] });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // 차량별 필터링된 레코드
  const filteredByVehicle = driveRecords?.filter(r =>
    selectedVehicleId === "all" ? true : r.vehicleId === selectedVehicleId
  ) || [];

  // 검색어 필터링
  const filteredRecords = filteredByVehicle.filter(r => {
    if (!searchTerm) return true;
    const vehicle = vehicles?.find(v => v.id === r.vehicleId);
    const term = searchTerm.toLowerCase();
    return (
      vehicle?.plateNumber?.toLowerCase().includes(term) ||
      r.purpose?.toLowerCase().includes(term) ||
      r.destination?.toLowerCase().includes(term)
    );
  });

  const completedRecords = filteredRecords.filter(r => r.status === "completed");
  const monthlyRecords = completedRecords.filter(r => {
    const d = new Date(r.startTime);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyTotal = monthlyRecords.reduce((s, r) => s + (r.totalDistance || 0), 0);
  const dailyAverage = monthlyRecords.length > 0 ? Math.round(monthlyTotal / new Date().getDate()) : 0;
  const totalTrips = monthlyRecords.length;

  const getVehicleInfo = (id: string) => vehicles?.find(v => v.id === id);
  const getStatusBadge = (status: string) => {
    if (status === "completed") return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium status-completed">완료</span>;
    if (status === "in_progress") return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium status-in-progress">진행중</span>;
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{status}</span>;
  };

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="glass-card-static h-24 animate-pulse" />)}</div>
      <div className="glass-card-static h-64 animate-pulse" />
    </div>
  );

  const stats = [
    { label: "이번 달 총 운행", value: `${monthlyTotal.toLocaleString()} km`, icon: Activity, cardClass: "stat-card-blue", iconColor: "text-blue-500" },
    { label: "평균 일일 운행", value: `${dailyAverage} km`, icon: TrendingUp, cardClass: "stat-card-green", iconColor: "text-green-500" },
    { label: "총 운행 횟수", value: `${totalTrips}회`, icon: Route, cardClass: "stat-card-purple", iconColor: "text-purple-500" },
    { label: "연료 효율", value: "12.5 km/L", icon: Fuel, cardClass: "stat-card-amber", iconColor: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-blue-500" />운행 기록</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-32 text-sm" />
            </div>
            <Button size="sm" variant="outline"><Filter className="w-4 h-4 mr-1" />필터</Button>
          </div>
        </div>
      )}

      {/* 차량별 탭 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedVehicleId("all")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedVehicleId === "all"
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
        >
          <Car className="w-3.5 h-3.5" />
          전체
          <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${selectedVehicleId === "all" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
            }`}>
            {driveRecords?.length || 0}
          </span>
        </button>

        {vehicles?.map(vehicle => {
          const count = driveRecords?.filter(r => r.vehicleId === vehicle.id).length || 0;
          const isActive = selectedVehicleId === vehicle.id;
          return (
            <button
              key={vehicle.id}
              onClick={() => setSelectedVehicleId(vehicle.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
                }`}
            >
              <Car className="w-3.5 h-3.5" />
              {vehicle.plateNumber}
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* 검색창 (showTitle이 false일 때도 보이게) */}
        {!showTitle && (
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-40 text-sm"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, cardClass, iconColor }) => (
          <div key={label} className={`${cardClass} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                <p className="text-xl font-bold text-slate-800">{value}</p>
              </div>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card-static p-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="dark-table">
            <thead><tr><th>날짜</th><th>차량</th><th>운전자</th><th>운행거리</th><th>목적</th><th>목적지</th><th>상태</th></tr></thead>
            <tbody>
              {filteredRecords.map(record => {
                const vehicle = getVehicleInfo(record.vehicleId);
                return (
                  <tr key={record.id}>
                    <td className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" />{new Date(record.startTime).toLocaleDateString('ko-KR')}</td>
                    <td>{vehicle?.plateNumber || '알 수 없음'}</td>
                    <td>{currentUser?.name || '김운전'}</td>
                    <td className="font-medium">{record.totalDistance ? `${record.totalDistance.toLocaleString()} km` : '-'}</td>
                    <td>{record.purpose}</td>
                    <td>{record.destination}</td>
                    <td>{getStatusBadge(record.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filteredRecords.length && (
            <div className="text-center py-12 text-slate-400">
              <Route className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>{selectedVehicleId === "all" ? "운행 기록이 없습니다" : "이 차량의 운행 기록이 없습니다"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
