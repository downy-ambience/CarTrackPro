import Navigation from "@/components/Navigation";
import DriveHistory from "@/components/DriveHistory";

export default function DriveHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">운행 기록</h1>
          <p className="text-gray-600">모든 차량의 운행 기록과 통계를 확인하세요.</p>
        </div>

        <DriveHistory showTitle={false} />
      </div>
    </div>
  );
}
