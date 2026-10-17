# Panduan Instalasi — Website SMA Triguna 1956

Website ini terdiri dari dua bagian:

| Bagian | Isi | Tempat |
|---|---|---|
| **Backend** | `Kode.gs`, `Migrasi.gs`, `appsscript.json` | Google Apps Script (akun Google sekolah) |
| **Frontend** | Isi ZIP `sma-triguna-web.zip` (landing page + panel admin) | GitHub Pages (gratis), domain `smtriguna.id` |

Data disimpan di Google Sheets, foto dan brosur di Google Drive. Semua dibuat otomatis oleh skrip.

Ikuti tahapnya berurutan. Total waktu sekitar 30–45 menit.

---

## Tahap 1 — Pasang Backend (Google Apps Script)

> Gunakan **akun Google milik sekolah** yang akan menjadi pemilik data. Bila nanti mengimpor data dari app lama, pakai akun yang **sama** dengan pemilik app lama agar foto/berkas Drive lama tetap terbaca.

1. Buka <https://script.google.com> → **New project**. Ganti nama proyek menjadi `SMA Triguna 1956 API`.
2. Di berkas `Code.gs` bawaan: hapus semua isinya, lalu tempel seluruh isi **`Kode.gs`**. Ganti nama berkasnya menjadi `Kode` (opsional).
3. Klik **+** di samping *Files* → **Script** → beri nama `Migrasi` → tempel seluruh isi **`Migrasi.gs`**.
4. Klik ⚙️ **Project Settings** → centang **Show "appsscript.json" manifest file in editor**. Kembali ke **Editor**, buka `appsscript.json`, ganti isinya dengan berkas **`appsscript.json`** dari paket ini.
5. Klik 💾 **Save** (Ctrl+S).

### 1a — Jalankan setup sekali

1. Di toolbar atas, pilih fungsi **`setupAppEnvironment`** → klik **▶ Run**.
2. Google meminta izin: **Review permissions** → pilih akun → bila muncul *Google hasn't verified this app* klik **Advanced** → **Go to SMA Triguna 1956 API (unsafe)** → **Allow**. Ini normal untuk skrip milik sendiri.
3. Tunggu sampai *Execution completed*. Buka **Execution log** (di bawah editor). Anda akan melihat:

```
✅ Setup baru selesai.
   Spreadsheet : https://docs.google.com/spreadsheets/d/…
   Folder Drive: https://drive.google.com/drive/folders/…
   Login admin : username = admin | password = Triguna1234!
```

4. **Catat password admin** tersebut. Password hanya tampil di log ini.

Setup otomatis membuat:
- Folder Drive **SMA Triguna 1956** berisi subfolder *Foto Kegiatan, Foto Fasilitas, Foto Prestasi, Brosur, Logo & Aset, Backup Database*.
- Spreadsheet database dengan 17 sheet konten (Beranda, Profil, Program, Prestasi, … Testimoni) yang sudah terisi contoh dari PRD, plus sheet Pesan, Pengunjung, Logs, dan AppConfig.
- Trigger otomatis tiap 10 menit untuk mencatat pengunjung dan log.

> `setupAppEnvironment` aman dijalankan ulang: tidak menggandakan data atau trigger. Lupa password? Jalankan fungsi **`resetAdminPassword`**, password baru muncul di log.

### 1b — Deploy sebagai Web App

1. Klik **Deploy** → **New deployment** → ikon ⚙️ di *Select type* → **Web app**.
2. Isi:
   - **Description:** `v1`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
3. Klik **Deploy** → salin **Web app URL** (berakhiran `/exec`).
4. Uji: buka `URL…/exec?ping=1` di browser. Harus tampil `{"success":true,"data":{"pong":true,…}}`.

> **Update backend nanti:** setelah mengubah kode, jangan buat deployment baru (URL akan berubah). Pakai **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. URL tetap sama.

---

## Tahap 2 — Isi URL Backend di Frontend

1. Ekstrak `sma-triguna-web.zip`, misalnya ke `Documents\sma-triguna-web`.
2. Buka `js\config.js` dengan Notepad, isi `GAS_URL` dengan URL dari Tahap 1b:

```js
window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfy…/exec',
  SITE_URL: 'https://smtriguna.id'
};
```

3. Simpan. Uji lokal: klik ganda `index.html`. Halaman tampil lengkap (selama `GAS_URL` kosong pun halaman tetap tampil memakai konten bawaan).

---

## Tahap 3 — Unggah ke GitHub Pages

