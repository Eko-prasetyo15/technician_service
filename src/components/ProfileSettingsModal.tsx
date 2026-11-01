import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, LoaderCircle, Save, Trash2, UserRound, X } from 'lucide-react';
import { User, UserProfileUpdate } from '../types/index.ts';

interface ProfileSettingsModalProps {
  user: User;
  onSave: (data: UserProfileUpdate) => Promise<void>;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  user,
  onSave,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [specialization, setSpecialization] = useState(user.specialization);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Pilih file gambar yang valid.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran foto maksimal 10 MB.');
      return;
    }

    setError(null);
    setIsProcessingImage(true);
    const imageUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = imageUrl;
      await image.decode();

      const maxDimension = 640;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Foto tidak dapat diproses di perangkat ini.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setImageDataUrl(canvas.toDataURL('image/jpeg', 0.82));
      setRemoveImage(false);
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Foto gagal diproses.');
    } finally {
      URL.revokeObjectURL(imageUrl);
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        name,
        email,
        phone,
        specialization,
        ...(imageDataUrl ? { profileImageDataUrl: imageDataUrl } : {}),
        ...(removeImage ? { removeProfileImage: true } : {}),
      });
      setSavedSuccess(true);
      window.setTimeout(onClose, 800);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Profil gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewUrl = imageDataUrl || (removeImage ? '' : user.profileImageUrl || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-sky-400" />
            <h2 className="text-base font-bold">Edit Profil</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[85vh] space-y-4 overflow-y-auto p-5 text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-sky-100 bg-slate-100 text-slate-400">
              {previewUrl ? (
                <img src={previewUrl} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-11 w-11" />
              )}
              {isProcessingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-white">
                  <LoaderCircle className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage || isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                {previewUrl ? 'Ganti foto' : 'Pilih foto'}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageDataUrl(null);
                    setRemoveImage(true);
                  }}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus foto
                </button>
              )}
            </div>
            <p className="text-center text-[11px] text-slate-500">Format gambar apa pun, maksimal 10 MB.</p>
          </div>

          <div>
            <label htmlFor="profile-name" className="mb-1 block font-semibold text-slate-700">Nama</label>
            <input id="profile-name" required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div>
            <label htmlFor="profile-email" className="mb-1 block font-semibold text-slate-700">Email</label>
            <input id="profile-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-phone" className="mb-1 block font-semibold text-slate-700">Nomor telepon</label>
              <input id="profile-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
            <div>
              <label htmlFor="profile-specialization" className="mb-1 block font-semibold text-slate-700">Spesialisasi</label>
              <input id="profile-specialization" value={specialization} onChange={(event) => setSpecialization(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
            </div>
          </div>

          {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
          {savedSuccess && (
            <div role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Profil berhasil diperbarui.
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              Batal
            </button>
            <button type="submit" disabled={isSaving || isProcessingImage} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 disabled:cursor-wait disabled:opacity-60">
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
