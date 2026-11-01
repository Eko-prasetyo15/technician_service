import React, { useState, useEffect, useRef } from 'react';
import { 
  Equipment, 
  ServiceSchedule, 
  ServiceReport, 
  ServiceReportPhoto, 
  User, 
  JobType 
} from '../types/index.ts';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Save, 
  Send, 
  CheckCircle, 
  WifiOff, 
  Clock, 
  MapPin, 
  FileText, 
  AlertCircle,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { 
  getReportDraft, 
  saveReportDraft, 
  clearReportDraft, 
  queueReportForSync 
} from '../services/offlineSync.ts';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

interface ReportFormViewProps {
  equipment: Equipment[];
  schedules: ServiceSchedule[];
  currentUser: User | null;
  initialSchedule?: ServiceSchedule | null;
  initialEquipment?: Equipment | null;
  onSubmitReport: (data: Partial<ServiceReport>, isOffline: boolean) => Promise<ServiceReport | void>;
  onCancel: () => void;
}

export const ReportFormView: React.FC<ReportFormViewProps> = ({
  equipment,
  schedules,
  currentUser,
  initialSchedule,
  initialEquipment,
  onSubmitReport,
  onCancel,
}) => {
  const { isOnline } = useOnlineStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoStage, setActivePhotoStage] = useState<'before' | 'during' | 'after'>('before');

  // Form State
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    initialSchedule?.equipmentId || initialEquipment?.id || equipment[0]?.id || ''
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(initialSchedule?.id || '');
  const [jobDate, setJobDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [jobTime, setJobTime] = useState<string>('10:00');
  const [jobType, setJobType] = useState<JobType>(initialSchedule?.jobType || 'Preventive Maintenance');
  const [conditionBefore, setConditionBefore] = useState('');
  const [findings, setFindings] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [spareParts, setSpareParts] = useState('');
  const [conditionAfter, setConditionAfter] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [photos, setPhotos] = useState<ServiceReportPhoto[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Equipment object
  const currentEquipment = equipment.find((e) => e.id === selectedEquipmentId) || equipment[0];

  // Load initial draft from localStorage if available and not overridden by props
  useEffect(() => {
    if (!initialSchedule && !initialEquipment) {
      const saved = getReportDraft();
      if (saved) {
        if (saved.equipmentId) setSelectedEquipmentId(saved.equipmentId);
        if (saved.scheduleId) setSelectedScheduleId(saved.scheduleId);
        if (saved.jobDate) setJobDate(saved.jobDate);
        if (saved.jobTime) setJobTime(saved.jobTime);
        if (saved.jobType) setJobType(saved.jobType as JobType);
        if (saved.conditionBefore) setConditionBefore(saved.conditionBefore);
        if (saved.findings) setFindings(saved.findings);
        if (saved.actionTaken) setActionTaken(saved.actionTaken);
        if (saved.spareParts) setSpareParts(saved.spareParts);
        if (saved.conditionAfter) setConditionAfter(saved.conditionAfter);
        if (saved.recommendations) setRecommendations(saved.recommendations);
        if (saved.additionalNotes) setAdditionalNotes(saved.additionalNotes);
        if (saved.photos) setPhotos(saved.photos);
        setDraftSavedAt('Dimuat dari draf lokal');
      }
    }
  }, [initialSchedule, initialEquipment]);

  // Auto-save draft on form change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveReportDraft({
        equipmentId: selectedEquipmentId,
        scheduleId: selectedScheduleId,
        jobDate,
        jobTime,
        jobType,
        conditionBefore,
        findings,
        actionTaken,
        spareParts,
        conditionAfter,
        recommendations,
        additionalNotes,
        photos,
      });
      setDraftSavedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    selectedEquipmentId,
    selectedScheduleId,
    jobDate,
    jobTime,
    jobType,
    conditionBefore,
    findings,
    actionTaken,
    spareParts,
    conditionAfter,
    recommendations,
    additionalNotes,
    photos,
  ]);

  // Photo upload and compression handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress image via canvas
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

            const newPhoto: ServiceReportPhoto = {
              id: 'p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              url: dataUrl,
              stage: activePhotoStage,
              caption: `Dokumentasi tahap ${activePhotoStage} servis`,
              timestamp: new Date().toISOString(),
            };

            setPhotos((prev) => [...prev, newPhoto]);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePhotoCaption = (id: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption } : p))
    );
  };

  // Quick fill template helpers for convenience of technicians
  const handleApplyTemplate = (type: 'hvac' | 'electrical' | 'plumbing') => {
    if (type === 'hvac') {
      setConditionBefore('Unit AC beroperasi kurang dingin, filter udara tersumbat debu, tekanan suction refrigeran menurun.');
      setFindings('Debu menumpuk pada sirip evaporator, tekanan suction R410A turun ke 110 psi, ampere kompresor 18.5 A.');
      setActionTaken('1. Mencuci bersih pre-filter dan sirip koil evaporator.\n2. Cek kebocoran flare nut dan sambungan nepel pipa tembaga.\n3. Top-up freon 350 gr sampai suction stabil di 125 psi.');
      setSpareParts('Refrigerant R410A (350gr), Coil cleaner, Pembersih filter');
      setConditionAfter('Suhu supply udara dingin 13.5°C, arus kompresor normal 17.8 A, kebisingan blower hilang.');
      setRecommendations('Jadwalkan pembersihan kondensor outdoor rooftop 3 bulan mendatang.');
    } else if (type === 'electrical') {
      setConditionBefore('Genset kondisi standby, level bahan bakar harian 80%, tegangan baterai starter 24.2V.');
      setFindings('Air aki starter sel 2 sedikit di bawah garis batas level atas, filter solar bersih.');
      setActionTaken('1. Top-up air aki demineralisasi 200 ml.\n2. Running test genset tanpa beban selama 15 menit.\n3. Pengecekan putaran 1500 RPM, frekuensi 50.2 Hz, tegangan 400V.');
      setSpareParts('Air aki demineralisasi 1 botol, gemuk kontak terminal');
      setConditionAfter('Genset start instan pada cranking pertama, pembacaan tegangan dan frekuensi stabil.');
      setRecommendations('Ganti oli mesin dan filter oli pada bulan berikutnya (mendekati 250 jam operasional).');
    } else {
      setConditionBefore('Tekanan debit pompa suplai tandon rooftop turun dan terdengar dengungan getaran.');
      setFindings('Mechanical seal shaft mulai aus rembes halus, strainer suction kotor endapan pasir.');
      setActionTaken('1. Membersihkan strainer filter sedimen dari kotoran.\n2. Mengganti seal kit mechanical pompa.\n3. Bleeding udara terjebak dan uji running tekanan discharge 8 bar.');
      setSpareParts('Mechanical seal kit 1 set, O-ring gasket');
      setConditionAfter('Pompa berjalan sangat halus, tidak ada tetesan air, tekanan debit stabil 8.2 bar.');
      setRecommendations('Lakukan backwash filter pasir sedimentasi setiap minggu.');
    }
  };

  const handleClearDraft = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan draf laporan ini?')) {
      clearReportDraft();
      setConditionBefore('');
      setFindings('');
      setActionTaken('');
      setSpareParts('');
      setConditionAfter('');
      setRecommendations('');
      setAdditionalNotes('');
      setPhotos([]);
      setDraftSavedAt(null);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipmentId || !actionTaken.trim() || !findings.trim()) {
      alert('Peralatan, temuan, dan tindakan perbaikan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    const reportPayload: Partial<ServiceReport> = {
      scheduleId: selectedScheduleId || undefined,
      equipmentId: currentEquipment.id,
      equipmentName: currentEquipment.name,
      categoryName: currentEquipment.categoryName,
      brandModel: `${currentEquipment.brand} ${currentEquipment.model}`,
      serialNumber: currentEquipment.serialNumber,
      location: currentEquipment.location,
      technicianId: schedules.find((schedule) => schedule.id === selectedScheduleId)?.technicianId
        || currentUser?.id
        || 'usr-irfan',
      technicianName: schedules.find((schedule) => schedule.id === selectedScheduleId)?.technicianName
        || currentUser?.name
        || 'Irfan Rusmana',
      jobDate,
      jobTime,
      jobType,
      conditionBefore,
      findings,
      actionTaken,
      spareParts,
      conditionAfter,
      recommendations,
      additionalNotes,
      photos,
      status: 'Submitted',
    };

    try {
      if (!isOnline) {
        // Offline: save to local offline queue
        queueReportForSync(reportPayload);
        clearReportDraft();
        alert('Laporan berhasil disimpan secara OFFLINE di perangkat Anda. Sistem akan otomatis menyinkronkan ke server saat koneksi internet kembali aktif.');
        onCancel();
      } else {
        // Online: send to server
        await onSubmitReport(reportPayload, false);
        clearReportDraft();
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      // Fallback: save to offline queue if server returned error
      queueReportForSync(reportPayload);
      clearReportDraft();
      alert('Koneksi ke server terganggu. Laporan telah disimpan di antrian offline perangkat Anda.');
      onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-12 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              SRV-BARU
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Form Berita Acara & Laporan Servis
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Laporan Pekerjaan Teknisi
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {draftSavedAt && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Draf tersimpan ({draftSavedAt})</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearDraft}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Kosongkan Draf"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Offline Alert if currently offline */}
      {!isOnline && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-900 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm">
            <strong>Mode Offline Aktif:</strong> Anda dapat mengisi dan menyimpan laporan ini dengan lengkap termasuk foto. Laporan akan diantrikan dan otomatis disinkronkan saat kembali online.
          </div>
        </div>
      )}

      {/* Quick Fill Suggestions for fast technician entry */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Template Cepat:
        </span>
        <button
          type="button"
          onClick={() => handleApplyTemplate('hvac')}
          className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 shrink-0 transition"
        >
          AC / Chiller
        </button>
        <button
          type="button"
          onClick={() => handleApplyTemplate('electrical')}
          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shrink-0 transition"
        >
          Genset / Listrik
        </button>
        <button
          type="button"
          onClick={() => handleApplyTemplate('plumbing')}
          className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 shrink-0 transition"
        >
          Pompa / Plumbing
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Data Peralatan & Waktu Pekerjaan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">1</span>
            <span>Identitas Peralatan & Jadwal Terkait</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Peralatan yang Dikerjakan <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-800"
              >
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} — {eq.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jadwal Maintenance Terkait (Opsional)
              </label>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800"
              >
                <option value="">-- Pekerjaan Langsung / Tanpa Jadwal Sebelumnya --</option>
                {schedules
                  .filter((s) => s.status !== 'Completed')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.scheduledDate} — {s.title} ({s.technicianName})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Auto-filled Equipment Details Snapshot */}
          {currentEquipment && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Kategori</span>
                <span className="font-semibold text-slate-800">{currentEquipment.categoryName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Merek / Tipe</span>
                <span className="font-semibold text-slate-800">{currentEquipment.brand} {currentEquipment.model}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Serial Number</span>
                <span className="font-semibold text-slate-800">{currentEquipment.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Lokasi Ruangan</span>
                <span className="font-semibold text-slate-800">{currentEquipment.location}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Pekerjaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={jobDate}
                onChange={(e) => setJobDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jam Pekerjaan</label>
              <input
                type="time"
                value={jobTime}
                onChange={(e) => setJobTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis Pekerjaan <span className="text-rose-500">*</span>
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Corrective Maintenance">Corrective Maintenance</option>
                <option value="Inspection">Inspection (Inspeksi Uji Fungsi)</option>
                <option value="Repair">Repair (Perbaikan Kerusakan)</option>
                <option value="Installation">Installation (Pemasangan)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Detail Servis & Diagnosa */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">2</span>
            <span>Uraian Teknis & Tindakan Perbaikan</span>
          </h2>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kondisi Sebelum Service <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Unit beroperasi dengan suara getaran berlebih, suhu ruangan meningkat ke 26°C..."
                value={conditionBefore}
                onChange={(e) => setConditionBefore(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Temuan Diagnosa / Kerusakan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Filter udara kotor tebal, tekanan gas pendingin turun ke 110 psi..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tindakan Perbaikan / Maintenance yang Dilakukan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="1. Pembersihan cuci filter pre-filter...&#10;2. Pengetesan kebocoran sambungan...&#10;3. Pengisian refrigeran tambahan..."
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Spare Part / Suku Cadang yang Digunakan (Opsional catatan)
              </label>
              <input
                type="text"
                placeholder="Contoh: Seal Kit Grundfos HQQE, Filter Mat G4, Refrigerant R410A (350 gr)"
                value={spareParts}
                onChange={(e) => setSpareParts(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kondisi & Hasil Uji Operasional Setelah Service <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Contoh: Suhu supply dingin normal 12°C, getaran blower hilang, tegangan dan arus kompresor stabil..."
                value={conditionAfter}
                onChange={(e) => setConditionAfter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rekomendasi Teknisi untuk Perawatan Mendatang
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Jadwalkan penggantian oli pada 250 jam kerja berikutnya, monitor suhu sensor harian..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Tambahan / Saksi Pekerjaan
              </label>
              <input
                type="text"
                placeholder="Contoh: Disaksikan oleh Staf IT Data Center (Bpk. Dimas)"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Foto Dokumentasi (Sebelum, Selama, Sesudah) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">3</span>
              <span>Dokumentasi Foto Pekerjaan ({photos.length} foto)</span>
            </h2>

            {/* Stage Selector Buttons for Upload */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActivePhotoStage('before')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activePhotoStage === 'before' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Sebelum
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoStage('during')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activePhotoStage === 'during' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Selama
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoStage('after')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activePhotoStage === 'after' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Sesudah
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Unggah atau ambil foto kondisi peralatan sebelum dikerjakan, proses perbaikan, dan kondisi akhir setelah selesai.
          </p>

          {/* Upload Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-sky-700 cursor-pointer"
            >
              <Camera className="w-6 h-6 text-sky-600" />
              <span className="text-xs sm:text-sm font-bold">
                Ketuk untuk Ambil / Unggah Foto [{activePhotoStage.toUpperCase()}]
              </span>
              <span className="text-[11px] text-slate-500">
                Mendukung kamera HP langsung dan kompresi otomatis
              </span>
            </button>
          </div>

          {/* Photos Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative group"
                >
                  <div className="relative aspect-4/3 bg-slate-900">
                    <img
                      src={p.url}
                      alt={p.caption}
                      className="w-full h-full object-cover"
                    />
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm uppercase ${
                      p.stage === 'before'
                        ? 'bg-amber-600'
                        : p.stage === 'during'
                        ? 'bg-blue-600'
                        : 'bg-emerald-600'
                    }`}>
                      {p.stage}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white hover:bg-rose-600 transition"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2">
                    <input
                      type="text"
                      value={p.caption}
                      onChange={(e) => updatePhotoCaption(p.id, e.target.value)}
                      placeholder="Keterangan foto..."
                      className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Action Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-14 lg:bottom-4 z-20">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Teknisi Pelaksana:</span>
            <strong className="text-slate-800">{currentUser?.name || 'Teknisi'}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl text-slate-950 font-bold px-6 py-2.5 text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 ${
                isOnline ? 'bg-sky-500 hover:bg-sky-400' : 'bg-amber-500 hover:bg-amber-400'
              }`}
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isOnline ? 'Simpan & Terbitkan Laporan' : 'Simpan Offline (Draft)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
