import React, { useState, useEffect } from 'react';
import { 
  ServiceReminder, 
  Equipment, 
  User 
} from '../types/index.ts';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  RefreshCw, 
  Wrench, 
  Flame,
  CheckCircle2,
  Smartphone,
  Send,
  MessageSquare,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import { 
  getNotificationStatus, 
  requestNotificationPermission, 
  sendTestNotification, 
  sendDeviceNotification 
} from '../services/notifications.ts';

interface RemindersViewProps {
  reminders: ServiceReminder[];
  equipment: Equipment[];
  currentUser: User | null;
  onAcknowledgeReminder: (id: string) => Promise<void>;
  onTriggerScan: () => Promise<void>;
  onStartReportForEquipment: (eq: Equipment) => void;
  onNavigateToSchedule: () => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  equipment,
  currentUser,
  onAcknowledgeReminder,
  onTriggerScan,
  onStartReportForEquipment,
  onNavigateToSchedule,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [isUpdatingNotification, setIsUpdatingNotification] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notifSupported, setNotifSupported] = useState(true);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const status = getNotificationStatus();
    setNotifSupported(status.isSupported);
    setNotifPermission(status.permission);
  }, []);

  const handleEnableNotification = async () => {
    setIsUpdatingNotification(true);
    try {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        await sendTestNotification();
        setTestSent(true);
        setTimeout(() => setTestSent(false), 4000);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      alert('Gagal mengaktifkan notifikasi. Periksa izin notifikasi browser Anda.');
    } finally {
      setIsUpdatingNotification(false);
    }
  };

  const handleSendTest = async () => {
    setIsUpdatingNotification(true);
    try {
      const ok = await sendTestNotification();
      if (ok) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 4000);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Gagal mengirim notifikasi percobaan.');
    } finally {
      setIsUpdatingNotification(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await onTriggerScan();
      // If permission granted, notify user of findings
      if (notifPermission === 'granted') {
        const urgent = reminders.filter(
          (r) => r.status === 'pending' && (r.type === 'overdue' || r.type === '1_day')
        );
        if (urgent.length > 0) {
          sendDeviceNotification(
            '⚠️ Perhatian: Jadwal Maintenance Mendesak!',
            `Terdapat ${urgent.length} peralatan yang memerlukan tindakan perawatan segera.`,
            'maintenance-alert'
          );
        }
      }
    } catch {
      // The parent displays the API error.
    } finally {
      setIsScanning(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    setAcknowledgingId(id);
    try {
      await onAcknowledgeReminder(id);
    } catch {
      // The parent displays the API error.
    } finally {
      setAcknowledgingId(null);
    }
  };

  // WhatsApp Alert for a specific reminder
  const handleSendWhatsAppAlert = (rem: ServiceReminder) => {
    const isOverdue = rem.type === 'overdue' || rem.daysRemaining < 0;
    const urgency = isOverdue ? 'SUDAH TERLAMBAT' : `H-${rem.daysRemaining} JATUH TEMPO`;

    const text = `*PEMBERITAHUAN JADWAL SERVICE TEKNISI*
_${urgency}_

*Peralatan:* ${rem.equipmentName}
*Kategori:* ${rem.categoryName}
*Lokasi:* ${rem.location}
*Tanggal Jatuh Tempo:* ${rem.dueDate}
*Teknisi:* ${currentUser?.name || 'Irfan Rusmana'}

_Mohon segera dijadwalkan perawatan preventif untuk menjaga performa operasional._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filtered = reminders.filter((rem) => {
    if (filterType === 'all') return true;
    if (filterType === 'overdue') return rem.type === 'overdue' || rem.daysRemaining < 0;
    if (filterType === 'pending') return rem.status === 'pending';
    return rem.type === filterType;
  });

  const overdueCount = reminders.filter((r) => r.type === 'overdue' || r.daysRemaining < 0).length;
  const pendingCount = reminders.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-5 pb-20 lg:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sistem Pengingat Service & Perawatan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kalkulasi otomatis server-side untuk pengingat 7 hari, 3 hari, 1 hari, dan maintenance terlambat
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={isScanning}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 text-xs sm:text-sm shadow-md transition disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Memindai Jadwal...' : 'Pindai Jadwal Sekarang'}</span>
        </button>
      </div>

      {/* PUSH NOTIFICATION EXPLANATION & CONTROL BANNER */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-slate-900 rounded-2xl border border-sky-800/60 p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30">
                <Smartphone className="w-4 h-4" />
              </span>
              <span className="font-bold text-sm sm:text-base text-white">
                Push Notification Langsung di Layar HP
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                notifPermission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}>
                {notifPermission === 'granted' ? 'Notifikasi HP Aktif' : 'Belum Diizinkan di HP'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dengan Progressive Web App (PWA), teknisi <strong>tidak perlu selalu membuka aplikasi</strong>. Notifikasi sistem (H-7, H-3, H-1, dan Terlambat) dapat muncul langsung di bilah notifikasi HP (*status bar*) lengkap dengan getar dan suara.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {notifPermission !== 'granted' ? (
              <button
                onClick={handleEnableNotification}
                disabled={isUpdatingNotification}
                className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 text-xs sm:text-sm shadow-md transition active:scale-95 disabled:cursor-wait disabled:opacity-60"
              >
                <BellRing className={`w-4 h-4 ${isUpdatingNotification ? 'animate-pulse' : ''}`} />
                <span>{isUpdatingNotification ? 'Memproses...' : 'Izinkan Notifikasi di HP'}</span>
              </button>
            ) : (
              <button
                onClick={handleSendTest}
                disabled={isUpdatingNotification}
                className="flex items-center gap-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/40 text-sky-200 border border-sky-400/30 font-semibold px-3.5 py-2 text-xs sm:text-sm transition disabled:cursor-wait disabled:opacity-60"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{testSent ? 'Notifikasi Terkirim!' : 'Tes Notifikasi HP'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500 text-white shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700">{overdueCount}</div>
            <div className="text-xs font-semibold text-rose-900">Maintenance Terlambat (Overdue)</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{pendingCount}</div>
            <div className="text-xs font-semibold text-amber-900">Perlu Penanganan (Pending)</div>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200/80 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-600 text-white shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-sky-800">{reminders.length}</div>
            <div className="text-xs font-semibold text-sky-900">Total Pengingat Terdeteksi</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-sm flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({reminders.length})
        </button>
        <button
          onClick={() => setFilterType('pending')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterType === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Belum Ditangani ({pendingCount})
        </button>
        <button
          onClick={() => setFilterType('overdue')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterType === 'overdue' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Terlambat ({overdueCount})
        </button>
        <button
          onClick={() => setFilterType('1_day')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterType === '1_day' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          1 Hari Sebelum
        </button>
        <button
          onClick={() => setFilterType('3_days')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterType === '3_days' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          3 Hari Sebelum
        </button>
        <button
          onClick={() => setFilterType('7_days')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterType === '7_days' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          7 Hari Sebelum
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800">Semua Jadwal Service Aman!</div>
            <div className="text-xs text-slate-400 mt-1">
              Tidak ada pengingat service mendesak atau yang terlambat pada filter ini.
            </div>
          </div>
        ) : (
          filtered.map((rem) => {
            const isOverdue = rem.type === 'overdue' || rem.daysRemaining < 0;
            const targetEquipment = equipment.find((e) => e.id === rem.equipmentId);

            return (
              <div
                key={rem.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOverdue ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isOverdue
                        ? 'bg-rose-600 text-white'
                        : rem.type === '1_day'
                        ? 'bg-amber-500 text-white'
                        : rem.type === '3_days'
                        ? 'bg-blue-600 text-white'
                        : 'bg-sky-600 text-white'
                    }`}>
                      {isOverdue
                        ? 'TERLAMBAT'
                        : rem.type === '1_day'
                        ? 'H-1 JATUH TEMPO'
                        : rem.type === '3_days'
                        ? 'H-3 JATUH TEMPO'
                        : 'H-7 JATUH TEMPO'}
                    </span>

                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                      {rem.categoryName}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      rem.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rem.status === 'acknowledged'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rem.status === 'completed'
                        ? 'Selesai Servis'
                        : rem.status === 'acknowledged'
                        ? 'Telah Dikonfirmasi'
                        : 'Menunggu Tindakan'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {rem.equipmentName}
                  </h3>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Lokasi: <strong className="text-slate-800">{rem.location}</strong></span>
                    <span>•</span>
                    <span>Tanggal Jatuh Tempo: <strong className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}>{rem.dueDate}</strong></span>
                    <span>•</span>
                    <span>Teknisi Pelaksana: <strong className="text-sky-700">{currentUser?.name || 'Irfan Rusmana'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* WhatsApp Alert Button */}
                  <button
                    onClick={() => handleSendWhatsAppAlert(rem)}
                    className="p-2 rounded-xl border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition"
                    title="Kirim Peringatan Jadwal ini ke WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {rem.status === 'pending' && (
                    <button
                      onClick={() => handleAcknowledge(rem.id)}
                      disabled={acknowledgingId === rem.id}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60"
                      title="Tandai sudah dibaca"
                    >
                      {acknowledgingId === rem.id ? 'Menyimpan...' : 'Konfirmasi'}
                    </button>
                  )}

                  {targetEquipment && (
                    <button
                      onClick={() => onStartReportForEquipment(targetEquipment)}
                      className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3.5 py-2 text-xs transition shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Kerjakan Sekarang</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
