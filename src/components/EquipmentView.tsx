import React, { useState } from 'react';
import { 
  Equipment, 
  EquipmentCategory, 
  ServiceReport, 
  User 
} from '../types/index.ts';
import { 
  Search, 
  Plus, 
  Filter, 
  Cpu, 
  MapPin, 
  Calendar, 
  Clock, 
  Wrench, 
  History, 
  Edit, 
  Trash2, 
  X, 
  FolderPlus,
  Tag,
  CheckCircle2, 
  Layers
} from 'lucide-react';

interface EquipmentViewProps {
  equipment: Equipment[];
  categories: EquipmentCategory[];
  reports: ServiceReport[];
  currentUser: User | null;
  onSaveEquipment: (data: Partial<Equipment>, isEdit: boolean) => Promise<void>;
  onDeleteEquipment: (id: string) => Promise<void>;
  onSaveCategory: (data: Partial<EquipmentCategory>, isEdit: boolean) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onStartReportForEquipment: (eq: Equipment) => void;
  onViewReport: (rep: ServiceReport) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  equipment,
  categories,
  reports,
  currentUser,
  onSaveEquipment,
  onDeleteEquipment,
  onSaveCategory,
  onDeleteCategory,
  onStartReportForEquipment,
  onViewReport,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [viewingDetailEquipment, setViewingDetailEquipment] = useState<Equipment | null>(null);

  // Category management modal states
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Inline category add in equipment modal
  const [showInlineCatAdd, setShowInlineCatAdd] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');

