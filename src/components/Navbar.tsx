import React, { useState } from 'react';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Bell,
  Settings,
  UserRound,
} from 'lucide-react';
import { User, CompanySettings } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

interface NavbarProps {
  currentUser: User | null;
  company: CompanySettings | null;
  onOpenCompanySettings: () => void;
  onOpenProfileSettings: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingRemindersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  company,
  onOpenCompanySettings,
  onOpenProfileSettings,
  activeTab,
  setActiveTab,
  pendingRemindersCount,
}) => {
  const { isOnline, pendingQueueCount, isSyncing, triggerSync } = useOnlineStatus();

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 text-left group"
          >
            <img
              src="/K3.svg"
              alt="Logo K3"
              className="h-10 w-10 rounded-xl object-contain shadow-lg shadow-slate-950/20 transition group-hover:scale-105"
            />
            <div>
              <div className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight flex items-center gap-1.5">
                <span>TECH SERVICE</span>
                <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-1.5 py-0.2 rounded">
                  PWA
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium truncate max-w-[140px] sm:max-w-[220px]">
                {company?.companyName || 'PT Cahaya Perdana Nusantara'}
              </div>
            </div>
          </button>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online / Offline status badge */}
          <div className="hidden md:flex items-center">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-full">
                <WifiOff className="w-3 h-3 text-amber-400" />
                Offline
              </span>
            )}
          </div>

          {/* Pending Sync Icon Button */}
          {pendingQueueCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-xs bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2.5 py-1.5 rounded-lg hover:bg-sky-500/30 transition"
              title="Ada draf/laporan offline yang perlu disinkronkan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-medium">{pendingQueueCount} antrian</span>
            </button>
          )}

          {/* Reminder Bell shortcut */}
          <button
            onClick={() => setActiveTab('reminders')}
            className={`relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition ${
              activeTab === 'reminders' ? 'bg-slate-800 text-sky-400' : ''
            }`}
            title="Pengingat Service"
          >
            <Bell className="w-5 h-5" />
            {pendingRemindersCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                {pendingRemindersCount}
              </span>
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* Company Settings Button */}
          <button
            onClick={onOpenCompanySettings}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 transition"
            title="Pengaturan Profil Perusahaan & Kop Surat PDF"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Technician Profile Card */}
          <button
            type="button"
            onClick={onOpenProfileSettings}
            className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5 text-xs sm:text-sm hover:bg-slate-800 transition"
            title="Edit profil"
          >
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center overflow-hidden">
              {currentUser?.profileImageUrl ? (
                <img src={currentUser.profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="w-4 h-4" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                <span>{currentUser?.name || 'Irfan Rusmana'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-[10px] text-sky-300 font-medium">
                {currentUser?.specialization || 'Teknisi Maintenance'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