### 3a — Persiapan (sekali saja)
1. Pasang Git: <https://git-scm.com/download/win> (pengaturan default). Buka **PowerShell**, ketik `git --version` untuk memastikan.
2. Buat akun di <https://github.com> bila belum ada.
3. Atur identitas Git:
```powershell
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

### 3b — Buat repository
Di github.com: tombol **+** → **New repository** → nama misalnya `smtriguna` → pilih **Public** → **jangan** centang README/.gitignore/license → **Create repository**.

### 3c — Masuk ke folder yang BENAR

Folder kerja adalah **folder hasil ekstraksi ZIP itu sendiri**, yaitu folder yang langsung berisi `index.html`:

```
Documents\sma-triguna-web\      ← ✅ git init DI SINI
├── index.html
├── admin.html
├── README.md
├── PANDUAN-INSTALASI.md
├── CNAME
├── assets\
├── css\
└── js\
```

Buka folder itu di File Explorer, klik address bar, ketik `powershell`, Enter. Lalu cek:

```powershell
dir
```

**Wajib** terlihat `index.html` di daftar. Kalau yang terlihat malah satu folder `sma-triguna-web`, masuk dulu dengan `cd sma-triguna-web`, lalu `dir` lagi. Jangan lanjut sebelum `index.html` terlihat.

### 3d — Kirim ke GitHub (satu per satu)
```powershell
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/smtriguna.git
git push -u origin main
```
Perhatikan **titik** di akhir `git add .`.

Saat `git push` meminta login:
- **Username:** username GitHub.
- **Password:** **Personal Access Token**, bukan password akun. Buat di <https://github.com/settings/tokens> → *Generate new token (classic)* → centang **repo** → *Generate* → salin token `ghp_…`.
- Saat menempel token, layar tetap kosong. Itu normal, tekan Enter.

Berhasil bila muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### 3e — Aktifkan Pages
Repo di GitHub → **Settings** → **Pages** → *Source:* **Deploy from a branch** → *Branch:* **main** / **(root)** → **Save**. Tunggu 1–2 menit; muncul *Your site is live at …*.

Periksa di halaman repo: `index.html` ada di root, ada folder `css/` dan `js/`, tidak ada berkas `.gs`.

### 3f — Domain smtriguna.id
ZIP sudah berisi berkas `CNAME` berisi `smtriguna.id`.
1. Di pengelola DNS domain, tambahkan:
   - 4 record **A** untuk `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Record **CNAME** untuk `www` → `USERNAME.github.io`
2. Di **Settings → Pages → Custom domain** isi `smtriguna.id` → Save. Setelah DNS aktif (bisa beberapa jam), centang **Enforce HTTPS**.

> Belum punya domain atau ingin mencoba dulu? Hapus berkas `CNAME` sebelum `git add .`; situs tetap bisa dibuka di `https://USERNAME.github.io/smtriguna/`.

### 3g — Update berikutnya
Dari folder yang sama:
```powershell
git add .
git commit -m "Perubahan tampilan"
git push
```
Konten (teks, foto, berita) **tidak perlu** lewat Git: cukup ubah dari Panel Admin.

---

## Tahap 4 — Masuk Panel Admin

1. Buka `https://smtriguna.id/admin.html` (atau `…github.io/smtriguna/admin.html`).
2. Login: username `admin`, password dari log Tahap 1a.
3. Segera buka **Sistem → Pengaturan Situs → Keamanan Akun** dan ganti password. Semua perangkat lain yang sedang login otomatis keluar.

Yang bisa dikelola:
- **Konten Utama:** Beranda (hero, statistik), Tentang Kami (visi, misi, sejarah), Program & Jurusan, Prestasi, Alumni Lolos PTN, Lulusan PTN.
- **Galeri & Informasi:** Fasilitas, Kegiatan, Berita, Info Mading, Video Promosi (tautan YouTube), Brosur (PDF), Penghargaan, Testimoni, FAQ.
- **Interaksi:** Pesan Masuk dari formulir kontak (balas langsung via WhatsApp/Email), Laporan Pengunjung harian/bulanan + unduh CSV.
- **Sistem:** Kontak & Peta, Pengaturan Situs (tautan PPDB, SEO, password), Migrasi & Backup, Log Aktivitas.

Setiap data punya status **Tayang/Draft**; Draft tidak tampil di website. Foto diunggah langsung dari panel (dikompres otomatis, maks 5 MB) ke folder Drive yang sesuai.

---

## Tahap 5 — Import Data dari App Lama

App lama **tidak disentuh**; spreadsheet lama hanya dibaca.

