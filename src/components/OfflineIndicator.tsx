import React from 'react';
import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const {
    isOnline,
    pendingQueueCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
    clearSyncResult,
  } = useOnlineStatus();

  return (
    <>
      {/* Toast message if sync completed */}
      {lastSyncResult && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-xl animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{lastSyncResult}</span>
          <button
            onClick={clearSyncResult}
            className="ml-2 rounded-full p-1 hover:bg-emerald-700 text-emerald-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Offline Bar or Pending Outbox */}
      {(!isOnline || pendingQueueCount > 0) && (
        <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 flex items-center justify-between gap-3 rounded-2xl bg-slate-900/95 backdrop-blur-md px-4 py-3 text-xs sm:text-sm text-white shadow-2xl border border-slate-700/80">
          <div className="flex items-center gap-2.5">
            {!isOnline ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span className="font-medium text-amber-200">
                  Mode Offline (Tersimpan Lokal)
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-sky-400" />
                <span className="text-slate-200">
                  <strong className="text-white">{pendingQueueCount}</strong> laporan menunggu sinkronisasi
                </span>
              </>
            )}
          </div>

          {isOnline && pendingQueueCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};
