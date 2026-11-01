import React from 'react';
import { 
  DashboardStats, 
  ServiceSchedule, 
  ServiceReport, 
  ServiceReminder, 
  User 
} from '../types/index.ts';
import { 
  Cpu, 
  CalendarClock, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Bell, 
  ArrowRight, 
  PlusCircle, 
  FileText, 
  Share2, 
  Download,
  Flame,
  Wrench
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  schedules: ServiceSchedule[];
  reports: ServiceReport[];
  reminders: ServiceReminder[];
  currentUser: User | null;
  onNavigate: (tab: string) => void;
  onSelectScheduleForReport: (schedule: ServiceSchedule) => void;
  onViewReport: (report: ServiceReport) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  schedules,
  reports,
  reminders,
  currentUser,
  onNavigate,
  onSelectScheduleForReport,
  onViewReport,
}) => {
  const isTechnician = currentUser?.role === 'technician';

  // Filter schedules assigned or upcoming
  const upcomingSchedules = schedules
    .filter((s) => s.status !== 'Completed')
    .slice(0, 4);

  const recentReports = reports.slice(0, 4);
  const urgentReminders = reminders.filter((r) => r.status === 'pending').slice(0, 3);

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-radial from-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              Internal Maintenance System
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Halo, {currentUser?.name || 'Irfan Rusmana'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Aplikasi kerja teknisi: atur kategori & peralatan, kelola jadwal maintenance, catat hasil service, dan unggah foto dokumentasi langsung dari perangkat Anda.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2.5 text-xs sm:text-sm transition shadow-lg shadow-sky-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Laporan Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overdue Alert banner if any */}
      {(stats?.overdueMaintenance ?? 0) > 0 && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-100">
                Perhatian: {stats?.overdueMaintenance} Peralatan Melewati Batas Jadwal Maintenance!
              </div>
              <div className="text-xs text-rose-300">
                Peralatan memerlukan perawatan segera untuk mencegah kerusakan operasional fasilitas.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('reminders')}
            className="shrink-0 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition"
          >
            Lihat Reminder
          </button>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Peralatan */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Peralatan</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.totalEquipment || 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {stats?.activeEquipment || 0} unit aktif
          </div>
        </div>

        {/* Card 2: Pekerjaan Bulan Ini */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pekerjaan Bulan Ini</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.jobsThisMonth || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Jadwal terdaftar
          </div>
        </div>

        {/* Card 3: Selesai */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Selesai Service</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats?.completedJobsThisMonth || 0}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Laporan terbit
          </div>
        </div>

        {/* Card 4: Jadwal Mendatang */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Jadwal Mendatang</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.upcomingSchedules || 0}
          </div>
          <div className="text-[11px] text-sky-600 font-medium mt-1">
            Antrian pekerjaan
          </div>
        </div>

        {/* Card 5: Terlambat */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Terlambat</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${
            (stats?.overdueMaintenance ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {stats?.overdueMaintenance || 0}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Perlu penanganan
          </div>
        </div>

        {/* Card 6: Pending Reminders */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Reminder Aktif</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats?.pendingReminders || 0}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Pengingat otomatis
          </div>
        </div>
      </div>

      {/* Main Content Sections: Jadwal Mendatang & Laporan Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Jadwal Maintenance Terdekat */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <CalendarClock className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Jadwal Maintenance Mendatang
              </h2>
            </div>
            <button
              onClick={() => onNavigate('schedules')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>Semua Jadwal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1">
            {upcomingSchedules.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada jadwal maintenance yang tertunda saat ini.
              </div>
            ) : (
              upcomingSchedules.map((sch) => (
                <div key={sch.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {sch.equipmentName}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sch.priority === 'Emergency'
                          ? 'bg-rose-100 text-rose-700'
                          : sch.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sch.priority}
                      </span>
                      <span className="text-[10px] bg-sky-50 text-sky-700 font-medium px-2 py-0.5 rounded-full">
                        {sch.jobType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{sch.location}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">
                        {sch.scheduledDate} ({sch.scheduledTime || '09:00'})
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Teknisi: <strong className="text-slate-600">{sch.technicianName}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectScheduleForReport(sch)}
                    className="shrink-0 flex items-center gap-1 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-1.5 rounded-xl transition"
                    title="Mulai pekerjaan dan buat laporan"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lapor</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Laporan Service Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Laporan Service Terakhir
              </h2>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Riwayat Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1">
            {recentReports.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada laporan service yang dibuat.
              </div>
            ) : (
              recentReports.map((rep) => (
                <div key={rep.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                        {rep.reportNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {rep.equipmentName}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 line-clamp-1">
                      {rep.actionTaken}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{rep.jobDate}</span>
                      <span>•</span>
                      <span>Teknisi: {rep.technicianName}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">{rep.photos?.length || 0} foto</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewReport(rep)}
                    className="shrink-0 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl transition"
                  >
                    Buka Detail
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Urgent Reminders Section */}
      {urgentReminders.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Pengingat Jadwal Maintenance Mendatang & Terlambat
              </h2>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Semua Pengingat ({reminders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgentReminders.map((rem) => {
              const isOverdue = rem.type === 'overdue' || rem.daysRemaining < 0;
              return (
                <div
                  key={rem.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isOverdue
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full ${
                      isOverdue ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {isOverdue ? 'TERLAMBAT' : `${rem.daysRemaining} HARI LAGI`}
                    </span>
                    <span className="text-slate-500">Jatuh tempo: {rem.dueDate}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 line-clamp-1">
                    {rem.equipmentName}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Lokasi: {rem.location}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
