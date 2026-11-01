import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Equipment, 
  EquipmentCategory, 
  ServiceSchedule, 
  ServiceReport, 
  ServiceReminder, 
  CompanySettings, 
  DashboardStats,
  UserProfileUpdate,
} from './types/index.ts';
import { api } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { EquipmentView } from './components/EquipmentView.tsx';
import { ScheduleView } from './components/ScheduleView.tsx';
import { ReportFormView } from './components/ReportFormView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { RemindersView } from './components/RemindersView.tsx';
import { ReportDetailModal } from './components/ReportDetailModal.tsx';
import { CompanySettingsModal } from './components/CompanySettingsModal.tsx';
import { ProfileSettingsModal } from './components/ProfileSettingsModal.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { LoadingOverlay } from './components/LoadingOverlay.tsx';
import { initialCompanySettings } from './server/seedData.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [company, setCompany] = useState<CompanySettings>(initialCompanySettings);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Prefill state for report form
  const [activeReportSchedule, setActiveReportSchedule] = useState<ServiceSchedule | null>(null);
  const [activeReportEquipment, setActiveReportEquipment] = useState<Equipment | null>(null);

  // Viewing detail modal state
  const [viewingReport, setViewingReport] = useState<ServiceReport | null>(null);
  const [showCompanySettings, setShowCompanySettings] = useState<boolean>(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Initial load
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const [
        curUserRes,
        catsRes,
        eqRes,
        schRes,
        repRes,
        remRes,
        compRes,
        statRes,
      ] = await Promise.allSettled([
        api.getCurrentUser(),
        api.getCategories(),
        api.getEquipment(),
        api.getSchedules(),
        api.getReports(),
        api.getReminders(),
        api.getCompanySettings(),
        api.getStats(),
      ]);

      if (curUserRes.status === 'fulfilled') setCurrentUser(curUserRes.value);
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value);
      if (eqRes.status === 'fulfilled') setEquipment(eqRes.value);
      if (schRes.status === 'fulfilled') setSchedules(schRes.value);
      if (repRes.status === 'fulfilled') setReports(repRes.value);
      if (remRes.status === 'fulfilled') setReminders(remRes.value);
      if (compRes.status === 'fulfilled') setCompany(compRes.value);
      if (statRes.status === 'fulfilled') setStats(statRes.value);
      const failedRequests = [
        curUserRes,
        catsRes,
        eqRes,
        schRes,
        repRes,
        remRes,
        compRes,
        statRes,
      ].filter((result) => result.status === 'rejected');
      if (failedRequests.length > 0) {
        setLoadError(`${failedRequests.length} bagian data gagal dimuat. Periksa koneksi, lalu coba muat ulang.`);
      }
    } catch (err) {
      console.error('Failed to load application data', err);
      setLoadError('Data aplikasi gagal dimuat. Periksa koneksi, lalu coba muat ulang.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const runWithLoading = async <T,>(label: string, action: () => Promise<T>): Promise<T> => {
    setPendingAction(label);
    try {
      return await action();
    } finally {
      setPendingAction(null);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Category CRUD
  const handleSaveCategory = async (data: Partial<EquipmentCategory>, isEdit: boolean) => {
    try {
      await runWithLoading(isEdit ? 'Menyimpan perubahan kategori...' : 'Menambahkan kategori...', async () => {
        if (isEdit && data.id) {
          await api.updateCategory(data.id, data);
        } else {
          await api.createCategory(data);
        }
        await loadAllData();
      });
    } catch (err: any) {
      alert(`Gagal menyimpan kategori: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await runWithLoading('Menghapus kategori...', async () => {
        await api.deleteCategory(id);
        await loadAllData();
      });
    } catch (err: any) {
      alert(`Gagal menghapus kategori: ${err.message}`);
      throw err;
    }
  };

  // Equipment CRUD
  const handleSaveEquipment = async (data: Partial<Equipment>, isEdit: boolean) => {
    try {
      await runWithLoading(isEdit ? 'Menyimpan perubahan peralatan...' : 'Menambahkan peralatan...', async () => {
        if (isEdit && data.id) {
          await api.updateEquipment(data.id, data);
        } else {
          await api.createEquipment(data);
        }
        await loadAllData();
      });
    } catch (err: any) {
      alert(`Gagal menyimpan data peralatan: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data peralatan ini?')) return;
    try {
      await runWithLoading('Menghapus peralatan...', async () => {
        await api.deleteEquipment(id);
        await loadAllData();
      });
    } catch (err: any) {
      alert(`Gagal menghapus peralatan: ${err.message}`);
      throw err;
    }
  };

  // Schedule CRUD
  const handleSaveSchedule = async (data: Partial<ServiceSchedule>, isEdit: boolean) => {
    try {
      await runWithLoading(isEdit ? 'Menyimpan perubahan jadwal...' : 'Membuat jadwal...', async () => {
        if (isEdit && data.id) {
          await api.updateSchedule(data.id, data);
        } else {
          await api.createSchedule(data);
        }
        await loadAllData();
      });
    } catch (err: any) {
      alert(`Gagal menyimpan jadwal: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    try {
      await runWithLoading('Menghapus jadwal...', async () => {
        await api.deleteSchedule(id);
        await loadAllData();
      });
    } catch (err: any) {
      alert(`Gagal menghapus jadwal: ${err.message}`);
      throw err;
    }
  };

  // Launch Report form pre-filled from schedule
  const handleStartReportFromSchedule = (schedule: ServiceSchedule) => {
    setActiveReportSchedule(schedule);
    setActiveReportEquipment(null);
    setActiveTab('reports');
  };

  // Launch Report form pre-filled from equipment
  const handleStartReportForEquipment = (eq: Equipment) => {
    setActiveReportEquipment(eq);
    setActiveReportSchedule(null);
    setActiveTab('reports');
  };

  // Submit Report
  const handleSubmitReport = async (reportPayload: Partial<ServiceReport>, isOffline: boolean) => {
    try {
      const created = await runWithLoading('Mengirim laporan...', async () => {
        const report = await api.createReport(reportPayload);
        await loadAllData();
        return report;
      });
      setActiveReportSchedule(null);
      setActiveReportEquipment(null);
      setViewingReport(created);
      setActiveTab('history');
      return created;
    } catch (err: any) {
      console.error('Failed to submit report', err);
      throw err;
    }
  };

  // Reminders Actions
  const handleAcknowledgeReminder = async (id: string) => {
    try {
      await runWithLoading('Memperbarui pengingat...', async () => {
        await api.acknowledgeReminder(id);
        const rems = await api.getReminders();
        setReminders(rems);
        const st = await api.getStats();
        setStats(st);
      });
    } catch (err: any) {
      alert(`Gagal mengonfirmasi pengingat: ${err.message}`);
      throw err;
    }
  };

  const handleTriggerReminderScan = async () => {
    try {
      await runWithLoading('Memindai jadwal...', async () => {
        await api.processReminders();
        await loadAllData();
      });
    } catch (err: any) {
      alert(`Gagal memindai jadwal: ${err.message}`);
      throw err;
    }
  };

  // Company settings save
  const handleSaveCompanySettings = async (data: Partial<CompanySettings>) => {
    try {
      const updated = await runWithLoading('Menyimpan pengaturan perusahaan...', () => api.updateCompanySettings(data));
      setCompany(updated);
    } catch (err: any) {
      alert(`Gagal menyimpan pengaturan perusahaan: ${err.message}`);
      throw err;
    }
  };

  const handleSaveProfile = async (data: UserProfileUpdate) => {
    if (!currentUser) throw new Error('Profil pengguna tidak ditemukan.');
    const updated = await runWithLoading('Menyimpan profil...', () =>
      api.updateUserProfile(currentUser.id, data)
    );
    setCurrentUser(updated);
  };

  const pendingRemindersCount = reminders.filter((r) => r.status === 'pending').length;
  const upcomingSchedulesCount = schedules.filter((s) => s.status !== 'Completed').length;

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-white font-bold text-sm tracking-wide">
            MEMUAT SISTEM MAINTENANCE...
          </div>
          <div className="text-slate-400 text-xs">
            PT Cahaya Perdana Nusantara
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        company={company}
        onOpenCompanySettings={() => setShowCompanySettings(true)}
        onOpenProfileSettings={() => setShowProfileSettings(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingRemindersCount={pendingRemindersCount}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar & Mobile Bottom Nav */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          pendingRemindersCount={pendingRemindersCount}
          upcomingSchedulesCount={upcomingSchedulesCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {loadError && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={loadAllData}
                disabled={isRefreshing}
                className="rounded-lg bg-amber-100 px-3 py-1.5 font-semibold hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"
              >
                {isRefreshing ? 'Memuat ulang...' : 'Muat ulang'}
              </button>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              schedules={schedules}
              reports={reports}
              reminders={reminders}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onSelectScheduleForReport={handleStartReportFromSchedule}
              onViewReport={setViewingReport}
            />
          )}

          {activeTab === 'equipment' && (
            <EquipmentView
              equipment={equipment}
              categories={categories}
              reports={reports}
              currentUser={currentUser}
              onSaveEquipment={handleSaveEquipment}
              onDeleteEquipment={handleDeleteEquipment}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              onStartReportForEquipment={handleStartReportForEquipment}
              onViewReport={setViewingReport}
            />
          )}

          {activeTab === 'schedules' && (
            <ScheduleView
              schedules={schedules}
              equipment={equipment}
              currentUser={currentUser}
              onSaveSchedule={handleSaveSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onStartReportFromSchedule={handleStartReportFromSchedule}
            />
          )}

          {activeTab === 'reports' && (
            <ReportFormView
              equipment={equipment}
              schedules={schedules}
              currentUser={currentUser}
              initialSchedule={activeReportSchedule}
              initialEquipment={activeReportEquipment}
              onSubmitReport={handleSubmitReport}
              onCancel={() => {
                setActiveReportSchedule(null);
                setActiveReportEquipment(null);
                setActiveTab('dashboard');
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              reports={reports}
              equipment={equipment}
              categories={categories}
              company={company}
              onViewReport={setViewingReport}
            />
          )}

          {activeTab === 'reminders' && (
            <RemindersView
              reminders={reminders}
              equipment={equipment}
              currentUser={currentUser}
              onAcknowledgeReminder={handleAcknowledgeReminder}
              onTriggerScan={handleTriggerReminderScan}
              onStartReportForEquipment={handleStartReportForEquipment}
              onNavigateToSchedule={() => setActiveTab('schedules')}
            />
          )}
        </main>
      </div>

      {/* Floating Offline & Outbox Sync Indicator */}
      <OfflineIndicator />

      {/* Modal: Full Report Details with PDF & WhatsApp */}
      {viewingReport && (
        <ReportDetailModal
          report={viewingReport}
          company={company}
          onClose={() => setViewingReport(null)}
        />
      )}

      {/* Modal: Company Settings */}
      {showCompanySettings && (
        <CompanySettingsModal
          company={company}
          onSave={handleSaveCompanySettings}
          onClose={() => setShowCompanySettings(false)}
        />
      )}
      {showProfileSettings && currentUser && (
        <ProfileSettingsModal
          user={currentUser}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
      {pendingAction && <LoadingOverlay label={pendingAction} />}
    </div>
  );
}
