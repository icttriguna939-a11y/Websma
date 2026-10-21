# Website SMA Triguna 1956

Landing page sekolah + Panel Superadmin (CMS). Frontend statis (HTML/CSS/JS murni) untuk GitHub Pages; backend Google Apps Script sebagai REST API JSON dengan database Google Sheets.

- `index.html` — website publik (beranda, profil, program, prestasi, PTN, galeri, berita & mading, video, brosur, testimoni, kontak).
- `admin.html` — panel admin: kelola semua konten, pesan masuk, laporan pengunjung, migrasi & backup.
- `js/config.js` — **satu-satunya berkas yang wajib diedit**: isi `GAS_URL` dengan URL Web App `/exec`.
- `js/defaults.js` — konten bawaan, dipakai sebelum backend tersambung atau saat offline.

Cara pasang lengkap: lihat **PANDUAN-INSTALASI.md**.

Kecepatan: tampilan memakai cache perangkat lebih dulu lalu memperbarui di latar (stale-while-revalidate), semua menu sudah ada di halaman yang sama (tanpa muat ulang), simpan data bersifat optimistis dengan pembatalan otomatis bila gagal, dan setiap aksi tulis membawa ID unik sehingga aman diulang saat jaringan putus. Ketik `Core.Perf.table()` di Console untuk melihat waktu setiap panggilan.