1. Panel Admin → **Sistem → Migrasi & Backup**.
2. Klik **Buat Backup Sekarang** dulu (pengaman).
3. Di bagian **Migrasi dari App Lama**, tempel URL spreadsheet app lama.
4. Centang data yang ingin diimpor (Logs default mati).
5. Klik **Pindai (Dry-run)**. Tabel menunjukkan jumlah yang akan *ditambah / diperbarui / dilewati*, tanpa menulis apa pun. Baca juga daftar peringatan.
6. Bila sesuai, klik **Jalankan Import**.

Cara kerja:
- Kolom dicocokkan dari **nama header**, termasuk nama lama yang umum (mis. "Nama Prestasi" → judul, "ID Foto"/"Link Foto" → foto, "No WA" → whatsapp).
- Aman diulang: data yang sama tidak digandakan.
- Pengaturan yang masih berisi contoh bawaan akan diisi dari app lama; yang sudah Anda ubah tidak ditimpa (kecuali opsi *Timpa data yang sudah ada* dinyalakan).
- Nomor WA dinormalkan ke format `62…`; tautan "bagikan" Google Drive diubah menjadi ID berkas.

Ada juga **Impor dari Berkas**: JSON (hasil *Ekspor JSON*) atau CSV per sheet (tersedia tombol *Template CSV*).

### Cutover (pindah ke app baru)
1. Pasang app baru dan import seperti di atas. Periksa isinya, foto, dan tautan.
2. Tepat sebelum mengumumkan alamat baru, klik **Jalankan Import** sekali lagi (delta sync) untuk menangkap data yang masuk ke app lama selama transisi.
3. Arahkan domain ke GitHub Pages (Tahap 3f) dan umumkan.
4. Arsipkan deployment lama. Datanya tetap aman di spreadsheet lama.

---

## Tahap 6 — Backup & Restore

- **Buat Backup Sekarang:** menyalin utuh spreadsheet ke folder *Backup Database* di Drive.
- **Backup otomatis harian:** nyalakan saklarnya; berjalan pukul 01.00 WIB. Pilih berapa backup terakhir yang disimpan (7/14/30/60); yang lebih lama dibuang otomatis.
- **Pulihkan:** di *Daftar Backup*, klik **Pulihkan**. Panel menampilkan ringkasan perubahan dulu, dan kondisi saat ini otomatis dibackup sebelum dipulihkan, jadi restore bisa dibatalkan dengan memulihkan backup "Sebelum restore".
- **Ekspor JSON:** unduh seluruh data sebagai satu berkas untuk arsip di komputer.

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Situs GitHub 404 | `git init` dijalankan di folder yang salah. Pastikan `index.html` ada di root repo (lihat 3c). |
| Situs tampil tanpa warna/gaya | Struktur folder rusak (upload lewat web GitHub). Selalu push lewat terminal. |
| Panel admin: "GAS_URL belum diisi di js/config.js" | Isi `GAS_URL` di `js/config.js`, lalu `git add . / commit / push`. |
| Login gagal terus / "terlalu banyak percobaan" | Tunggu 15 menit, atau jalankan `resetAdminPassword` di editor Apps Script. |
| Perubahan kode backend tidak berlaku | Belum membuat versi baru: Manage deployments → Edit → New version. |
| Foto tidak tampil | Berkas Drive harus milik akun yang sama dan dibagikan "Siapa saja yang memiliki link". Unggahan dari panel sudah otomatis. |
| Halaman masih versi lama | Cache browser: tekan Ctrl+Shift+R. |

---

## Batasan yang perlu diketahui

- **Login admin memakai username + password**, bukan login Google. Password disimpan sebagai hash di Script Properties.
- **Logo** yang dipakai sekarang adalah logo perisai sementara (`assets/logo.svg`) karena berkas logo asli belum diberikan. Ganti berkas itu (nama sama), atau isi kolom logo di Pengaturan Situs dengan ID foto Drive.
- **Foto contoh** berasal dari mockup desain (alamat `lh3.googleusercontent.com`) dan bisa kedaluwarsa. Ganti dengan foto sekolah asli lewat panel.
- **Sesi login tidak ikut dimigrasi**; admin cukup login ulang di app baru.
- Hitungan pengunjung = perangkat unik per hari, diperbarui tiap 10 menit.
- Batas Google Apps Script: satu eksekusi maksimal 6 menit. Import data yang sangat besar (puluhan ribu baris per sheet) sebaiknya dijalankan per beberapa sheet.
