import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Equipment, 
  EquipmentCategory, 
  ServiceSchedule, 
  ServiceReport, 
  ServiceReminder, 
  CompanySettings, 
  DashboardStats 
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
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
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

  // Prefill state for report form
  const [activeReportSchedule, setActiveReportSchedule] = useState<ServiceSchedule | null>(null);
  const [activeReportEquipment, setActiveReportEquipment] = useState<Equipment | null>(null);

  // Viewing detail modal state
  const [viewingReport, setViewingReport] = useState<ServiceReport | null>(null);
  const [showCompanySettings, setShowCompanySettings] = useState<boolean>(false);

  // Initial load
  const loadAllData = useCallback(async () => {
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
    } catch (err) {
      console.error('Failed to load application data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Category CRUD (Managed directly by Technician Irfan)
  const handleSaveCategory = async (data: Partial<EquipmentCategory>, isEdit: boolean) => {
    try {
      if (isEdit && data.id) {
        await api.updateCategory(data.id, data);
      } else {
        await api.createCategory(data);
      }
      await loadAllData();
    } catch (err: any) {
      alert(`Gagal menyimpan kategori: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      await loadAllData();
    } catch (err: any) {
      alert(`Gagal menghapus kategori: ${err.message}`);
    }
  };

  // Equipment CRUD
  const handleSaveEquipment = async (data: Partial<Equipment>, isEdit: boolean) => {
    try {
      if (isEdit && data.id) {
        await api.updateEquipment(data.id, data);
      } else {
        await api.createEquipment(data);
      }
      await loadAllData();
    } catch (err: any) {
      alert(`Gagal menyimpan data peralatan: ${err.message}`);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data peralatan ini?')) return;
    try {
      await api.deleteEquipment(id);
      await loadAllData();
    } catch (err: any) {
      alert(`Gagal menghapus peralatan: ${err.message}`);
    }
  };

  // Schedule CRUD
  const handleSaveSchedule = async (data: Partial<ServiceSchedule>, isEdit: boolean) => {
    try {
      if (isEdit && data.id) {
        await api.updateSchedule(data.id, data);
      } else {
        await api.createSchedule(data);
      }
      await loadAllData();
    } catch (err: any) {
      alert(`Gagal menyimpan jadwal: ${err.message}`);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    try {
      await api.deleteSchedule(id);
      await loadAllData();
    } catch (err: any) {
      alert(`Gagal menghapus jadwal: ${err.message}`);
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
      const created = await api.createReport(reportPayload);
      await loadAllData();
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
      await api.acknowledgeReminder(id);
      const rems = await api.getReminders();
      setReminders(rems);
      const st = await api.getStats();
      setStats(st);
    } catch (err: any) {
      alert(`Gagal mengonfirmasi pengingat: ${err.message}`);
    }
  };

  const handleTriggerReminderScan = async () => {
    try {
      await api.processReminders();
      await loadAllData();
    } catch (err: any) {
      alert(`Gagal memindai jadwal: ${err.message}`);
    }
  };

  // Company settings save
  const handleSaveCompanySettings = async (data: Partial<CompanySettings>) => {
    try {
      const updated = await api.updateCompanySettings(data);
      setCompany(updated);
    } catch (err: any) {
      alert(`Gagal menyimpan pengaturan perusahaan: ${err.message}`);
    }
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
    </div>
  );
}
