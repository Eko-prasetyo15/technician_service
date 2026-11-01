import React, { useState } from 'react';
import { 
  ServiceSchedule, 
  Equipment, 
  User, 
  JobType, 
  ScheduleStatus, 
  SchedulePriority 
} from '../types/index.ts';
import { 
  CalendarClock, 
  Plus, 
  List, 
  Calendar as CalendarIcon, 
  Wrench, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  Trash2, 
  X,
  User as UserIcon,
  Filter
} from 'lucide-react';

interface ScheduleViewProps {
  schedules: ServiceSchedule[];
  equipment: Equipment[];
  currentUser: User | null;
  onSaveSchedule: (data: Partial<ServiceSchedule>, isEdit: boolean) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
  onStartReportFromSchedule: (schedule: ServiceSchedule) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  equipment,
  currentUser,
  onSaveSchedule,
  onDeleteSchedule,
  onStartReportFromSchedule,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ServiceSchedule | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<ServiceSchedule>>({
    title: '',
    equipmentId: equipment[0]?.id || '',
    technicianId: 'usr-irfan',
    technicianName: 'Irfan',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    jobType: 'Preventive Maintenance',
    priority: 'Medium',
    status: 'Scheduled',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    const firstEq = equipment[0];
    setFormData({
      title: firstEq ? `Perawatan Rutin ${firstEq.name}` : 'Maintenance Rutin',
      equipmentId: firstEq?.id || '',
      technicianId: 'usr-irfan',
      technicianName: 'Irfan',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      jobType: 'Preventive Maintenance',
      priority: 'Medium',
      status: 'Scheduled',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sch: ServiceSchedule) => {
    setEditingSchedule(sch);
    setFormData({
      title: sch.title,
      equipmentId: sch.equipmentId,
      technicianId: sch.technicianId,
      scheduledDate: sch.scheduledDate,
      scheduledTime: sch.scheduledTime,
      jobType: sch.jobType,
      priority: sch.priority,
      status: sch.status,
      notes: sch.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.equipmentId || !formData.scheduledDate) {
      alert('Judul, peralatan, dan tanggal wajib diisi.');
      return;
    }

    const eq = equipment.find((e) => e.id === formData.equipmentId);

    await onSaveSchedule(
      {
        ...formData,
        equipmentName: eq?.name || '',
        location: eq?.location || '',
        technicianId: 'usr-irfan',
        technicianName: 'Irfan',
        ...(editingSchedule ? { id: editingSchedule.id } : {}),
      },
      !!editingSchedule
    );
    setShowModal(false);
  };

  // Filter schedules
  const filtered = schedules.filter((sch) => {
    if (selectedStatus !== 'all' && sch.status !== selectedStatus) return false;
    return true;
  });

  // Calendar group by date
  const calendarDates: { [date: string]: ServiceSchedule[] } = {};
  filtered.forEach((sch) => {
    if (!calendarDates[sch.scheduledDate]) {
      calendarDates[sch.scheduledDate] = [];
    }
    calendarDates[sch.scheduledDate].push(sch);
  });
  const sortedDates = Object.keys(calendarDates).sort();

  return (
    <div className="space-y-5 pb-20 lg:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Jadwal Maintenance & Pekerjaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Pengaturan tugas teknisi, jadwal preventif berkala, dan perbaikan fasilitas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 text-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-2 text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Jadwal</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter:</span>
        </div>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="py-1.5 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          <option value="all">Semua Status</option>
          <option value="Scheduled">Scheduled (Terjadwal)</option>
          <option value="In Progress">In Progress (Sedang Dikerjakan)</option>
          <option value="Completed">Completed (Selesai)</option>
        </select>

      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Tidak ada jadwal ditemukan</div>
              <div className="text-xs text-slate-400 mt-1">Buat jadwal baru untuk menjadwalkan pekerjaan teknisi.</div>
            </div>
          ) : (
            filtered.map((sch) => {
              const isDone = sch.status === 'Completed';
              return (
                <div
                  key={sch.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDone ? 'border-slate-200/60 bg-slate-50/60' : 'border-slate-200/90 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        sch.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sch.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {sch.status}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                        {sch.jobType}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sch.priority === 'Emergency'
                          ? 'bg-rose-100 text-rose-700'
                          : sch.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        Prioritas {sch.priority}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {sch.title}
                    </h3>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Wrench className="w-3.5 h-3.5 text-sky-600" />
                        <span>{sch.equipmentName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sch.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Teknisi: <strong className="text-slate-700">{sch.technicianName}</strong></span>
                      </div>
                    </div>

                    {sch.notes && (
                      <p className="text-xs text-slate-500 italic mt-1">
                        "{sch.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <div className="text-right mr-2 hidden sm:block">
                      <div className="text-xs font-bold text-slate-900">{sch.scheduledDate}</div>
                      <div className="text-[11px] text-slate-500">{sch.scheduledTime || '09:00'} WIB</div>
                    </div>

                    {!isDone ? (
                      <button
                        onClick={() => onStartReportFromSchedule(sch)}
                        className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3.5 py-2 text-xs transition shadow-sm"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Kerjakan & Lapor</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Laporan Terbit</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sch)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit Jadwal"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSchedule(sch.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Tidak ada jadwal pada kalender</div>
            </div>
          ) : (
            sortedDates.map((dateStr) => {
              const items = calendarDates[dateStr];
              const dateObj = new Date(dateStr);
              const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={dateStr} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                    <CalendarIcon className="w-4 h-4 text-sky-600" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 capitalize">
                      {dateFormatted}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
                      {items.length} pekerjaan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((sch) => (
                      <div
                        key={sch.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-600">{sch.scheduledTime || '09:00'}</span>
                            <span className="text-xs font-bold text-slate-900 truncate">{sch.title}</span>
                          </div>
                          <div className="text-xs text-slate-500 truncate">{sch.equipmentName} ({sch.location})</div>
                          <div className="text-[11px] text-slate-400">Teknisi: {sch.technicianName}</div>
                        </div>

                        {sch.status !== 'Completed' ? (
                          <button
                            onClick={() => onStartReportFromSchedule(sch)}
                            className="shrink-0 p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition"
                            title="Lapor"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Add / Edit Schedule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-base font-bold text-white">
                {editingSchedule ? 'Edit Jadwal Maintenance' : 'Buat Jadwal Maintenance Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembersihan Filter & Pengecekan Freon Chiller"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Peralatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                >
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} — {eq.location} ({eq.categoryName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teknisi Pelaksana
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold flex items-center justify-between">
                    <span>Irfan</span>
                    <span className="text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full font-semibold">Teknisi Maintenance</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Pekerjaan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value as JobType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="Preventive Maintenance">Preventive Maintenance (Pencegahan Berkala)</option>
                    <option value="Corrective Maintenance">Corrective Maintenance (Perbaikan Terencana)</option>
                    <option value="Inspection">Inspection (Inspeksi & Uji Fungsi)</option>
                    <option value="Repair">Repair (Perbaikan Darurat)</option>
                    <option value="Installation">Installation (Pemasangan / Penggantian Unit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Rencana <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Pelaksanaan</label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as SchedulePriority })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency (Mendesak)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pekerjaan / Instruksi Khusus</label>
                <textarea
                  rows={2}
                  placeholder="Instruksi K3, peralatan APD yang wajib dibawa, atau prosedur isolasi..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-md"
                >
                  {editingSchedule ? 'Simpan Jadwal' : 'Jadwalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