  // Equipment Form input states
  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: '',
    categoryId: categories[0]?.id || '',
    brand: '',
    model: '',
    serialNumber: '',
    capacity: '',
    location: '',
    installationDate: '',
    maintenanceIntervalDays: 30,
    status: 'active',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingEquipment(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      brand: '',
      model: '',
      serialNumber: '',
      capacity: '',
      location: '',
      installationDate: new Date().toISOString().split('T')[0],
      maintenanceIntervalDays: 30,
      status: 'active',
      notes: '',
    });
    setShowInlineCatAdd(false);
    setShowFormModal(true);
  };

  const handleOpenEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormData({
      name: eq.name,
      categoryId: eq.categoryId,
      brand: eq.brand,
      model: eq.model,
      serialNumber: eq.serialNumber,
      capacity: eq.capacity,
      location: eq.location,
      installationDate: eq.installationDate || '',
      maintenanceIntervalDays: eq.maintenanceIntervalDays || 30,
      status: eq.status,
      lastServiceDate: eq.lastServiceDate,
      nextServiceDate: eq.nextServiceDate,
      notes: eq.notes || '',
    });
    setShowInlineCatAdd(false);
    setShowFormModal(true);
  };

  const handleSubmitEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.location) {
      alert('Nama peralatan, kategori, dan lokasi wajib diisi.');
      return;
    }
    const cat = categories.find((c) => c.id === formData.categoryId);
    await onSaveEquipment(
      {
        ...formData,
        categoryName: cat?.name || 'General',
        maintenanceIntervalDays: Number(formData.maintenanceIntervalDays) || 30,
        ...(editingEquipment ? { id: editingEquipment.id } : {}),
      },
      !!editingEquipment
    );
    setShowFormModal(false);
  };

  // Category modal handlers
  const handleOpenCategoryManager = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', code: '', description: '' });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat: EquipmentCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
    });
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert('Nama kategori wajib diisi.');
      return;
    }
    await onSaveCategory(
      {
        name: categoryForm.name.trim(),
        code: categoryForm.code.trim() || categoryForm.name.slice(0, 4).toUpperCase(),
        description: categoryForm.description.trim(),
        ...(editingCategory ? { id: editingCategory.id } : {}),
      },
      !!editingCategory
    );
    setEditingCategory(null);
    setCategoryForm({ name: '', code: '', description: '' });
  };

  // Inline add category directly while filling equipment form
  const handleSaveInlineCategory = async () => {
    if (!inlineCatName.trim()) return;
    const catName = inlineCatName.trim();
    const code = catName.slice(0, 4).toUpperCase();
    await onSaveCategory({ name: catName, code, description: '' }, false);
    setInlineCatName('');
    setShowInlineCatAdd(false);
  };

  // Filter equipment
  const filtered = equipment.filter((eq) => {
    if (selectedCategory !== 'all' && eq.categoryId !== selectedCategory) return false;
    if (selectedStatus !== 'all' && eq.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        eq.name.toLowerCase().includes(q) ||
        eq.brand.toLowerCase().includes(q) ||
        eq.model.toLowerCase().includes(q) ||
        eq.location.toLowerCase().includes(q) ||
        eq.serialNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const detailHistory = viewingDetailEquipment
    ? reports.filter((r) => r.equipmentId === viewingDetailEquipment.id)
    : [];

  return (
    <div className="space-y-5 pb-20 lg:pb-10">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Peralatan & Kategori
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dikelola oleh teknisi: atur kategori peralatan perusahaan, interval servis, dan spesifikasi unit ({equipment.length} peralatan terdaftar)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Kelola Kategori Button */}
          <button
            onClick={handleOpenCategoryManager}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 text-xs sm:text-sm transition active:scale-95 shrink-0 bg-white shadow-xs"
            title="Teknisi dapat menambah dan mengatur daftar kategori peralatan"
          >
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Kelola Kategori ({categories.length})</span>
          </button>

          {/* Tambah Peralatan Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-2 text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Alat</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama peralatan, merek, model, nomor seri, atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          >
            <option value="all">Semua Kategori ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">Tidak ada peralatan ditemukan</div>
            <div className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau buat peralatan baru.</div>
          </div>
        ) : (
          filtered.map((eq) => {
            const isOverdue = eq.status === 'active' && new Date(eq.nextServiceDate) < new Date('2026-10-31');
            return (
              <div
                key={eq.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                      {eq.categoryName}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      eq.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {eq.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {eq.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {eq.brand} • {eq.model}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{eq.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Interval: setiap <strong>{eq.maintenanceIntervalDays} hari</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                        Next: {eq.nextServiceDate} {isOverdue && '(Terlambat)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingDetailEquipment(eq)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Riwayat ({reports.filter((r) => r.equipmentId === eq.id).length})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onStartReportForEquipment(eq)}
                      className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition"
                      title="Buat Laporan Service Langsung"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(eq)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Edit Peralatan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEquipment(eq.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Hapus Peralatan"
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

      {/* MODAL KELOLA KATEGORI (Technician Category Manager) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  Kelola Kategori Peralatan
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Form Tambah/Edit Kategori */}
              <form onSubmit={handleSubmitCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{editingCategory ? 'Edit Kategori' : '+ Tambah Kategori Baru'}</span>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: '', code: '', description: '' });
                      }}
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Nama Kategori <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Chiller & AC, Boiler, Panel Listrik"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Kode Singkat
                    </label>
                    <input
                      type="text"
                      placeholder="HVAC / ELEC"
                      value={categoryForm.code}
                      onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Deskripsi / Catatan Jenis Alat
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Seluruh unit pendingin gedung dan ruang server..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-xs"
                  >
                    {editingCategory ? 'Simpan Perubahan' : 'Tambahkan Kategori'}
                  </button>
                </div>
              </form>

              {/* Daftar Kategori Saat Ini */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Daftar Kategori Saat Ini ({categories.length})
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {categories.map((cat) => {
                    const eqCount = equipment.filter((e) => e.categoryId === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{cat.name}</span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                              {cat.code}
                            </span>
                            <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                              {eqCount} peralatan
                            </span>
                          </div>
                          {cat.description && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {cat.description}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditCategory(cat)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            title="Edit Kategori"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (eqCount > 0) {
                                alert(`Kategori ini tidak dapat dihapus karena masih digunakan oleh ${eqCount} peralatan.`);
                                return;
                              }
                              if (confirm(`Hapus kategori "${cat.name}"?`)) {
                                await onDeleteCategory(cat.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL & HISTORY DRAWER MODAL */}
      {viewingDetailEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded">
                  {viewingDetailEquipment.categoryName}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {viewingDetailEquipment.name}
                </h3>
              </div>
              <button
                onClick={() => setViewingDetailEquipment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Specs Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block">Merek / Model</span>
                  <span className="font-semibold text-slate-800">{viewingDetailEquipment.brand} {viewingDetailEquipment.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Serial Number</span>
                  <span className="font-semibold text-slate-800">{viewingDetailEquipment.serialNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Kapasitas / Spek</span>
                  <span className="font-semibold text-slate-800">{viewingDetailEquipment.capacity || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Lokasi Fasilitas</span>
                  <span className="font-semibold text-slate-800">{viewingDetailEquipment.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Interval Service</span>
                  <span className="font-semibold text-slate-800">Setiap {viewingDetailEquipment.maintenanceIntervalDays} Hari</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Service Terakhir</span>
                  <span className="font-semibold text-slate-800">{viewingDetailEquipment.lastServiceDate || 'Belum pernah'}</span>
                </div>
              </div>

              {viewingDetailEquipment.notes && (
                <div className="text-xs bg-amber-50/70 border border-amber-200/60 p-3 rounded-xl text-amber-900">
                  <strong>Catatan Khusus Operasional:</strong> {viewingDetailEquipment.notes}
                </div>
              )}

              {/* History Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-600" />
                    <span>Riwayat Pekerjaan Perawatan ({detailHistory.length})</span>
                  </h4>
                  <button
                    onClick={() => {
                      setViewingDetailEquipment(null);
                      onStartReportForEquipment(viewingDetailEquipment);
                    }}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg"
                  >
                    + Buat Laporan Baru
                  </button>
                </div>

                {detailHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl">
                    Belum ada riwayat service tersimpan untuk peralatan ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailHistory.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:border-sky-400 transition flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                              {rep.reportNumber}
                            </span>
                            <span className="text-xs text-slate-500">{rep.jobDate}</span>
                            <span className="text-xs font-semibold text-slate-700">({rep.jobType})</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                            {rep.actionTaken}
                          </p>
                          <span className="text-[10px] text-slate-400">Teknisi: {rep.technicianName}</span>
                        </div>

                        <button
                          onClick={() => {
                            setViewingDetailEquipment(null);
                            onViewReport(rep);
                          }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 shrink-0"
                        >
                          Lihat PDF & Detail
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setViewingDetailEquipment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT EQUIPMENT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-base font-bold text-white">
                {editingEquipment ? 'Edit Data Peralatan' : 'Tambah Peralatan Baru'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEquipment} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Peralatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Chiller Water Cooled Gedung A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Kategori with inline add button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Kategori Peralatan <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInlineCatAdd(!showInlineCatAdd)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>+ Buat Kategori Baru</span>
                  </button>
                </div>

                {showInlineCatAdd && (
                  <div className="mb-2 p-2.5 bg-sky-50 rounded-xl border border-sky-200 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nama kategori baru..."
                      value={inlineCatName}
                      onChange={(e) => setInlineCatName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-sky-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveInlineCategory}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInlineCatAdd(false)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs"
                    >
                      Batal
                    </button>
                  </div>
                )}

                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi / Ruangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rooftop Gedung Utama A, Basement 1"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Merek</label>
                  <input
                    type="text"
                    placeholder="Contoh: Daikin"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model / Tipe</label>
                  <input
                    type="text"
                    placeholder="Contoh: WMC-120C"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="Opsional"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kapasitas / Spek</label>
                  <input
                    type="text"
                    placeholder="Contoh: 120 TR / 500 kVA"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interval Servis (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maintenanceIntervalDays}
                    onChange={(e) => setFormData({ ...formData, maintenanceIntervalDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Operasional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="active">Aktif Beroperasi</option>
                    <option value="inactive">Nonaktif / Standby</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Operasional / Prosedur</label>
                <textarea
                  rows={2}
                  placeholder="Catatan jenis oli, refrigerant, atau kontak vendor pendukung..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-md"
                >
                  {editingEquipment ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
