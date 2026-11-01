import React, { useState } from 'react';
import { ServiceReport, CompanySettings } from '../types/index.ts';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  MessageSquare, 
  Wrench, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle2, 
  Image as ImageIcon 
} from 'lucide-react';
import { downloadReportPDF } from '../services/pdfGenerator.ts';
import { shareViaWhatsApp, shareNativeOrPDF } from '../services/whatsappShare.ts';

interface ReportDetailModalProps {
  report: ServiceReport;
  company: CompanySettings;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  company,
  onClose,
}) => {
  const [waPhone, setWaPhone] = useState('');
  const [showWaInput, setShowWaInput] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    try {
      await downloadReportPDF(report, company);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat PDF.';
      alert(`Gagal membuat PDF laporan: ${message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    shareViaWhatsApp(report, company, waPhone);
    setShowWaInput(false);
  };

  const handleNativeShare = async () => {
    await shareNativeOrPDF(report, company);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  {report.reportNumber}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Selesai
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {report.equipmentName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-500 font-medium hidden sm:block">
            Pilih tindakan untuk laporan ini:
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* WhatsApp Share */}
            <button
              onClick={() => setShowWaInput(!showWaInput)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Kirim WhatsApp</span>
            </button>

            {/* Native Share */}
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 border border-slate-300 hover:bg-white text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition"
              title="Bagikan melalui menu Share perangkat"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 border border-slate-300 hover:bg-white text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition"
              title="Cetak Berita Acara"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* PDF Download */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF A4</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Phone Prompt if toggled */}
        {showWaInput && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-5 flex items-center gap-3 text-xs animate-in slide-in-from-top-1">
            <span className="font-semibold text-emerald-900 shrink-0">
              No. WhatsApp Penerima (Opsional):
            </span>
            <input
              type="tel"
              placeholder="Contoh: 08123456789 atau kosongkan untuk pilih kontak di WA"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              className="flex-1 px-3 py-1 rounded-lg border border-emerald-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1 rounded-lg transition shrink-0"
            >
              Buka WhatsApp
            </button>
          </div>
        )}

        {/* Scrollable Report Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm print:p-0">
          {/* Company letterhead in report */}
          <div className="border-b border-slate-200 pb-3">
            <div className="font-extrabold text-sm text-slate-900">
              {company.companyName}
            </div>
            <div className="text-[11px] text-slate-500">
              {company.headerNote} • {company.address}
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px]">Tanggal & Jam</span>
              <span className="font-bold text-slate-900">{report.jobDate} ({report.jobTime || '09:00'})</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Lokasi Ruangan</span>
              <span className="font-bold text-slate-900">{report.location}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Jenis Pekerjaan</span>
              <span className="font-bold text-slate-900">{report.jobType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Teknisi Pelaksana</span>
              <span className="font-bold text-sky-700">{report.technicianName}</span>
            </div>
          </div>

          {/* Technical Breakdown Sections */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg mb-1.5">
                1. Kondisi Awal Sebelum Service
              </h4>
              <p className="text-slate-700 px-3 whitespace-pre-line leading-relaxed">
                {report.conditionBefore}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg mb-1.5">
                2. Temuan Diagnosa / Kerusakan
              </h4>
              <p className="text-slate-700 px-3 whitespace-pre-line leading-relaxed">
                {report.findings}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg mb-1.5">
                3. Tindakan Perbaikan / Maintenance
              </h4>
              <p className="text-slate-700 px-3 whitespace-pre-line leading-relaxed">
                {report.actionTaken}
              </p>
            </div>

            {report.spareParts && (
              <div>
                <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg mb-1.5">
                  4. Suku Cadang / Material yang Digunakan
                </h4>
                <p className="text-slate-700 px-3 whitespace-pre-line leading-relaxed">
                  {report.spareParts}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg mb-1.5">
                5. Kondisi Akhir & Uji Operasional
              </h4>
              <p className="text-slate-700 px-3 whitespace-pre-line leading-relaxed">
                {report.conditionAfter}
              </p>
            </div>

            {report.recommendations && (
              <div>
                <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg mb-1.5">
                  6. Rekomendasi Perawatan Mendatang
                </h4>
                <p className="text-slate-700 px-3 whitespace-pre-line leading-relaxed">
                  {report.recommendations}
                </p>
              </div>
            )}

            {report.additionalNotes && (
              <div>
                <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg mb-1.5">
                  7. Catatan Tambahan
                </h4>
                <p className="text-slate-700 px-3 whitespace-pre-line leading-relaxed">
                  {report.additionalNotes}
                </p>
              </div>
            )}
          </div>

          {/* Photo Documentation Section */}
          {report.photos && report.photos.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span>Dokumentasi Foto Pekerjaan ({report.photos.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {report.photos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActivePhoto(p.url)}
                    className="cursor-pointer group rounded-xl border border-slate-200 overflow-hidden bg-slate-900 aspect-4/3 relative"
                  >
                    <img
                      src={p.url}
                      alt={p.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                      <span className="text-[10px] font-bold uppercase text-sky-300">
                        [{p.stage}]
                      </span>
                      <span className="text-xs text-white font-medium line-clamp-1">
                        {p.caption}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-center">
            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Teknisi Pelaksana</span>
              <div className="h-12 flex items-center justify-center font-serif text-slate-400 italic text-sm">
                ( Telah ditandatangani digital )
              </div>
              <div className="font-bold text-slate-800 text-xs">{report.technicianName}</div>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Pengawas Fasilitas / PIC</span>
              <div className="h-12 flex items-center justify-center font-serif text-slate-400 italic text-sm">
                ( Telah diverifikasi )
              </div>
              <div className="font-bold text-slate-800 text-xs">{company.picName}</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Photo Zoom */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <img
            src={activePhoto}
            alt="Perbesaran Foto Dokumentasi"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
