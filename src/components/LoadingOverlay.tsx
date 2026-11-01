import React from 'react';
import { LoaderCircle } from 'lucide-react';

export const LoadingOverlay: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
    role="status"
    aria-live="polite"
    aria-label={label}
  >
    <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
      <LoaderCircle className="h-5 w-5 animate-spin text-sky-600" />
      <span className="text-sm font-semibold text-slate-800">{label}</span>
    </div>
  </div>
);
