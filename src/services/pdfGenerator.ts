import { jsPDF } from 'jspdf';
import { ServiceReport, CompanySettings } from '../types/index.ts';

const loadPhotoAsJpeg = async (url: string): Promise<string> => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to prepare a report photo for PDF export.');
  context.drawImage(image, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.9);
};

export const generateServiceReportPDF = async (
  report: ServiceReport,
  company: CompanySettings
): Promise<jsPDF> => {
  const photoDataUrls = await Promise.all(
    (report.photos || []).slice(0, 3).map((photo) => loadPhotoAsJpeg(photo.url))
  );
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Colors
  const navyDark = [15, 23, 42];     // #0f172a
  const navyBlue = [30, 58, 138];    // #1e3a8a
  const textDark = [30, 41, 59];     // #1e293b
  const textMuted = [100, 116, 139]; // #64748b
  const boxBg = [248, 250, 252];     // #f8fafc
  const borderColor = [226, 232, 240];

  // --- HEADER PERUSAHAAN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
  doc.text(company.companyName || 'PT CAHAYA PERDANA NUSANTARA', margin + 8, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(company.headerNote || 'DIVISI PEMELIHARAAN FASILITAS & TEKNIK INTERNAL', margin + 8, y + 10);

  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const headerDetails = doc.splitTextToSize(
    `${company.address || 'Kawasan Industri Pulogadung, Jakarta'} | Telp: ${company.phone || '-'} | Email: ${company.email || '-'}`,
    contentWidth - 8
  );
  const headerDetailsLineHeight = (7.5 / 2.8346) * 1.15;
  const dividerOffset = Math.max(20, 15 + (headerDetails.length - 1) * headerDetailsLineHeight + 5);

  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(margin, y, 4, dividerOffset + 2, 'F');
  doc.text(headerDetails, margin + 8, y + 15, { lineHeightFactor: 1.15 });

  y += dividerOffset;

  // Top Divider line
  doc.setDrawColor(navyBlue[0], navyBlue[1], navyBlue[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);

  y += 8;

  // --- REPORT TITLE BAR ---
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('LAPORAN PEKERJAAN SERVIS & PERAWATAN TEKNISI', margin + 6, y + 7.5);

  doc.setFontSize(8.5);
  doc.text(`NO: ${report.reportNumber}`, pageWidth - margin - 6, y + 7.5, { align: 'right' });

  y += 16;

  // --- METADATA & PERALATAN BOX ---
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  const col1 = margin + 4;
  const col2 = margin + 96;
  let metaY = y + 6;

  const drawField = (x: number, yPos: number, label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(label.toUpperCase(), x, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(value || '-', x, yPos + 4.5);
  };

  // Row 1
  drawField(col1, metaY, 'Nama Peralatan', report.equipmentName);
  drawField(col2, metaY, 'Lokasi / Ruangan', report.location);
  metaY += 10;

  // Row 2
  drawField(col1, metaY, 'Merek & Tipe', report.brandModel || '-');
  drawField(col2, metaY, 'Nomor Seri / SN', report.serialNumber || 'N/A');
  metaY += 10;

  // Row 3
  drawField(col1, metaY, 'Tanggal & Jam Kerja', `${report.jobDate} | ${report.jobTime || '09:00'} WIB`);
  drawField(col2, metaY, 'Jenis Pekerjaan', `${report.jobType} (Teknisi: ${report.technicianName})`);

  y += 42;

  // --- WORK DETAILS SECTIONS ---
  const renderSection = (title: string, content: string, heightReserve = 14) => {
    if (y + heightReserve > pageHeight - 35) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    doc.text(title, margin + 3, y + 4.2);

    y += 7.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);

    const lines = doc.splitTextToSize(content || '-', contentWidth - 4);
    doc.text(lines, margin + 2, y + 3);

    y += lines.length * 3.8 + 4;
  };

  renderSection('1. KONDISI AWAL SEBELUM SERVICE', report.conditionBefore);
  renderSection('2. TEMUAN DIAGNOSA / INDIKASI KERUSAKAN', report.findings);
  renderSection('3. TINDAKAN PERBAIKAN / MAINTENANCE YANG DILAKUKAN', report.actionTaken);

  if (report.spareParts && report.spareParts.trim()) {
    renderSection('4. SUKU CADANG / MATERIAL YANG DIGUNAKAN', report.spareParts);
  }

  renderSection('5. KONDISI & HASIL SETELAH SERVICE (UJI OPERASIONAL)', report.conditionAfter);

  if (report.recommendations && report.recommendations.trim()) {
    renderSection('6. REKOMENDASI TEKNISI UNTUK MAINTENANCE BERIKUTNYA', report.recommendations);
  }

  // --- FOTO DOKUMENTASI (Jika ada) ---
  if (report.photos && report.photos.length > 0) {
    if (y + 45 > pageHeight - 40) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    doc.text('7. DOKUMENTASI FOTO PEKERJAAN', margin + 3, y + 4.2);

    y += 9;

    // Photos row
    const photoWidth = (contentWidth - 6) / Math.min(3, report.photos.length);
    const photoHeight = 32;

    report.photos.slice(0, 3).forEach((p, idx) => {
      const px = margin + idx * (photoWidth + 3);
      try {
        doc.addImage(photoDataUrls[idx], 'JPEG', px, y, photoWidth, photoHeight, undefined, 'FAST');
      } catch (err) {
        console.error('Unable to add a report photo to PDF:', err);
        throw err;
      }

      // Caption label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      const stageLabel = p.stage === 'before' ? 'SEBELUM' : p.stage === 'during' ? 'PROSES' : 'SESUDAH';
      doc.text(`[${stageLabel}] ${p.caption.slice(0, 32)}`, px, y + photoHeight + 3.5);
    });

    y += photoHeight + 7;
  }

  // --- SIGNATURE BLOCK ---
  if (y + 35 > pageHeight - 15) {
    doc.addPage();
    y = 20;
  } else {
    y = Math.max(y + 4, pageHeight - 44);
  }

  const sigBoxWidth = (contentWidth - 10) / 2;
  const sigBoxHeight = 26;

  // Box 1: Teknisi
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, y, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TEKNISI PELAKSANA', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`( ${report.technicianName} )`, margin + 4, y + sigBoxHeight - 3);

  // Box 2: Pengawas
  const sigCol2 = margin + sigBoxWidth + 10;
  doc.roundedRect(sigCol2, y, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('PENGAWAS FASILITAS / PIC', sigCol2 + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`( ${company.picName || 'Manager Pemeliharaan'} )`, sigCol2 + 4, y + sigBoxHeight - 3);

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Dicetak dari Internal Technician Service App | Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  return doc;
};

export const downloadReportPDF = async (report: ServiceReport, company: CompanySettings) => {
  const doc = await generateServiceReportPDF(report, company);
  const filename = `Laporan_Service_${report.reportNumber}.pdf`;
  doc.save(filename);
};
