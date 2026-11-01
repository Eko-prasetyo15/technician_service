import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  CalendarClock, 
  FileText, 
  History, 
  Bell, 
  Users, 
  PlusCircle, 
  CheckCircle2,
  HardHat
} from 'lucide-react';
import { User } from '../types/index.ts';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  pendingRemindersCount: number;
  upcomingSchedulesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  pendingRemindersCount,
  upcomingSchedulesCount,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'equipment',
      label: 'Data Peralatan',
      icon: Cpu,
      badge: null,
    },
    {
      id: 'schedules',
      label: 'Jadwal Maintenance',
      icon: CalendarClock,
      badge: upcomingSchedulesCount > 0 ? upcomingSchedulesCount : null,
      badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-400/30',
    },
    {
      id: 'reports',
      label: 'Buat Laporan',
      icon: PlusCircle,
      highlight: true,
      badge: 'Baru',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30',
    },
    {
      id: 'history',
      label: 'Riwayat Service',
      icon: History,
      badge: null,
    },
    {
      id: 'reminders',
      label: 'Pengingat Service',
      icon: Bell,
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
  ];

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 min-h-[calc(100vh-4rem)] p-4 text-slate-300">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Menu Navigasi
        </div>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition text-left ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 font-semibold'
                    : item.highlight
                    ? 'bg-slate-800/80 text-sky-300 hover:bg-slate-800 hover:text-white border border-sky-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Current user card footer */}
        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-sky-400 shrink-0">
              <HardHat className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser?.specialization}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Thumb friendly for technicians) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-slate-400 shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'equipment' ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Alat</span>
        </button>

        {/* Center Prominent "Buat Laporan" Button */}
        <button
          onClick={() => setActiveTab('reports')}
          className="flex flex-col items-center -mt-5"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition active:scale-95 ${
            activeTab === 'reports'
              ? 'bg-emerald-500 shadow-emerald-500/30'
              : 'bg-sky-500 shadow-sky-500/30'
          }`}>
            <PlusCircle className="w-6 h-6 text-slate-950" />
          </div>
          <span className="text-[10px] mt-1 font-semibold text-slate-200">Lapor</span>
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`relative flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'schedules' ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <CalendarClock className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Jadwal</span>
          {upcomingSchedulesCount > 0 && (
            <span className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-sky-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'history' ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Riwayat</span>
        </button>
      </div>
    </>
  );
};
