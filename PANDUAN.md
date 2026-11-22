# Panduan pemasangan Imperium

Imperium terdiri dari dua bagian:

| Bagian | Tempat | Isi |
|---|---|---|
| Tampilan | GitHub Pages (repositori ini) | Halaman Imperium. Tidak berisi data pribadi. |
| Gudang data | Google Spreadsheet + Apps Script + Google Drive milik Anda | Semua catatan, tugas, keuangan, dan berkas. |

Alamat gudang data dan kunci akses **tidak pernah** ditulis di repositori ini. Keduanya diisi sekali di tiap perangkat.

---

## 1. Siapkan Spreadsheet (sekali saja)

1. Buka <https://sheets.new> untuk membuat Spreadsheet baru. Beri nama **Imperium Data**.
2. Menu **Extensions › Apps Script**.
3. Hapus isi `Code.gs` yang ada, lalu tempel seluruh isi file [`apps-script/Code.gs`](apps-script/Code.gs) dari repositori ini. Tekan **Save** (ikon disket).
4. Kembali ke tab Spreadsheet, lalu **muat ulang** halaman. Akan muncul menu **Imperium** di atas.
5. Klik **Imperium › Atur kunci akses**.
   - Google akan meminta izin (pilih akun Anda › *Advanced* › *Go to … (unsafe)* › *Allow*). Peringatan ini normal untuk skrip buatan sendiri.
   - Isi kunci minimal 10 karakter, campuran huruf dan angka. **Simpan kunci ini di tempat aman.**
6. Kembali ke Apps Script › tombol **Deploy › New deployment**.
   - *Select type*: **Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Tekan **Deploy**, lalu salin **Web app URL** (berakhiran `/exec`).

> "Anyone" artinya alamatnya bisa dihubungi, tapi tanpa kunci yang benar tidak ada data yang keluar. Percobaan kunci yang salah dicatat di sheet **Log akses**, dan setelah 8 kali salah akses dikunci 15 menit.

## 2. Buka Imperium

1. Buka <https://teguhoutsiders.github.io/imperium/>
2. Isi **alamat web app** (langkah 1.6) dan **kunci akses** (langkah 1.5), lalu **Masuk**.

## 3. Pindahkan data dari Imperium lama (Claude)

1. Di Imperium lama (artifak Claude): **Pengaturan › Cadangan › Ekspor cadangan penuh (.zip)**.
2. Di Imperium baru: **Pengaturan › Cadangan › Pulihkan dari cadangan**, lalu pilih file .zip tadi.
3. Tunggu sampai selesai. Foto dan berkas ikut diunggah ke folder Drive **Imperium Files**.

## 4. Pasang di HP seperti aplikasi

- **Android (Chrome)**: buka alamat Imperium › menu ⋮ › **Tambahkan ke layar utama** / **Instal aplikasi**.
- **iPhone (Safari)**: tombol Bagikan › **Tambahkan ke Layar Utama**.

Imperium akan terbuka layar penuh, tanpa bilah alamat dan tanpa bilah peringatan Apps Script.

---

## Perawatan

- **Ganti kunci**: Spreadsheet › **Imperium › Atur kunci akses**. Semua perangkat harus masuk ulang.
- **Keluar dari satu perangkat**: Imperium › **Pengaturan › Koneksi Spreadsheet › Keluar dari perangkat ini**.
- **Terkunci karena salah kunci**: Spreadsheet › **Imperium › Buka kunci**.
- **Lihat data sebagai tabel biasa**: Spreadsheet › **Imperium › Perbarui tabel bacaan**. Sheet "Tabel …" hanya salinan; mengubahnya tidak mengubah Imperium.
- **Jangan mengedit sheet `Data` secara manual.** Sheet itu dipakai langsung oleh Imperium.
- **Memperbarui kode Apps Script**: tempel kode baru › Save › **Deploy › Manage deployments › ✏️ Edit › Version: New version › Deploy**. Alamat `/exec` tetap sama.
- Aktifkan **verifikasi 2 langkah** di akun Google dan GitHub.

## Batasan

- Perubahan antarperangkat muncul dalam ±5 detik (bukan instan).
- Tanpa internet, Imperium menampilkan data terakhir; perubahan disimpan di perangkat dan dikirim saat online lagi.
- Fitur yang memakai Claude langsung (examiner AI di IELTS) belum aktif di versi ini.
