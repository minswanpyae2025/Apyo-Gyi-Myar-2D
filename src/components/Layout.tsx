import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, Users, CircleDollarSign, Trophy, FileText, UserPlus, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: "ပရိုဖိုင်များ", path: "/", icon: Users },
    { name: "ထီထိုးရန်", path: "/bets", icon: CircleDollarSign },
    { name: "ရလဒ်များ", path: "/results", icon: Trophy },
    { name: "မှတ်တမ်းများ", path: "/logs", icon: FileText },
    { name: "အက်ဒမင်များ", path: "/admins", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="font-bold text-xl text-blue-600 tracking-tight">အပျိုကြီးများ 2D</h1>
        <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white border-r z-40 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="font-bold text-xl text-blue-600 tracking-tight hidden md:block">အပျိုကြီးများ 2D</h1>
          <h1 className="font-bold text-xl text-blue-600 tracking-tight md:hidden">မီနူး</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-blue-700" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            ထွက်မည်
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
