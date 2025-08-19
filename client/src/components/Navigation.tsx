import { Link, useLocation } from "wouter";
import { Car, Bell, User } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Car className="text-primary text-2xl" />
            <h1 className="text-xl font-bold text-gray-900">차량 관리 시스템</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="/" className={`text-sm font-medium transition-colors ${location === "/" ? "text-primary" : "text-gray-700 hover:text-gray-900"}`}>
              홈
            </Link>
            <Link href="/vehicle-management" className={`text-sm font-medium transition-colors ${location === "/vehicle-management" ? "text-primary" : "text-gray-700 hover:text-gray-900"}`}>
              차량 관리
            </Link>
            <Link href="/drive-history" className={`text-sm font-medium transition-colors ${location === "/drive-history" ? "text-primary" : "text-gray-700 hover:text-gray-900"}`}>
              운행 기록
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <User className="w-6 h-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">김운전</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
