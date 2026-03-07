import Navigation from "@/components/Navigation";
import DriveHistory from "@/components/DriveHistory";

export default function DriveHistoryPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">앰비언스 운행 기록</h1>
          <p className="text-sm sm:text-base text-slate-400">모든 차량의 운행 기록과 통계를 확인하세요.</p>
        </div>
        <DriveHistory showTitle={false} />
      </div>
    </div>
  );
}
