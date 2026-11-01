import { useEffect, useState, useCallback } from 'react';
import { getOfflineQueue, syncOfflineReports } from '../services/offlineSync.ts';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  const updateQueueCount = useCallback(() => {
    const queue = getOfflineQueue();
    setPendingQueueCount(queue.length);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    try {
      const res = await syncOfflineReports();
      if (res.successCount > 0) {
        setLastSyncResult(`${res.successCount} laporan berhasil disinkronkan ke server.`);
      } else if (res.failedCount > 0) {
        setLastSyncResult(`Gagal menyinkronkan ${res.failedCount} laporan. Akan dicoba lagi.`);
      }
    } catch (e) {
      console.error('Auto sync error', e);
    } finally {
      setIsSyncing(false);
      updateQueueCount();
    }
  }, [isSyncing, updateQueueCount]);

  useEffect(() => {
    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when reconnecting
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChanged = () => {
      updateQueueCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-sync-status-changed', handleQueueChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-sync-status-changed', handleQueueChanged);
    };
  }, [triggerSync, updateQueueCount]);

  return {
    isOnline,
    pendingQueueCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
    clearSyncResult: () => setLastSyncResult(null),
  };
}
