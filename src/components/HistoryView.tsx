import React, { useState } from 'react';
import { 
  ServiceReport, 
  Equipment, 
  EquipmentCategory, 
  CompanySettings 
} from '../types/index.ts';
import { 
  Search, 
  Filter, 
  History, 
  Download, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  User as UserIcon,
  Wrench
} from 'lucide-react';
import { downloadReportPDF } from '../services/pdfGenerator.ts';
import { shareViaWhatsApp } from '../services/whatsappShare.ts';

interface HistoryViewProps {
  reports: ServiceReport[];
  equipment: Equipment[];
  categories: EquipmentCategory[];
  company: CompanySettings;
  onViewReport: (report: ServiceReport) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  reports,
  equipment,
  categories,
  company,
  onViewReport,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Unique locations from equipment
  const locations = Array.from(new Set(equipment.map((e) => e.location))).filter(Boolean);

  // Filtered reports
  const filtered = reports.filter((rep) => {
    if (selectedCategory !== 'all' && rep.categoryName !== selectedCategory) return false;
    if (selectedEquipment !== 'all' && rep.equipmentId !== selectedEquipment) return false;
    if (selectedLocation !== 'all' && rep.location !== selectedLocation) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        rep.reportNumber.toLowerCase().includes(q) ||
        rep.equipmentName.toLowerCase().includes(q) ||
        rep.technicianName.toLowerCase().includes(q) ||
        rep.actionTaken.toLowerCase().includes(q) ||
        rep.findings.toLowerCase().includes(q) ||
        rep.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-20 lg:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Service Peralatan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Arsip lengkap seluruh Berita Acara pekerjaan perawatan, perbaikan, dan foto dokumentasi ({reports.length} laporan)
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor laporan, peralatan, teknisi, temuan, atau tindakan perbaikan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Kategori */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Peralatan */}
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 max-w-[200px] truncate"
          >
            <option value="all">Semua Peralatan</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>

          {/* Lokasi */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 max-w-[180px] truncate"
          >
            <option value="all">Semua Lokasi</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {(selectedCategory !== 'all' || selectedEquipment !== 'all' || selectedLocation !== 'all' || search) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedEquipment('all');
                setSelectedLocation('all');
                setSearch('');
              }}
              className="text-xs font-semibold text-rose-600 hover:underline px-2 py-1"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">Tidak ada riwayat laporan ditemukan</div>
            <div className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter yang dipilih.</div>
          </div>
        ) : (
          filtered.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {rep.reportNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {rep.jobType}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Terverifikasi
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {rep.equipmentName}
                </h3>

                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rep.jobDate} ({rep.jobTime || '09:00'} WIB)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rep.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Teknisi: <strong className="text-sky-700">{rep.technicianName}</strong></span>
                  </div>
                </div>

                {/* Technical snippet */}
                <div className="text-xs text-slate-600 pt-1 line-clamp-2">
                  <strong className="text-slate-700">Tindakan:</strong> {rep.actionTaken}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => shareViaWhatsApp(rep, company)}
                  className="p-2 rounded-xl border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition"
                  title="Bagikan via WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                <button
                  onClick={() => downloadReportPDF(rep, company)}
                  className="p-2 rounded-xl border border-slate-200 text-sky-700 hover:bg-sky-50 transition"
                  title="Unduh PDF A4"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onViewReport(rep)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Buka Berita Acara</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
