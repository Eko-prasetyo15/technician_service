# Internal Technician Service App

Aplikasi internal untuk mengelola peralatan, kategori, jadwal maintenance, laporan teknisi, dan pengingat servis.

## Menjalankan Secara Lokal

**Prasyarat:** Node.js, database PostgreSQL Neon, dan akun Cloudinary.

1. Pasang dependency:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env.local`, lalu isi variabel `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, dan `CLOUDINARY_API_SECRET`.
3. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

Saat pertama kali berjalan, server membuat tabel yang diperlukan di Neon. Jika `data/database.json` tersedia dan Neon masih kosong, datanya akan dimigrasikan ke Neon. Foto laporan disimpan di Cloudinary; URL dan ID fotonya disimpan di Neon.

Simpan kredensial hanya di `.env.local` untuk pengembangan lokal. Untuk deployment, tambahkan variabel yang sama melalui pengaturan environment variables/secrets pada layanan hosting. Jangan gunakan awalan `VITE_` untuk kredensial server.

## Deploy ke Vercel

1. Import repository ini ke Vercel dan gunakan pengaturan build default dari `vercel.json`.
2. Di **Project Settings → Environment Variables**, tambahkan `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, dan `CLOUDINARY_API_SECRET` untuk environment yang digunakan.
3. Redeploy project setelah menyimpan environment variables.
4. Verifikasi endpoint `https://<domain-anda>/api/health`; respons yang benar berisi status `ok`.

## Perintah Lain

- `npm run build` — membuat build produksi.
- `npm run start` — menjalankan server aplikasi.
- `npm run lint` — memeriksa tipe TypeScript.
