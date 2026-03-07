import { Link, useLocation } from "wouter";
import { Car, Bell, User, Users, FileSpreadsheet, Home, Settings, History, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType } from "@shared/schema";
import AmbienceLogo from "./AmbienceLogo";

export default function Navigation() {
  const [location] = useLocation();
  const [notificationCount] = useState(3);

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const currentUser = users[0];

  const navLinks = [
    { href: "/", label: "홈", icon: Home },
    { href: "/vehicle-management", label: "차량 관리", icon: Settings },
    { href: "/drive-history", label: "운행 기록", icon: History },
    { href: "/user-management", label: "운전자 관리", icon: Users },
    { href: "/google-sheets", label: "스프레드시트", icon: FileSpreadsheet },
  ];

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2">
              <AmbienceLogo className="h-6 w-auto sm:h-8" />
              <h1 className="text-sm sm:text-lg font-bold text-slate-800 hidden sm:block tracking-tight">
                앰비언스 차량관리 시스템
              </h1>
              <h1 className="text-sm font-bold text-slate-800 block sm:hidden">앰비언스</h1>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location === href
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                >
                  {label}
                  {location === href && (
                    <div className="h-0.5 mt-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <button
                className="relative text-slate-400 hover:text-slate-600 transition-colors hidden sm:block p-2 rounded-lg hover:bg-slate-50"
                title="알림"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium pulse-glow">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-600 hidden sm:block">
                  {currentUser ? currentUser.name : "로그인 필요"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-slate-100">
        <div className="flex justify-around items-center py-2 px-1">
          {navLinks.slice(0, 5).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-all ${location === href
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">{label.slice(0, 3)}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
