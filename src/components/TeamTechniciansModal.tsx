import React, { useState } from 'react';
import { LoaderCircle, Plus, UserRound, X } from 'lucide-react';
import { User } from '../types/index.ts';

interface TeamTechniciansModalProps {
  technicians: User[];
  onCreateTechnician: (data: Partial<User>) => Promise<User>;
  onClose: () => void;
}

export const TeamTechniciansModal: React.FC<TeamTechniciansModalProps> = ({
  technicians,
  onCreateTechnician,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onCreateTechnician({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        specialization: specialization.trim(),
      });
      setName('');
      setEmail('');
      setPhone('');
      setSpecialization('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Teknisi gagal didaftarkan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-sky-400" />
            <h2 className="text-base font-bold">Tim Teknisi</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-3">
            <h3 className="font-bold text-slate-900">Daftarkan bawahan</h3>
            <p className="text-xs text-slate-500">Teknisi yang didaftarkan bisa dipilih sebagai pelaksana saat membuat jadwal maintenance. Akun login tidak dibuat.</p>
            <div>
              <label htmlFor="technician-name" className="mb-1 block text-xs font-semibold text-slate-700">Nama teknisi</label>
              <input id="technician-name" required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div>
              <label htmlFor="technician-email" className="mb-1 block text-xs font-semibold text-slate-700">Email</label>
              <input id="technician-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div>
              <label htmlFor="technician-phone" className="mb-1 block text-xs font-semibold text-slate-700">Nomor telepon</label>
              <input id="technician-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div>
              <label htmlFor="technician-specialization" className="mb-1 block text-xs font-semibold text-slate-700">Keahlian / spesialisasi</label>
              <input id="technician-specialization" value={specialization} onChange={(event) => setSpecialization(event.target.value)} placeholder="Contoh: HVAC, Elektrikal" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{error}</div>}
            <button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-wait disabled:opacity-60">
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Daftarkan teknisi
            </button>
          </form>

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Teknisi terdaftar ({technicians.length})</h3>
            <div className="space-y-2">
              {technicians.map((technician) => (
                <div key={technician.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-800">{technician.name}</div>
                    <div className="truncate text-xs text-slate-500">{technician.specialization || 'Belum ada spesialisasi'}</div>
                    <div className="truncate text-[11px] text-slate-400">{technician.phone || technician.email}</div>
                  </div>
                </div>
              ))}
              {technicians.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">Belum ada teknisi aktif.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
