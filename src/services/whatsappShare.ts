import { ServiceReport, CompanySettings } from '../types/index.ts';
import { generateServiceReportPDF } from './pdfGenerator.ts';

export const buildWhatsAppMessage = (report: ServiceReport, company?: CompanySettings): string => {
  const companyName = company?.companyName || 'PT CAHAYA PERDANA NUSANTARA';
  
  const text = `*LAPORAN PEKERJAAN TEKNISI*
_${companyName}_

*No. Laporan:* ${report.reportNumber}
*Peralatan:* ${report.equipmentName} (${report.brandModel || '-'})
*Lokasi:* ${report.location}
*Tanggal/Jam:* ${report.jobDate} | ${report.jobTime || '09:00'} WIB
*Jenis Pekerjaan:* ${report.jobType}
*Teknisi:* ${report.technicianName}

---------------------------------
*1. Temuan / Masalah:*
${report.findings}

*2. Tindakan Perbaikan:*
${report.actionTaken}

*3. Suku Cadang:*
${report.spareParts || 'Tidak ada'}

*4. Kondisi Akhir:*
${report.conditionAfter}

*5. Rekomendasi:*
${report.recommendations || 'Peralatan siap dioperasikan normal'}
---------------------------------
_Laporan resmi telah diarsipkan di Internal Technician Service App._`;

  return text;
};

export const shareViaWhatsApp = (report: ServiceReport, company?: CompanySettings, phoneNumber?: string) => {
  const message = buildWhatsAppMessage(report, company);
  const encoded = encodeURIComponent(message);
  
  let url = `https://wa.me/?text=${encoded}`;
  if (phoneNumber && phoneNumber.trim()) {
    // Sanitize phone (e.g. 0812... -> 62812...)
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    url = `https://wa.me/${cleanPhone}?text=${encoded}`;
  }

  // Open in new tab/window or trigger deep link
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const shareNativeOrPDF = async (report: ServiceReport, company: CompanySettings): Promise<boolean> => {
  const message = buildWhatsAppMessage(report, company);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      // Generate PDF as Blob
      const doc = await generateServiceReportPDF(report, company);
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `Laporan_Service_${report.reportNumber}.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Laporan Service - ${report.reportNumber}`,
          text: message,
          files: [file],
        });
        return true;
      } else {
        await navigator.share({
          title: `Laporan Service - ${report.reportNumber}`,
          text: message,
        });
        return true;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed or dismissed, fallback to WhatsApp:', err);
      }
    }
  }

  // Fallback to WhatsApp
  shareViaWhatsApp(report, company);
  return true;
};
