import { ServiceReport } from '../types/index.ts';
import { api } from './api.ts';

const DRAFT_STORAGE_KEY = 'tech_service_report_draft';
const OFFLINE_QUEUE_KEY = 'tech_service_offline_queue';

export interface OfflineQueuedReport {
  tempId: string;
  reportData: Partial<ServiceReport>;
  queuedAt: string;
  attempts: number;
  lastError?: string;
}

// --- DRAFT STORAGE (In-progress work) ---

export const getReportDraft = (): Partial<ServiceReport> | null => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to read draft from storage', e);
    return null;
  }
};

export const saveReportDraft = (draft: Partial<ServiceReport>) => {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (e) {
    console.error('Failed to save draft to storage', e);
  }
};

export const clearReportDraft = () => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear draft', e);
  }
};

// --- OFFLINE OUTBOX QUEUE ---

export const getOfflineQueue = (): OfflineQueuedReport[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read offline queue', e);
    return [];
  }
};

const notifyQueueChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offline-sync-status-changed'));
  }
};

export const queueReportForSync = (reportData: Partial<ServiceReport>): OfflineQueuedReport => {
  const queue = getOfflineQueue();
  const queuedItem: OfflineQueuedReport = {
    tempId: 'draft-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    reportData,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };

  queue.push(queuedItem);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }

  notifyQueueChanged();
  return queuedItem;
};

export const removeReportFromQueue = (tempId: string) => {
  const queue = getOfflineQueue().filter((item) => item.tempId !== tempId);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to update offline queue', e);
  }
  notifyQueueChanged();
};

export const syncOfflineReports = async (): Promise<{
  successCount: number;
  failedCount: number;
  results: ServiceReport[];
}> => {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { successCount: 0, failedCount: 0, results: [] };
  }

  const reportsToSync = queue.map((item) => item.reportData);

  try {
    const res = await api.batchSyncReports(reportsToSync);
    if (res.success) {
      // Clear all synced from queue
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      notifyQueueChanged();
      return {
        successCount: res.count,
        failedCount: 0,
        results: res.synced,
      };
    }
  } catch (err: any) {
    console.error('Batch sync failed, will retry individual items:', err);
  }

  // Fallback: Try one-by-one
  let successCount = 0;
  let failedCount = 0;
  const remainingQueue: OfflineQueuedReport[] = [];
  const results: ServiceReport[] = [];

  for (const item of queue) {
    try {
      const created = await api.createReport(item.reportData);
      results.push(created);
      successCount++;
    } catch (err: any) {
      failedCount++;
      remainingQueue.push({
        ...item,
        attempts: item.attempts + 1,
        lastError: err?.message || 'Gagal mengirim',
      });
    }
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  } catch (e) {
    console.error('Failed to update queue after partial sync', e);
  }

  notifyQueueChanged();
  return { successCount, failedCount, results };
};
