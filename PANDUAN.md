# Panduan Imperium (Supabase)

| Bagian | Tempat | Isi |
|---|---|---|
| Tampilan | GitHub Pages (repositori ini) | Halaman Imperium. Tidak berisi data pribadi. |
| Gudang data | Project Supabase milik Anda | Semua catatan, tugas, keuangan (tabel `docs`) dan berkas (Storage `imperium`). |

URL project dan *publishable key* di `imp-shim.js` boleh publik: tanpa login yang benar, aturan keamanan (RLS) tidak mengeluarkan data apa pun. **Jangan pernah** menaruh *secret key* / *service_role* di repositori ini.

## 1. Siapkan Supabase (sekali saja)
1. Supabase › **SQL Editor** › **New query** › tempel seluruh isi `supabase-schema.sql` › **Run**.
2. **Authentication › Users › Add user**: buat akun dengan email & password, centang *Auto Confirm User*.
3. **Authentication › Sign In / Providers**: matikan *Allow new users to sign up*.

## 2. Buka Imperium
Buka <https://teguhoutsiders.github.io/imperium/>, masuk dengan email & password dari langkah 1.2.

## 3. Pindahkan data dari versi Spreadsheet
1. **Sebelum** mengunggah versi Supabase: di Imperium lama, **Pengaturan › Cadangan › Ekspor cadangan penuh (.zip)**.
2. Unggah file versi Supabase ke repositori, lalu buka Imperium dan login.
3. **Pengaturan › Cadangan › Pulihkan dari cadangan** › pilih file .zip tadi. Foto dan berkas ikut diunggah ke Supabase Storage.

## Perawatan
- **Lihat data mentah**: Supabase › Table Editor › `docs` (satu baris per dokumen, isi di kolom `data`). Lebih aman mengubah lewat Imperium.
- **Keluar dari satu perangkat**: Imperium › Pengaturan › Koneksi Supabase › Keluar dari perangkat ini.
- **Ganti password**: Supabase › Authentication › Users › pilih akun › *Send password recovery* / ubah password.
- **Project dijeda**: project gratis dijeda bila ±1 minggu tidak dipakai. Workflow `.github/workflows/supabase-keepalive.yml` mengetuk Supabase setiap hari supaya hal ini tidak terjadi (bisa dijalankan manual di tab *Actions*). Kalau tetap terjeda: dashboard Supabase › *Restore project*. Data tidak hilang.
- **Cadangan rutin**: tetap ekspor cadangan .zip sesekali.

## Batasan
- Kuota paket gratis: database 500 MB, Storage 1 GB, berkas maks 50 MB per file.
- Tanpa internet, Imperium menampilkan data terakhir; perubahan disimpan di perangkat dan dikirim saat online lagi.
- Fitur yang memakai Claude langsung (examiner AI di IELTS) belum aktif di versi ini.

## Struktur kode
- `index.html`: kerangka halaman saja.
- `css/`: tampilan, berurutan sesuai nomor (urutan penting, yang belakang menimpa yang depan).
- `js/`: logika tiap menu, berurutan sesuai nomor.
- Setelah mengubah file di `js/` atau `css/`, jalankan `python3 tools/stamp.py` agar browser memuat versi baru, dan naikkan nomor cache di `sw.js` (`imperium-shell-vNN`) serta di `js/22-…` dengan nomor yang sama.
