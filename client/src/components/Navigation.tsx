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
    <>
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-16">
            <div className="flex items-center space-x-2">
              <Car className="text-primary text-lg sm:text-2xl" />
              <h1 className="text-sm sm:text-xl font-bold text-gray-900 hidden sm:block">차량 관리 시스템</h1>
              <h1 className="text-sm font-bold text-gray-900 block sm:hidden">CarTrack</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <Link href="/" className={`text-xs lg:text-sm font-medium transition-colors ${location === "/" ? "text-primary" : "text-gray-700 hover:text-gray-900"}`}>
                홈
              </Link>
              <Link href="/vehicle-management" className={`text-xs lg:text-sm font-medium transition-colors ${location === "/vehicle-management" ? "text-primary" : "text-gray-700 hover:text-gray-900"}`}>
                차량 관리
              </Link>
              <Link href="/drive-history" className={`text-xs lg:text-sm font-medium transition-colors ${location === "/drive-history" ? "text-primary" : "text-gray-700 hover:text-gray-900"}`}>
                운행 기록
              </Link>
              <Link href="/user-management" className={`text-xs lg:text-sm font-medium transition-colors ${location === "/user-management" ? "text-primary" : "text-gray-700 hover:text-gray-900"}`}>
                운전자 관리
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* 알림 버튼 - 모바일에서 숨김 */}
              <button 
                className="relative text-gray-500 hover:text-gray-700 transition-colors hidden sm:block"
                title="알림"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center text-[10px] sm:text-xs">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              
              {/* 사용자 프로필 */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <User className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:block">
                  {currentUser ? currentUser.name : "로그인 필요"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 하단 네비게이션 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-2">
          <Link href="/" className={`flex flex-col items-center py-1 px-2 ${location === "/" ? "text-primary" : "text-gray-600"}`}>
            <Car className="w-5 h-5 mb-1" />
            <span className="text-xs">홈</span>
          </Link>
          <Link href="/vehicle-management" className={`flex flex-col items-center py-1 px-2 ${location === "/vehicle-management" ? "text-primary" : "text-gray-600"}`}>
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span className="text-xs">차량</span>
          </Link>
          <Link href="/drive-history" className={`flex flex-col items-center py-1 px-2 ${location === "/drive-history" ? "text-primary" : "text-gray-600"}`}>
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs">운행</span>
          </Link>
          <Link href="/user-management" className={`flex flex-col items-center py-1 px-2 ${location === "/user-management" ? "text-primary" : "text-gray-600"}`}>
            <Users className="w-5 h-5 mb-1" />
            <span className="text-xs">운전자</span>
          </Link>
          <button className="flex flex-col items-center py-1 px-2 text-gray-600 relative">
            <Bell className="w-5 h-5 mb-1" />
            <span className="text-xs">알림</span>
            {notificationCount > 0 && (
              <span className="absolute top-0 right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
