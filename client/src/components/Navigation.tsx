import { Link, useLocation } from "wouter";
import { Car, Bell, User, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType } from "@shared/schema";

export default function Navigation() {
  const [location] = useLocation();
  const [notificationCount] = useState(3); // 임시 알림 개수
  
  // 현재 사용자 정보 가져오기 (첫 번째 등록된 사용자를 현재 사용자로 가정)
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });
  
  const currentUser = users[0]; // 첫 번째 사용자를 현재 사용자로 가정

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
            <Link href="/user-management" className={`text-sm font-medium transition-colors ${location === "/user-management" ? "text-primary" : "text-gray-700 hover:text-gray-900"}`}>
              운전자 관리
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* 알림 버튼 */}
            <button 
              className="relative text-gray-500 hover:text-gray-700 transition-colors"
              title="알림"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            
            {/* 사용자 프로필 */}
            <div className="flex items-center space-x-2">
              <User className="w-6 h-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {currentUser ? currentUser.name : "로그인 필요"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
