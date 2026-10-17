/* ============================================================
   PANEL SUPERADMIN — SMA Triguna 1956
   SPA hash router • halaman "hidup" (tidak dibangun ulang bila data sama)
   Optimistic UI + rollback • login langsung membawa seluruh data (1 panggilan)
   ============================================================ */
(function () {
  'use strict';
  const { icon, esc, nl2br, imgUrl, fileUrls, ytId, ytThumb, fmtDate, fmtDateTime, Store, toast, api, debounce, hashStr } = Core;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // ============================================================
  // KONFIGURASI FORMULIR PER SHEET
  // ============================================================
  const ST = { k: 'status', label: 'Status Tayang', type: 'status' };
  const TINGKAT = ['Sekolah', 'Kota', 'Provinsi', 'DKI Jakarta', 'Nasional', 'Internasional'];
  const FORMS = {
    Program: { title: 'Program & Jurusan', icon: 'cap', desc: 'Kartu program/jurusan yang tampil di section Program.', anchor: 'program', kind: 'aset',
      list: { img: 'foto', title: 'nama', sub: 'deskripsi' },
      fields: [{ k: 'nama', label: 'Nama Program', req: 1 }, { k: 'deskripsi', label: 'Deskripsi', type: 'textarea', req: 1 }, { k: 'foto', label: 'Foto', type: 'image' }, { k: 'tautan', label: 'Tautan Detail (opsional)', type: 'url', hint: 'Kosongkan agar detail tampil sebagai jendela di website.' }, ST] },
    Prestasi: { title: 'Prestasi Siswa & Guru', icon: 'trophy', desc: 'Kelola daftar pencapaian, kejuaraan, dan dokumentasi piala sekolah.', anchor: 'prestasi', kind: 'prestasi',
      list: { img: 'foto', title: 'judul', sub: 'peraih', tags: ['tingkat', 'bidang'], col: 'tahun' }, filters: ['tahun', 'bidang'],
      fields: [{ k: 'judul', label: 'Judul Prestasi', req: 1 }, { k: 'peraih', label: 'Peraih (nama siswa/tim)' }, { k: 'tingkat', label: 'Tingkat', list: TINGKAT, half: 1 }, { k: 'bidang', label: 'Bidang', list: ['Sains', 'Olahraga', 'Bahasa', 'Teknologi', 'Seni Budaya', 'Keagamaan', 'Lainnya'], half: 1 }, { k: 'tahun', label: 'Tahun', type: 'number', half: 1, def: () => String(new Date().getFullYear()) }, { k: 'keterangan', label: 'Keterangan', type: 'textarea' }, { k: 'foto', label: 'Foto / Poster', type: 'image' }, ST] },
    Fasilitas: { title: 'Fasilitas', icon: 'building', desc: 'Galeri fasilitas sekolah.', anchor: 'galeri', kind: 'fasilitas',
      list: { img: 'foto', title: 'nama', sub: 'deskripsi' },
      fields: [{ k: 'nama', label: 'Nama Fasilitas', req: 1 }, { k: 'deskripsi', label: 'Deskripsi', type: 'textarea' }, { k: 'foto', label: 'Foto', type: 'image' }, ST] },
    Kegiatan: { title: 'Kegiatan', icon: 'calendar', desc: 'Dokumentasi kegiatan sekolah (foto dan video).', anchor: 'galeri', kind: 'kegiatan',
      list: { img: 'foto', title: 'judul', sub: 'deskripsi', col: 'tanggal' },
      fields: [{ k: 'judul', label: 'Judul Kegiatan', req: 1 }, { k: 'tanggal', label: 'Tanggal', type: 'date', def: Core.today }, { k: 'deskripsi', label: 'Deskripsi', type: 'textarea' }, { k: 'foto', label: 'Foto', type: 'image' }, { k: 'video', label: 'Tautan Video YouTube (opsional)', type: 'youtube' }, ST] },
    Berita: { title: 'Berita & Artikel', icon: 'news', desc: 'Berita diurutkan dari tanggal terbaru. Hanya berstatus Tayang yang tampil.', anchor: 'berita', kind: 'kegiatan', noReorder: 1,
      list: { img: 'gambar', title: 'judul', sub: 'penulis', tags: ['kategori'], col: 'tanggal' }, filters: ['kategori'],
      fields: [{ k: 'judul', label: 'Judul Berita', req: 1 }, { k: 'kategori', label: 'Kategori', list: ['Akademik & AI', 'Prestasi Siswa', 'Seni & Budaya', 'PPDB & Info Sekolah', 'Kegiatan'], half: 1 }, { k: 'tanggal', label: 'Tanggal Terbit', type: 'date', req: 1, half: 1, def: Core.today }, { k: 'ringkasan', label: 'Ringkasan', type: 'textarea', rows: 2, hint: 'Satu-dua kalimat untuk kartu berita.' }, { k: 'isi', label: 'Isi Berita', type: 'textarea', rows: 10, req: 1, hint: 'Pisahkan paragraf dengan satu baris kosong.' }, { k: 'gambar', label: 'Gambar Utama', type: 'image' }, { k: 'penulis', label: 'Penulis', half: 1, def: () => 'Humas SMA Triguna' }, { k: 'unggulan', label: 'Berita Unggulan', type: 'yesno', half: 1 }, ST] },
    Mading: { title: 'Info Mading', icon: 'pin2', desc: 'Papan pengumuman ala mading. Atur urutan, warna kertas, dan sematkan info penting.', anchor: 'berita',
      list: { title: 'judul', sub: 'isi', tags: ['warna'], col: 'tanggal' },
      fields: [{ k: 'judul', label: 'Judul Info', req: 1 }, { k: 'isi', label: 'Isi', type: 'textarea', req: 1 }, { k: 'tanggal', label: 'Tanggal', type: 'date', half: 1, def: Core.today }, { k: 'warna', label: 'Warna Kertas', type: 'select', options: ['Kuning', 'Biru', 'Merah', 'Hijau'], half: 1 }, { k: 'sematkan', label: 'Sematkan di atas', type: 'yesno' }, ST] },
    Video: { title: 'Video Promosi', icon: 'video', desc: 'Video dari YouTube (publik/tidak terdaftar). Tandai satu sebagai unggulan.', anchor: 'video', kind: 'aset',
      list: { img: 'thumbnail', imgFb: 'tautan', title: 'judul', sub: 'jenis', tags: ['durasi'] },
      fields: [{ k: 'judul', label: 'Judul Video', req: 1 }, { k: 'jenis', label: 'Kategori Video', type: 'select', options: ['Company Profile', 'Virtual Tour', 'Kegiatan'], half: 1 }, { k: 'durasi', label: 'Durasi (mm:dd)', half: 1, ph: '04:25' }, { k: 'tautan', label: 'Tautan YouTube', type: 'youtube', req: 1 }, { k: 'deskripsi', label: 'Deskripsi Singkat', type: 'textarea', rows: 3 }, { k: 'thumbnail', label: 'Thumbnail Kustom (opsional)', type: 'image', hint: 'Kosongkan untuk memakai thumbnail YouTube.' }, { k: 'unggulan', label: 'Jadikan Video Unggulan di Beranda', type: 'yesno' }, ST] },
    Brosur: { title: 'Brosur Sekolah', icon: 'file', desc: 'Brosur PDF yang dapat dilihat dan diunduh pengunjung.', anchor: 'brosur',
      list: { title: 'judul', sub: 'keterangan', file: 'file' },
      fields: [{ k: 'judul', label: 'Judul Brosur', req: 1 }, { k: 'file', label: 'Berkas PDF', type: 'pdf', req: 1 }, { k: 'keterangan', label: 'Keterangan', type: 'textarea', rows: 2 }, ST] },
    Penghargaan: { title: 'Penghargaan & Kerja Sama', icon: 'award', desc: 'Penghargaan institusi dan mitra kerja sama.', anchor: 'penghargaan', kind: 'prestasi',
      list: { img: 'foto', title: 'nama', sub: 'institusi', col: 'tanggal' },
      fields: [{ k: 'nama', label: 'Nama Penghargaan / Kerja Sama', req: 1 }, { k: 'institusi', label: 'Institusi Pemberi / Mitra' }, { k: 'tanggal', label: 'Tanggal', type: 'date' }, { k: 'foto', label: 'Foto / Logo', type: 'image' }, ST] },
    'Lulusan PTN': { title: 'Lulusan PTN', icon: 'globe', desc: 'Logo PTN tujuan alumni yang bergulir otomatis.', anchor: 'ptn', kind: 'aset',
      list: { img: 'logo', title: 'nama_ptn', sub: 'singkatan', col: 'jumlah_siswa' },
      fields: [{ k: 'nama_ptn', label: 'Nama PTN', req: 1 }, { k: 'singkatan', label: 'Singkatan', half: 1 }, { k: 'jumlah_siswa', label: 'Jumlah Siswa Diterima', type: 'number', half: 1 }, { k: 'logo', label: 'Logo PTN', type: 'image' }, ST] },
    Alumni: { title: 'Alumni Lolos PTN', icon: 'cap', desc: 'Kartu sorotan siswa yang lolos PTN favorit.', anchor: 'lolos-ptn', kind: 'prestasi',
      list: { img: 'foto', title: 'nama', sub: 'jurusan', tags: ['singkatan', 'jalur'] },
      fields: [{ k: 'nama', label: 'Nama Siswa', req: 1 }, { k: 'ptn', label: 'Perguruan Tinggi', req: 1 }, { k: 'singkatan', label: 'Singkatan PTN', half: 1 }, { k: 'jalur', label: 'Jalur & Tahun', half: 1, ph: 'SNBP 2025' }, { k: 'jurusan', label: 'Jurusan / Fakultas' }, { k: 'foto', label: 'Foto', type: 'image' }, ST] },
    Testimoni: { title: 'Testimoni Alumni', icon: 'quote', desc: 'Kisah dan kesan alumni.', anchor: 'testimoni', kind: 'aset',
      list: { img: 'foto', title: 'nama', sub: 'keterangan' },
      fields: [{ k: 'nama', label: 'Nama', req: 1 }, { k: 'keterangan', label: 'Keterangan', ph: 'Alumni 2023 • Mahasiswa FK UI' }, { k: 'isi', label: 'Isi Testimoni', type: 'textarea', req: 1 }, { k: 'foto', label: 'Foto', type: 'image' }, ST] },
    FAQ: { title: 'FAQ', icon: 'info', desc: 'Pertanyaan yang sering diajukan (tampil di footer).', anchor: 'top',
      list: { title: 'pertanyaan', sub: 'jawaban' },
      fields: [{ k: 'pertanyaan', label: 'Pertanyaan', req: 1 }, { k: 'jawaban', label: 'Jawaban', type: 'textarea', req: 1 }, ST] }
  };
  const SINGLES = {
    Beranda: { title: 'Beranda (Hero)', icon: 'home', desc: 'Judul besar, gambar latar, dan angka statistik di bagian paling atas website.', anchor: 'beranda', kind: 'aset',
      groups: [['Konten Hero', [{ k: 'badge', label: 'Teks Lencana' }, { k: 'judul', label: 'Judul Utama', req: 1 }, { k: 'subjudul', label: 'Subjudul', type: 'textarea', rows: 3 }, { k: 'gambar_latar', label: 'Gambar Latar', type: 'image' }]],
        ['Statistik & Sambutan', [{ k: 'statistik', label: 'Angka Statistik', type: 'textarea', rows: 4, hint: 'Satu baris per angka, format: angka | label. Contoh: 98% | Tembus PTN Favorit' }, { k: 'teks_sambutan', label: 'Teks Sambutan Singkat', type: 'textarea', rows: 3 }]]] },
    Profil: { title: 'Tentang Kami', icon: 'info', desc: 'Sejarah, visi, misi, moto, kepala sekolah, statistik, dan profil pembinaan siswa.', anchor: 'tentang', kind: 'aset',
      groups: [['Profil Sekolah', [{ k: 'judul', label: 'Judul Section' }, { k: 'sejarah', label: 'Sejarah / Profil Singkat', type: 'textarea', rows: 5 }, { k: 'visi', label: 'Visi', type: 'textarea', rows: 2 }, { k: 'misi', label: 'Misi', type: 'textarea', rows: 5, hint: 'Satu baris per poin misi.' }, { k: 'moto', label: 'Moto' }]],
        ['Kepala Sekolah', [{ k: 'kepsek_nama', label: 'Nama', half: 1 }, { k: 'kepsek_jabatan', label: 'Jabatan', half: 1 }, { k: 'kepsek_foto', label: 'Foto', type: 'image' }, { k: 'sambutan_kepsek', label: 'Kutipan Sambutan', type: 'textarea', rows: 3 }]],
        ['Statistik Sekolah', [{ k: 'jumlah_siswa', label: 'Jumlah Siswa', half: 1 }, { k: 'jumlah_guru', label: 'Jumlah Guru', half: 1 }, { k: 'jumlah_kelas', label: 'Ruang Kelas', half: 1 }, { k: 'jumlah_lab', label: 'Laboratorium', half: 1 }]],
        ['Profil Siswa (Pembinaan)', [{ k: 'pembinaan_judul', label: 'Judul' }, { k: 'pembinaan_teks', label: 'Teks', type: 'textarea', rows: 4 }, { k: 'pembinaan_poin', label: 'Poin Keunggulan', type: 'textarea', rows: 4, hint: 'Satu baris per poin.' }, { k: 'pembinaan_foto', label: 'Foto', type: 'image' }, { k: 'pembinaan_stat', label: 'Statistik', type: 'textarea', rows: 4, hint: 'Format: angka | label per baris.' }]]] },
    Kontak: { title: 'Kontak & Peta', icon: 'pin', desc: 'Alamat, telepon, WhatsApp, peta, jam operasional, dan media sosial. Perubahan langsung tampil di website.', anchor: 'kontak',
      groups: [['Kontak', [{ k: 'alamat', label: 'Alamat', type: 'textarea', rows: 2 }, { k: 'telepon', label: 'Telepon', half: 1 }, { k: 'email', label: 'Email', type: 'email', half: 1 }, { k: 'whatsapp', label: 'Nomor WhatsApp', half: 1, hint: 'Boleh 08… atau 62…, otomatis disesuaikan.' }, { k: 'jam_operasional', label: 'Jam Operasional', type: 'textarea', rows: 2 }]],
        ['Peta', [{ k: 'maps_url', label: 'Tautan Google Maps', type: 'url' }, { k: 'maps_embed', label: 'URL Embed Peta', type: 'url', hint: 'Google Maps → Bagikan → Sematkan peta → salin nilai src="…" saja.' }]],
        ['Media Sosial', [{ k: 'instagram', label: 'Instagram', type: 'url', half: 1 }, { k: 'youtube', label: 'YouTube', type: 'url', half: 1 }, { k: 'facebook', label: 'Facebook', type: 'url', half: 1 }, { k: 'tiktok', label: 'TikTok', type: 'url', half: 1 }]]] },
    Pengaturan: { title: 'Pengaturan Situs', icon: 'settings', desc: 'Identitas situs, tautan portal PPDB, dan virtual tour.', anchor: 'beranda', kind: 'aset',
      groups: [['Identitas', [{ k: 'nama_sekolah', label: 'Nama Sekolah', half: 1 }, { k: 'slogan', label: 'Slogan / Moto', half: 1 }, { k: 'logo', label: 'Logo (PNG transparan)', type: 'image', hint: 'Juga dipakai sebagai favicon.' }]],
        ['Portal PPDB', [{ k: 'ppdb_url', label: 'Tautan Portal PPDB', type: 'url' }, { k: 'ppdb_teks', label: 'Teks Tombol', ph: 'Daftar PPDB Online' }]],
        ['Virtual Tour 360°', [{ k: 'tour_judul', label: 'Judul' }, { k: 'tour_teks', label: 'Teks', type: 'textarea', rows: 3 }, { k: 'tour_url', label: 'Tautan Tur (embed 360° / YouTube)', type: 'url', hint: 'Kosongkan untuk memakai video berkategori Virtual Tour.' }, { k: 'tour_gambar', label: 'Gambar Pratinjau (panorama)', type: 'image' }]]] }
  };
  const MENU = [
    ['', [['dashboard', 'Dashboard', 'grid']]],
    ['Konten Utama', [['s/Beranda', 'Beranda', 'home'], ['s/Profil', 'Tentang Kami', 'info'], ['c/Program', 'Program & Jurusan', 'cap'], ['c/Prestasi', 'Prestasi', 'trophy'], ['c/Alumni', 'Alumni Lolos PTN', 'users'], ['c/Lulusan PTN', 'Lulusan PTN', 'globe']]],
    ['Galeri & Informasi', [['c/Fasilitas', 'Fasilitas', 'building'], ['c/Kegiatan', 'Kegiatan', 'calendar'], ['c/Berita', 'Berita', 'news'], ['c/Mading', 'Info Mading', 'pin2'], ['c/Video', 'Video Promosi', 'video'], ['c/Brosur', 'Brosur Sekolah', 'file'], ['c/Penghargaan', 'Penghargaan', 'award'], ['c/Testimoni', 'Testimoni', 'quote'], ['c/FAQ', 'FAQ', 'list']]],
    ['Interaksi', [['pesan', 'Pesan Masuk', 'message'], ['pengunjung', 'Laporan Pengunjung', 'bars']]],
    ['Sistem', [['s/Kontak', 'Kontak & Peta', 'pin'], ['s/Pengaturan', 'Pengaturan Situs', 'settings'], ['migrasi', 'Migrasi & Backup', 'database'], ['log', 'Log Aktivitas', 'history']]]
  ];

  // ============================================================
  // STATE
  // ============================================================
  const App = window.App = { token: '', user: '', boot: null, onAuthExpired };
  const pageHash = {};            // hash data per halaman → render ulang hanya bila berubah
  const ui = {};                  // state UI per halaman (cari, filter, halaman)
  let pending = 0;

  function persist() { Store.set('admin:boot', { t: Date.now(), data: App.boot }); }
  function sheet(name) { return (App.boot && App.boot.sheets[name]) || (SINGLES[name] ? {} : []); }
  function setSync(n) { pending = Math.max(0, pending + n); const s = $('#sync'); if (!s) return; s.className = 'sync ' + (pending ? 'busy' : 'ok'); s.innerHTML = pending ? icon('refresh', 'spin') + '<span class="hide-sm">Menyimpan…</span>' : icon('check-circle') + '<span class="hide-sm">Tersimpan</span>'; }

  // ============================================================
  // BOOT & LOGIN
  // ============================================================
  function boot() {
    Core.applyTheme(document.documentElement.dataset.theme || 'light');
    const sess = Store.get('admin:session', null), cached = Store.get('admin:boot', null);
    if (sess && sess.token && sess.exp > Date.now() && cached && cached.data) {
      App.token = sess.token; App.user = sess.user; App.boot = cached.data;
      showApp();                                          // instan dari cache perangkat
      if (Date.now() - cached.t > 30000) refreshBoot();
    } else showLogin();
    Core.warmUp();
    $('#loginForm').addEventListener('submit', doLogin);
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (App.token && Date.now() - hiddenAt > 120000) { Core.warmUp(); refreshBoot(); } });
  }
  function showLogin(msg) {
    $('#app').hidden = true; $('#login').hidden = false;
    const m = $('#loginForm .form-msg'); m.textContent = msg || (Core.GAS_URL ? '' : 'GAS_URL belum diisi di js/config.js. Ikuti PANDUAN-INSTALASI.md bagian Backend.');
    m.className = 'form-msg ' + (msg || !Core.GAS_URL ? 'error' : '');
    setTimeout(() => $('#l-pass').focus(), 50);
  }
  async function doLogin(e) {
    e.preventDefault();
    const f = e.target, btn = $('button', f), m = $('.form-msg', f);
    btn.disabled = true; btn.innerHTML = icon('refresh', 'spin') + ' Memeriksa…'; m.textContent = '';
    const res = await api('login', { username: f.username.value, password: f.password.value }, { token: '' });
    btn.disabled = false; btn.textContent = 'Masuk';
    if (!res.success) { m.className = 'form-msg error'; m.textContent = res.message || 'Gagal masuk.'; return; }
    App.token = res.data.token; App.user = res.data.user; App.boot = res.data.boot;
    Store.set('admin:session', { token: App.token, user: App.user, exp: Date.now() + 6.5 * 864e5 });
    persist(); f.password.value = '';
    Object.keys(pageHash).forEach(k => delete pageHash[k]);
    showApp();
  }
  function onAuthExpired() {
    Store.del('admin:session'); App.token = '';
    showLogin('Sesi berakhir. Silakan masuk kembali.');
  }
  function logout() {
    Store.del('admin:session'); Store.del('admin:boot');
    App.token = ''; App.boot = null;
    $('#pages').innerHTML = ''; Object.keys(pageHash).forEach(k => delete pageHash[k]);
    showLogin();
  }
  async function refreshBoot() {
    setSync(1);
    const res = await api('adminBoot', {});
    setSync(-1);
    if (res.success) {
      const changed = hashStr(JSON.stringify(res.data.sheets)) !== hashStr(JSON.stringify(App.boot.sheets)) || hashStr(JSON.stringify(res.data.stats)) !== hashStr(JSON.stringify(App.boot.stats));
      App.boot = res.data; persist();
      if (changed) { renderChrome(); route(); }
    } else if (!res.data || res.data.code !== 'AUTH') toast('Gagal menyegarkan data: ' + res.message, 'error', { label: 'Coba lagi', fn: refreshBoot });
  }

  // ============================================================
  // KERANGKA (sidebar, bar atas)
  // ============================================================
  let chromeWired = false;
  function showApp() {
    $('#login').hidden = true; $('#app').hidden = false;
    renderChrome();
    if (!chromeWired) wireChrome();
    if (!location.hash || location.hash === '#') location.hash = '#/dashboard'; else route();
    (window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 2500 }) : (f) => setTimeout(f, 1500))(prefetch);
  }
  function unread() { return sheet('Pesan').filter(p => p.dibaca !== 'Sudah').length; }
  function renderChrome() {
    const n = unread();
    $('#side').innerHTML = `
      <div class="side-head"><img src="assets/logo.svg" alt="" width="40" height="40"><div><b>SMA TRIGUNA 1956</b><small>SUPERADMIN CMS</small></div></div>
      <nav class="side-nav">${MENU.map(g => `${g[0] ? `<p class="side-group">${g[0]}</p>` : ''}${g[1].map(m => `<a href="#/${m[0]}" data-route="${m[0]}">${icon(m[2])}<span>${m[1]}</span>${m[0] === 'pesan' && n ? `<em class="badge">${n}</em>` : ''}</a>`).join('')}`).join('')}</nav>
      <div class="side-foot"><span class="avatar">${icon('user')}</span><div><b>Operator Sekolah</b><small>${esc(App.user || 'superadmin')}</small></div><button class="btn-icon" type="button" data-logout aria-label="Keluar">${icon('logout')}</button></div>`;
    $('#bell').innerHTML = icon('bell') + (n ? '<i></i>' : '');
    markActive();
  }
  function wireChrome() {
    chromeWired = true;
    $('#sideBtn').innerHTML = icon('menu');
    $('#viewSite').innerHTML = 'Lihat Website ' + icon('external');
    $('#logoutBtn').innerHTML = icon('logout');
    $('#themeBtn').onclick = () => { Core.toggleTheme(); if (current === 'pengunjung' || current === 'dashboard') { delete pageHash[current]; route(); } };
    $('#logoutBtn').onclick = logout;
    $('#sideBtn').onclick = () => document.body.classList.toggle('side-open');
    $('#scrim').onclick = () => document.body.classList.remove('side-open');
    $('#side').addEventListener('click', (e) => { if (e.target.closest('[data-logout]')) logout(); if (e.target.closest('a')) document.body.classList.remove('side-open'); });
    addEventListener('hashchange', route);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrawer(); closeDialog(false); document.body.classList.remove('side-open'); } });
    $('#drawer').addEventListener('click', (e) => { if (e.target.id === 'drawer') closeDrawer(); });
    setSync(0);
  }
  function markActive() { $$('#side [data-route]').forEach(a => a.classList.toggle('on', a.dataset.route === current)); }

  // ============================================================
  // ROUTER — setiap halaman dibuat sekali & disembunyikan saat pindah
  // ============================================================
  let current = '';
  function route() {
    if (!App.boot) return;
    const r = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'dashboard';
    current = r;
    let el = $('.page[data-page="' + CSS.escape(r) + '"]');
    if (!el) { el = document.createElement('section'); el.className = 'page'; el.dataset.page = r; $('#pages').appendChild(el); }
    $$('.page').forEach(p => p.hidden = p !== el);
    const [kind, name] = r.split('/');
    const data = kind === 'c' || kind === 's' ? sheet(name) : kind === 'pesan' ? sheet('Pesan') : kind === 'dashboard' || kind === 'pengunjung' ? [App.boot.stats, kind === 'dashboard' ? App.boot.sheets : 0] : null;
    const h = data === null ? null : hashStr(JSON.stringify(data)) + document.documentElement.dataset.theme;
    if (h === null || pageHash[r] !== h) {
      pageHash[r] = h;
      try {
        if (kind === 'c' && FORMS[name]) renderCollection(el, name);
        else if (kind === 's' && SINGLES[name]) renderSingle(el, name);
        else if (kind === 'pesan') renderPesan(el);
        else if (kind === 'pengunjung') renderPengunjung(el);
        else if (kind === 'migrasi') renderMigrasi(el);
        else if (kind === 'log') renderLog(el);
        else renderDashboard(el);
      } catch (e) { console.error(e); el.innerHTML = '<div class="empty-state">' + icon('alert') + '<p>Terjadi kesalahan saat menampilkan halaman.</p></div>'; }
    }
    const label = labelOf(r);
    $('#crumb').innerHTML = `<span>${icon('home')} Panel Admin</span>${icon('chev-right')}<b>${esc(label)}</b>`;
    document.title = label + ' — Panel Admin SMA Triguna';
    markActive();
    $('#pages').scrollTop = 0; scrollTo(0, 0);
  }
  function labelOf(r) { for (const g of MENU) for (const m of g[1]) if (m[0] === r) return m[1]; return 'Dashboard'; }
  function rerender() { delete pageHash[current]; route(); }

  // ============================================================
  // OPTIMISTIC MUTATION
  // ============================================================
  async function mutate(opt) {
    const snapshot = JSON.stringify(App.boot.sheets);
    opt.apply(); persist(); renderChrome(); rerender();
    setSync(1);
    const reqId = Core.uuid();
    const run = async () => {
      const res = await api(opt.action, opt.data, { reqId });
      setSync(-1);
      if (res.success) { if (opt.onOk) opt.onOk(res.data); persist(); renderChrome(); rerender(); if (opt.okMsg) toast(opt.okMsg, 'ok'); return true; }
      App.boot.sheets = JSON.parse(snapshot); persist(); renderChrome(); rerender();
      toast((opt.failMsg || 'Gagal menyimpan') + ': ' + (res.message || ''), 'error', res.data && res.data.code === 'AUTH' ? null : { label: 'Coba lagi', fn: () => mutate(opt) });
      return false;
    };
    return run();
  }

  // ============================================================
  // HALAMAN: DASHBOARD
  // ============================================================
  function renderDashboard(el) {
    const S = App.boot.stats || {}, sh = App.boot.sheets;
    const tayang = Object.keys(FORMS).reduce((n, k) => n + (sh[k] || []).filter(r => r.status === 'Tayang').length, 0);
    const draft = Object.keys(FORMS).reduce((n, k) => n + (sh[k] || []).filter(r => r.status !== 'Tayang').length, 0);
    const series = S.series || {};
    const last7 = lastDays(7).reduce((n, d) => n + (series[d] || 0), 0);
    const msgs = sheet('Pesan').slice(0, 5);
    el.innerHTML = `
      ${pageHead('Ringkasan', 'Selamat datang, Operator Sekolah', 'Pantau pengunjung, pesan masuk, dan konten website dalam satu layar.', `<a class="btn" href="index.html" target="_blank" rel="noopener">${icon('external')} Lihat Website</a>`)}
      <div class="kpis">
        ${kpi('users', 'Pengunjung Hari Ini', fmtN(S.hari_ini))}${kpi('chart', '7 Hari Terakhir', fmtN(last7))}${kpi('bars', 'Total Kunjungan', fmtN(S.total))}
        ${kpi('message', 'Pesan Belum Dibaca', fmtN(unread()), unread() ? 'warn' : '')}${kpi('check-circle', 'Konten Tayang', fmtN(tayang))}${kpi('edit', 'Draft Disimpan', fmtN(draft))}
      </div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h3>${icon('bars')} Pengunjung 14 Hari Terakhir</h3><a href="#/pengunjung">Laporan lengkap ${icon('arrow')}</a></div><canvas class="chart" id="dashChart" height="220"></canvas></div>
        <div class="panel"><div class="panel-head"><h3>${icon('message')} Pesan Terbaru</h3><a href="#/pesan">Semua pesan ${icon('arrow')}</a></div>
          ${msgs.length ? `<ul class="mini-list">${msgs.map(p => `<li class="${p.dibaca !== 'Sudah' ? 'unread' : ''}"><a href="#/pesan" data-open-msg="${esc(p.id)}"><b>${esc(p.nama)}</b><span>${esc(p.subjek || '')} — ${esc(String(p.isi).slice(0, 70))}</span><small>${fmtDateTime(p.waktu)}</small></a></li>`).join('')}</ul>` : emptyState('message', 'Belum ada pesan masuk.')}
        </div>
      </div>
      <div class="panel"><div class="panel-head"><h3>${icon('layers')} Akses Cepat</h3>${(sh.Pengaturan || {}).terakhir_diperbarui ? `<small class="muted">Konten terakhir diperbarui ${fmtDateTime(sh.Pengaturan.terakhir_diperbarui)}</small>` : ''}</div>
        <div class="quick">${[['c/Berita', 'Tulis Berita', 'news'], ['c/Mading', 'Pasang Info Mading', 'pin2'], ['c/Prestasi', 'Tambah Prestasi', 'trophy'], ['c/Video', 'Tambah Video', 'video'], ['s/Kontak', 'Ubah Kontak & WA', 'pin'], ['s/Pengaturan', 'Tautan PPDB', 'settings'], ['migrasi', 'Backup Data', 'database'], ['__sheet', 'Buka Spreadsheet', 'external']].map(q => q[0] === '__sheet' ? `<a class="q" href="${esc(App.boot.spreadsheetUrl || '#')}" target="_blank" rel="noopener">${icon(q[2])}<span>${q[1]}</span></a>` : `<a class="q" href="#/${q[0]}">${icon(q[2])}<span>${q[1]}</span></a>`).join('')}</div></div>`;
    $$('[data-open-msg]', el).forEach(a => a.onclick = () => { ui.pesan = Object.assign(ui.pesan || {}, { open: a.dataset.openMsg }); });
    const days = lastDays(14);
    drawBars($('#dashChart', el), days.map(d => d.slice(8) + '/' + d.slice(5, 7)), days.map(d => series[d] || 0));
  }
  const fmtN = (n) => Number(n || 0).toLocaleString('id-ID');
  function kpi(ic, label, val, cls) { return `<div class="kpi ${cls || ''}"><span class="kpi-ic">${icon(ic)}</span><div><small>${label}</small><b>${val}</b></div></div>`; }
  function pageHead(eyebrow, title, desc, action, ic) {
    return `<div class="page-head"><div><p class="eyebrow">${ic ? `<span>${icon(ic)}</span>` : ''}${esc(eyebrow)}</p><h1>${esc(title)}</h1>${desc ? `<p class="muted">${esc(desc)}</p>` : ''}</div>${action ? `<div class="page-act">${action}</div>` : ''}</div>`;
  }
  function emptyState(ic, msg) { return `<div class="empty-state">${icon(ic)}<p>${esc(msg)}</p></div>`; }
  function lastDays(n) { const out = []; const d = new Date(); for (let i = n - 1; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i); out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')); } return out; }

  // ============================================================
  // HALAMAN: KOLEKSI (CRUD generik)
  // ============================================================
  function renderCollection(el, name) {
    const F = FORMS[name], rows = sheet(name), L = F.list;
    const st = ui[name] = ui[name] || { q: '', status: '', f: {}, page: 1 };
    const tayang = rows.filter(r => r.status === 'Tayang').length;
    el.innerHTML = `
      ${pageHead('Kelola Konten', F.title, F.desc, `<button class="btn" type="button" data-add>${icon('plus')} Tambah ${esc(F.title.split(' ')[0])}</button>`, F.icon)}
      <div class="chips-row"><span class="pill">${icon('layers')} Total: <b>${rows.length}</b></span><span class="pill ok">Tayang: <b>${tayang}</b></span><span class="pill muted">Draft: <b>${rows.length - tayang}</b></span>
        <a class="pill link" href="index.html#${F.anchor}" target="_blank" rel="noopener">${icon('eye')} Lihat di website</a></div>
      <div class="panel toolbar">
        <label class="search">${icon('search')}<input type="search" placeholder="Cari ${esc(F.title.toLowerCase())}…" value="${esc(st.q)}" data-q></label>
        <select data-status aria-label="Filter status"><option value="">Status: Semua</option><option ${st.status === 'Tayang' ? 'selected' : ''}>Tayang</option><option ${st.status === 'Draft' ? 'selected' : ''}>Draft</option></select>
        ${(F.filters || []).map(k => { const vals = Array.from(new Set(rows.map(r => r[k]).filter(Boolean))).sort().reverse(); return `<select data-filter="${k}" aria-label="Filter ${k}"><option value="">${cap(k)}: Semua</option>${vals.map(v => `<option ${st.f[k] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`; }).join('')}
      </div>
      <div class="panel table-panel"><div data-table></div></div>`;
    const draw = () => drawTable(el, name);
    $('[data-q]', el).addEventListener('input', debounce((e) => { st.q = e.target.value; st.page = 1; draw(); }, 200));
    $('[data-status]', el).onchange = (e) => { st.status = e.target.value; st.page = 1; draw(); };
    $$('[data-filter]', el).forEach(s => s.onchange = () => { st.f[s.dataset.filter] = s.value; st.page = 1; draw(); });
    $('[data-add]', el).onclick = () => openForm(name, null);
    draw();
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  function drawTable(el, name) {
    const F = FORMS[name], L = F.list, st = ui[name], all = sheet(name);
    const q = st.q.trim().toLowerCase();
    let rows = all.filter(r => (!st.status || (st.status === 'Tayang' ? r.status === 'Tayang' : r.status !== 'Tayang')) &&
      Object.keys(st.f).every(k => !st.f[k] || r[k] === st.f[k]) &&
      (!q || Object.values(r).join(' ').toLowerCase().indexOf(q) > -1));
    const canReorder = !F.noReorder && !q && !st.status && !Object.values(st.f).some(Boolean);
    const PER = 10, pages = Math.max(1, Math.ceil(rows.length / PER));
    st.page = Math.min(st.page, pages);
    const view = rows.slice((st.page - 1) * PER, st.page * PER);
    const box = $('[data-table]', el);
    if (!all.length) { box.innerHTML = emptyState(F.icon, 'Belum ada data. Klik "Tambah" untuk membuat yang pertama.'); return; }
    if (!rows.length) { box.innerHTML = emptyState('search', 'Tidak ada data yang cocok dengan pencarian/filter.'); return; }
    box.innerHTML = `<table class="tbl"><thead><tr>${canReorder ? '<th class="w-ord"><span class="sr-only">Urutan</span></th>' : ''}${L.img || L.file ? '<th class="w-img">Visual</th>' : ''}<th>Judul &amp; Keterangan</th>${L.tags ? '<th>Kategori</th>' : ''}${L.col ? `<th>${cap(L.col)}</th>` : ''}<th>Status</th><th class="w-act">Aksi</th></tr></thead>
      <tbody>${view.map(r => {
        const idx = all.indexOf(r), thumb = r[L.img] ? imgUrl(r[L.img], 200) : (L.imgFb ? ytThumb(r[L.imgFb]) : '');
        return `<tr data-id="${esc(r.id)}" class="${String(r.id).indexOf('tmp-') === 0 ? 'saving' : ''}">
          ${canReorder ? `<td class="w-ord"><button class="btn-icon xs" type="button" data-move="-1" ${idx === 0 ? 'disabled' : ''} aria-label="Naikkan">${icon('chev-up')}</button><button class="btn-icon xs" type="button" data-move="1" ${idx === all.length - 1 ? 'disabled' : ''} aria-label="Turunkan">${icon('chev-down')}</button></td>` : ''}
          ${L.img || L.file ? `<td class="w-img" data-label="Visual">${L.file ? `<span class="pdf-ic">${r[L.file] ? 'PDF' : '—'}</span>` : thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy" data-fade class="lazy-fade">` : `<span class="noimg">${icon('image')}</span>`}</td>` : ''}
          <td class="t-main"><b>${esc(r[L.title] || '(tanpa judul)')}</b>${r[L.sub] ? `<small>${esc(String(r[L.sub]).slice(0, 110))}</small>` : ''}${String(r.id).indexOf('tmp-') === 0 ? '<em class="saving-tag">menyimpan…</em>' : ''}</td>
          ${L.tags ? `<td data-label="Kategori">${L.tags.map(t => r[t] ? `<span class="tag">${esc(r[t])}</span>` : '').join(' ')}</td>` : ''}
          ${L.col ? `<td data-label="${cap(L.col)}">${/tanggal/.test(L.col) ? fmtDate(r[L.col], true) : esc(r[L.col] || '—')}</td>` : ''}
          <td data-label="Status"><button type="button" class="status ${r.status === 'Tayang' ? 'on' : ''}" data-toggle title="Klik untuk ${r.status === 'Tayang' ? 'menjadikan Draft' : 'menayangkan'}">${r.status === 'Tayang' ? 'Tayang' : 'Draft'}</button></td>
          <td class="w-act"><a class="btn-icon" href="index.html#${F.anchor}" target="_blank" rel="noopener" aria-label="Lihat di website">${icon('external')}</a><button class="btn-icon" type="button" data-edit aria-label="Ubah">${icon('edit')}</button><button class="btn-icon danger" type="button" data-del aria-label="Hapus">${icon('trash')}</button></td></tr>`;
      }).join('')}</tbody></table>
      <div class="pager"><span>Menampilkan <b>${(st.page - 1) * PER + 1}–${Math.min(st.page * PER, rows.length)}</b> dari <b>${rows.length}</b> data</span>
        ${pages > 1 ? `<div><button class="btn-icon" type="button" data-pg="-1" ${st.page === 1 ? 'disabled' : ''} aria-label="Sebelumnya">${icon('chev-left')}</button>${Array.from({ length: pages }, (_, i) => `<button type="button" class="pg ${i + 1 === st.page ? 'on' : ''}" data-pgn="${i + 1}">${i + 1}</button>`).join('')}<button class="btn-icon" type="button" data-pg="1" ${st.page === pages ? 'disabled' : ''} aria-label="Berikutnya">${icon('chev-right')}</button></div>` : ''}</div>`;
    Core.wireImages(box);
    box.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.pg) { st.page += Number(b.dataset.pg); drawTable(el, name); return; }
      if (b.dataset.pgn) { st.page = Number(b.dataset.pgn); drawTable(el, name); return; }
      const tr = b.closest('tr'); if (!tr) return;
      const id = tr.dataset.id, row = all.find(r => r.id === id); if (!row) return;
      if (String(id).indexOf('tmp-') === 0) return toast('Tunggu sebentar, data sedang disimpan.');
      if (b.hasAttribute('data-edit')) openForm(name, row);
      else if (b.hasAttribute('data-del')) delRow(name, row);
      else if (b.hasAttribute('data-toggle')) toggleStatus(name, row);
      else if (b.dataset.move) moveRow(name, row, Number(b.dataset.move));
    };
    box.ondblclick = (e) => { const tr = e.target.closest('tr[data-id]'); if (tr && !e.target.closest('button,a')) { const row = all.find(r => r.id === tr.dataset.id); if (row) openForm(name, row); } };
  }
  function toggleStatus(name, row) {
    const next = row.status === 'Tayang' ? 'Draft' : 'Tayang';
    mutate({ action: 'save', data: { sheet: name, row: { id: row.id, status: next } }, apply: () => { sheet(name).find(r => r.id === row.id).status = next; }, okMsg: next === 'Tayang' ? 'Ditayangkan di website.' : 'Disembunyikan dari website (Draft).' });
  }
  async function delRow(name, row) {
    const F = FORMS[name];
    if (!await confirmDialog('Hapus data ini?', `"${row[F.list.title] || ''}" akan dihapus permanen dari ${F.title}.`, 'Hapus', 'danger')) return;
    mutate({ action: 'remove', data: { sheet: name, id: row.id }, apply: () => { App.boot.sheets[name] = sheet(name).filter(r => r.id !== row.id); }, okMsg: 'Data dihapus.', failMsg: 'Gagal menghapus' });
  }
  const reorderQ = {};
  function moveRow(name, row, dir) {
    const list = sheet(name), i = list.indexOf(row), j = i + dir;
    if (j < 0 || j >= list.length) return;
    list.splice(i, 1); list.splice(j, 0, row);
    list.forEach((r, k) => r.urutan = String(k + 1));
    persist(); rerender();
    clearTimeout(reorderQ[name]);
    reorderQ[name] = setTimeout(() => {           // beberapa klik digabung jadi 1 panggilan server
      const ids = sheet(name).map(r => r.id);
      mutate({ action: 'reorder', data: { sheet: name, ids }, apply: () => { }, okMsg: 'Urutan disimpan.' });
    }, 700);
  }

  // ============================================================
  // FORMULIR (drawer) + UPLOAD
  // ============================================================
  function fieldHtml(f, v, kind) {
    const id = 'fld-' + f.k, val = v == null ? '' : String(v);
    const req = f.req ? ' required' : '', star = f.req ? ' <i class="req">*</i>' : '';
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
    const wrap = (inner, extra) => `<div class="field ${f.half ? 'half' : ''} ${extra || ''}" data-field="${f.k}"><label for="${id}">${esc(f.label)}${star}</label>${inner}${hint}</div>`;
    switch (f.type) {
      case 'textarea': return wrap(`<textarea id="${id}" name="${f.k}" rows="${f.rows || 4}"${req} placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>`);
      case 'select': return wrap(`<select id="${id}" name="${f.k}">${f.options.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`);
      case 'status': return `<div class="field switch-row" data-field="${f.k}"><div><b>Status Publikasi (Tayang)</b><span class="hint">Jika aktif, data langsung tampil di website publik.</span></div><label class="switch"><input type="checkbox" name="${f.k}" ${val === 'Tayang' || val === '' ? 'checked' : ''}><span></span></label></div>`;
      case 'yesno': return `<div class="field switch-row ${f.half ? 'half' : ''}" data-field="${f.k}"><div><b>${esc(f.label)}</b></div><label class="switch"><input type="checkbox" name="${f.k}" ${val === 'Ya' ? 'checked' : ''}><span></span></label></div>`;
      case 'image': return wrap(`<div class="upl" data-kind="${kind || 'aset'}" data-type="image"><div class="upl-prev">${val ? `<img src="${esc(imgUrl(val, 600))}" alt="">` : icon('image')}</div>
          <div class="upl-ctl"><label class="btn btn-soft btn-sm">${icon('upload')} Unggah Foto<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden></label>
          <input id="${id}" name="${f.k}" value="${esc(val)}" placeholder="…atau tempel URL / ID Google Drive"${req}><span class="upl-msg">JPG, PNG, WEBP maks 5 MB. Foto besar dikompres otomatis.</span></div></div>`, 'wide');
      case 'pdf': return wrap(`<div class="upl" data-kind="brosur" data-type="pdf"><div class="upl-prev pdf-ic">${val ? 'PDF' : icon('file')}</div>
          <div class="upl-ctl"><label class="btn btn-soft btn-sm">${icon('upload')} Unggah PDF<input type="file" accept="application/pdf" hidden></label>
          <input id="${id}" name="${f.k}" value="${esc(val)}" placeholder="…atau tempel tautan Google Drive"${req}><span class="upl-msg">${val ? `<a href="${esc(fileUrls(val).view)}" target="_blank" rel="noopener">Buka berkas saat ini</a> · ` : ''}PDF maks 10 MB.</span></div></div>`, 'wide');
      case 'youtube': return wrap(`<div class="yt"><input id="${id}" name="${f.k}" type="url" value="${esc(val)}" placeholder="https://www.youtube.com/watch?v=…"${req}><div class="yt-prev">${ytPreview(val)}</div></div>`, 'wide');
      default: {
        const dl = f.list ? `<datalist id="dl-${f.k}">${f.list.map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : '';
        const t = f.type === 'number' ? 'text" inputmode="numeric' : (f.type || 'text');
        return wrap(`<input id="${id}" name="${f.k}" type="${t}" value="${esc(val)}" placeholder="${esc(f.ph || '')}"${f.list ? ` list="dl-${f.k}"` : ''}${req}>${dl}`);
      }
    }
  }
  function ytPreview(v) { const id = ytId(v); return id ? `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt=""><span class="ok-tag">${icon('check-circle')} Tautan valid</span>` : (v ? `<span class="bad-tag">${icon('alert')} Tautan YouTube tidak dikenali</span>` : ''); }

  function openForm(name, row) {
    const F = FORMS[name], isNew = !row;
    const v = row ? Object.assign({}, row) : {};
    if (isNew) F.fields.forEach(f => { if (f.def) v[f.k] = f.def(); if (f.type === 'select' && !v[f.k]) v[f.k] = f.options[0]; });
    const box = $('#drawer .drawer-box');
    box.innerHTML = `<form class="dform" novalidate>
      <div class="drawer-head"><div><p class="eyebrow">${icon(F.icon)} ${esc(F.title)}</p><h2>${isNew ? 'Tambah Data' : 'Ubah Data'}</h2></div><button class="btn-icon" type="button" data-close aria-label="Tutup">${icon('x')}</button></div>
      <div class="drawer-body"><div class="fgrid">${F.fields.map(f => fieldHtml(f, v[f.k], F.kind)).join('')}</div></div>
      <div class="drawer-foot"><button class="btn btn-soft" type="button" data-close>Batal</button>${isNew ? `<button class="btn btn-outline" type="submit" data-draft>${icon('file')} Simpan sebagai Draft</button>` : ''}<button class="btn" type="submit">${icon('check')} ${isNew ? 'Simpan & Tayangkan' : 'Simpan Perubahan'}</button></div></form>`;
    openDrawer();
    const form = $('form', box);
    wireForm(form);
    form.onsubmit = (e) => {
      e.preventDefault();
      if (form.dataset.uploading) return toast('Tunggu unggahan selesai.');
      const data = readForm(form, F.fields);
      if (e.submitter && e.submitter.hasAttribute('data-draft')) data.status = 'Draft';
      const miss = F.fields.filter(f => f.req && !String(data[f.k] || '').trim());
      $$('.field', form).forEach(x => x.classList.remove('err'));
      if (miss.length) { miss.forEach(f => { const x = $(`[data-field="${f.k}"]`, form); x && x.classList.add('err'); }); toast('Lengkapi kolom bertanda *: ' + miss.map(f => f.label).join(', '), 'error'); return; }
      closeDrawer();
      if (isNew) {
        const tmp = 'tmp-' + Date.now();
        const optimistic = Object.assign({ id: tmp, urutan: String(sheet(name).length + 1) }, data);
        mutate({ action: 'save', data: { sheet: name, row: data },
          apply: () => { const L = sheet(name); if (F.noReorder) L.unshift(optimistic); else L.push(optimistic); App.boot.sheets[name] = L; },
          onOk: (d) => { const L = sheet(name), i = L.findIndex(r => r.id === tmp); if (i > -1) L[i] = d.row; else L.push(d.row); if (F.noReorder) L.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))); },
          okMsg: data.status === 'Tayang' ? 'Data ditambahkan & tayang di website.' : 'Data disimpan sebagai Draft.' });
      } else {
        mutate({ action: 'save', data: { sheet: name, row: Object.assign({ id: row.id }, data) },
          apply: () => { const r = sheet(name).find(x => x.id === row.id); Object.assign(r, data); if (F.noReorder) sheet(name).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))); },
          onOk: (d) => { const L = sheet(name), i = L.findIndex(x => x.id === row.id); if (i > -1) L[i] = d.row; },
          okMsg: 'Perubahan disimpan.' });
      }
    };
  }
  function readForm(form, fields) {
    const d = {};
    fields.forEach(f => {
      const el = form.elements[f.k]; if (!el) return;
      if (f.type === 'status') d[f.k] = el.checked ? 'Tayang' : 'Draft';
      else if (f.type === 'yesno') d[f.k] = el.checked ? 'Ya' : 'Tidak';
      else d[f.k] = String(el.value || '').trim();
    });
    return d;
  }
  function wireForm(form) {
    $$('[data-close]', form).forEach(b => b.onclick = closeDrawer);
    $$('.yt input', form).forEach(inp => inp.addEventListener('input', debounce(() => { inp.nextElementSibling.innerHTML = ytPreview(inp.value); }, 300)));
    $$('.upl', form).forEach(u => {
      const file = $('input[type="file"]', u), txt = $('input:not([type="file"])', u), prev = $('.upl-prev', u), msg = $('.upl-msg', u);
      txt.addEventListener('change', () => { if (u.dataset.type === 'image') prev.innerHTML = txt.value ? `<img src="${esc(imgUrl(txt.value, 600))}" alt="">` : icon('image'); });
      file.onchange = async () => {
        const fl = file.files[0]; if (!fl) return;
        const isPdf = u.dataset.type === 'pdf';
        const okType = isPdf ? fl.type === 'application/pdf' : /^image\/(jpeg|png|webp|gif)$/.test(fl.type);
        if (!okType) { msg.className = 'upl-msg err'; msg.textContent = isPdf ? 'Berkas harus PDF.' : 'Gunakan JPG, PNG, WEBP, atau GIF.'; return; }
        let blob = fl;
        if (!isPdf && fl.type !== 'image/gif' && fl.size > 900 * 1024) { msg.textContent = 'Mengompres foto…'; blob = await compressImage(fl, 1600, .85).catch(() => fl); }
        const max = isPdf ? 10 : 5;
        if (blob.size > max * 1048576) { msg.className = 'upl-msg err'; msg.textContent = `Ukuran ${(blob.size / 1048576).toFixed(1)} MB melebihi batas ${max} MB.`; return; }
        if (!isPdf) prev.innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`;
        form.dataset.uploading = '1'; u.classList.add('busy');
        msg.className = 'upl-msg'; msg.innerHTML = icon('refresh', 'spin') + ` Mengunggah ${(blob.size / 1024).toFixed(0)} KB ke Google Drive…`;
        const data = await toBase64(blob);
        const res = await api('upload', { name: fl.name.replace(/\.(png|jpe?g|webp)$/i, blob.type === 'image/jpeg' ? '.jpg' : '.$1'), mime: blob.type || fl.type, data, kind: u.dataset.kind });
        delete form.dataset.uploading; u.classList.remove('busy');
        if (res.success) { txt.value = res.data.id; msg.className = 'upl-msg ok'; msg.innerHTML = icon('check-circle') + ' Tersimpan di Drive (' + (res.data.size / 1024).toFixed(0) + ' KB).'; if (isPdf) prev.textContent = 'PDF'; }
        else { msg.className = 'upl-msg err'; msg.textContent = 'Gagal mengunggah: ' + res.message; }
        file.value = '';
      };
    });
  }
  function toBase64(blob) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(blob); }); }
  function compressImage(file, maxW, q) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, maxW / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(url); b ? resolve(b.size < file.size ? b : file) : reject(); }, 'image/jpeg', q);
      };
      img.onerror = reject; img.src = url;
    });
  }
  function openDrawer() { const d = $('#drawer'); d.classList.add('open'); document.body.classList.add('noscroll'); setTimeout(() => { const f = $('input:not([type="file"]):not([type="checkbox"]),textarea', d); f && f.focus(); }, 60); }
  function closeDrawer() { $('#drawer').classList.remove('open'); document.body.classList.remove('noscroll'); }

  // ============================================================
  // HALAMAN: DATA SATU BARIS (Beranda, Profil, Kontak, Pengaturan)
  // ============================================================
  function renderSingle(el, name) {
    const S = SINGLES[name], v = sheet(name);
    el.innerHTML = `${pageHead('Pengaturan Konten', S.title, S.desc, `<a class="btn btn-soft" href="index.html#${S.anchor}" target="_blank" rel="noopener">${icon('eye')} Lihat di website</a>`, S.icon)}
      <form class="single" novalidate>
        ${S.groups.map((g, i) => `<div class="panel"><div class="panel-head"><h3><span class="step">${i + 1}</span> ${esc(g[0])}</h3></div><div class="fgrid">${g[1].map(f => fieldHtml(f, v[f.k], S.kind)).join('')}</div></div>`).join('')}
        <div class="savebar"><span class="muted">${v.terakhir_diperbarui ? 'Terakhir diperbarui ' + fmtDateTime(v.terakhir_diperbarui) : 'Perubahan langsung tampil di website setelah disimpan.'}</span><button class="btn" type="submit">${icon('check')} Simpan Perubahan</button></div>
      </form>
      ${name === 'Pengaturan' ? passwordPanel() : ''}`;
    const form = $('form.single', el), fields = S.groups.flatMap(g => g[1]);
    wireForm(form);
    form.onsubmit = (e) => {
      e.preventDefault();
      if (form.dataset.uploading) return toast('Tunggu unggahan selesai.');
      const data = readForm(form, fields);
      const miss = fields.filter(f => f.req && !data[f.k]);
      if (miss.length) return toast('Lengkapi: ' + miss.map(f => f.label).join(', '), 'error');
      mutate({ action: 'saveSingle', data: { sheet: name, data }, apply: () => { Object.assign(App.boot.sheets[name], data); }, onOk: (d) => { App.boot.sheets[name] = d.data; }, okMsg: 'Tersimpan. Website sudah memakai data baru.' });
    };
    if (name === 'Pengaturan') wirePassword(el);
  }
  function passwordPanel() {
    return `<div class="panel"><div class="panel-head"><h3>${icon('lock')} Keamanan Akun</h3></div>
      <form class="fgrid" data-pass novalidate>
        <div class="field half"><label for="pw-u">Username</label><input id="pw-u" name="username" value="${esc(App.user)}" autocomplete="username"></div>
        <div class="field half"><label for="pw-l">Password Lama</label><input id="pw-l" name="lama" type="password" autocomplete="current-password" required></div>
        <div class="field half"><label for="pw-b">Password Baru</label><input id="pw-b" name="baru" type="password" minlength="8" autocomplete="new-password" required><span class="hint">Minimal 8 karakter.</span></div>
        <div class="field half"><label for="pw-k">Ulangi Password Baru</label><input id="pw-k" name="ulang" type="password" autocomplete="new-password" required></div>
        <div class="field wide"><button class="btn btn-deep" type="submit">${icon('lock')} Ganti Password</button><span class="hint">Perangkat lain yang sedang login akan otomatis keluar.</span></div>
      </form></div>`;
  }
  function wirePassword(el) {
    const f = $('[data-pass]', el);
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (f.baru.value.length < 8) return toast('Password baru minimal 8 karakter.', 'error');
      if (f.baru.value !== f.ulang.value) return toast('Ulangi password baru tidak sama.', 'error');
      const btn = $('button', f); btn.disabled = true;
      const res = await api('changePassword', { username: f.username.value, lama: f.lama.value, baru: f.baru.value });
      btn.disabled = false;
      if (!res.success) return toast(res.message, 'error');
      App.token = res.data.token; App.user = f.username.value.trim().toLowerCase();
      Store.set('admin:session', { token: App.token, user: App.user, exp: Date.now() + 6.5 * 864e5 });
      f.reset(); f.username.value = App.user; toast(res.data.message, 'ok'); renderChrome();
    };
  }

  // ============================================================
  // HALAMAN: PESAN MASUK
  // ============================================================
  function renderPesan(el) {
    const st = ui.pesan = ui.pesan || { f: '', open: '' };
    const all = sheet('Pesan');
    const list = all.filter(p => !st.f || (st.f === 'Belum' ? p.dibaca !== 'Sudah' : p.dibaca === 'Sudah'));
    const cur = all.find(p => p.id === st.open);
    el.innerHTML = `${pageHead('Interaksi', 'Pesan Masuk', 'Pesan dari formulir kontak website. Pesan otomatis ditandai sudah dibaca saat dibuka.', `<button class="btn btn-soft" type="button" data-refresh>${icon('refresh')} Muat Ulang</button>`, 'message')}
      <div class="chips-row">${[['', 'Semua', all.length], ['Belum', 'Belum Dibaca', unread()], ['Sudah', 'Sudah Dibaca', all.length - unread()]].map(x => `<button type="button" class="pill ${st.f === x[0] ? 'on' : ''}" data-f="${x[0]}">${x[1]} <b>${x[2]}</b></button>`).join('')}
        ${unread() ? `<button type="button" class="pill link" data-readall>${icon('check')} Tandai semua dibaca</button>` : ''}</div>
      <div class="inbox ${cur ? 'has-open' : ''}">
        <div class="panel inbox-list">${list.length ? list.map(p => `<button type="button" class="msg ${p.dibaca !== 'Sudah' ? 'unread' : ''} ${p.id === st.open ? 'on' : ''}" data-id="${esc(p.id)}"><span class="dot"></span><span class="msg-main"><b>${esc(p.nama)}</b><small>${esc(p.subjek || 'Tanpa subjek')}</small><span>${esc(String(p.isi).slice(0, 90))}</span></span><time>${fmtDateTime(p.waktu)}</time></button>`).join('') : emptyState('message', 'Tidak ada pesan.')}</div>
        <div class="panel inbox-read">${cur ? `
          <button class="btn btn-soft btn-sm show-md" type="button" data-back>${icon('arrow-left')} Kembali</button>
          <div class="read-head"><span class="avatar big">${esc(cur.nama.slice(0, 1).toUpperCase())}</span><div><h2>${esc(cur.nama)}</h2><small>${esc(cur.email || '')}${cur.email && cur.whatsapp ? ' · ' : ''}${esc(cur.whatsapp ? '+' + cur.whatsapp : '')}</small></div><time>${fmtDateTime(cur.waktu)}</time></div>
          <p class="tag no-dot">${esc(cur.subjek || 'Tanpa subjek')}</p>
          <div class="read-body">${nl2br(cur.isi)}</div>
          <div class="read-act">${cur.whatsapp ? `<a class="btn btn-wa" href="https://wa.me/${esc(cur.whatsapp)}?text=${encodeURIComponent('Halo ' + cur.nama + ', terima kasih telah menghubungi SMA Triguna 1956. ')}" target="_blank" rel="noopener">${icon('whatsapp')} Balas via WhatsApp</a>` : ''}
            ${cur.email ? `<a class="btn btn-soft" href="mailto:${esc(cur.email)}?subject=${encodeURIComponent('Re: ' + (cur.subjek || 'Pesan Anda'))}">${icon('mail')} Balas via Email</a>` : ''}
            <button class="btn btn-soft" type="button" data-unread>${icon('eye')} Tandai belum dibaca</button><button class="btn btn-danger" type="button" data-delmsg>${icon('trash')} Hapus</button></div>` : emptyState('mail', 'Pilih pesan untuk membaca.')}</div>
      </div>`;
    el.onclick = async (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.f !== undefined && t.classList.contains('pill')) { st.f = t.dataset.f; rerender(); }
      else if (t.hasAttribute('data-refresh')) refreshBoot();
      else if (t.hasAttribute('data-back')) { st.open = ''; rerender(); }
      else if (t.hasAttribute('data-readall')) { const ids = all.filter(p => p.dibaca !== 'Sudah').map(p => p.id); mutate({ action: 'markPesan', data: { ids }, apply: () => all.forEach(p => p.dibaca = 'Sudah'), okMsg: 'Semua pesan ditandai dibaca.' }); }
      else if (t.classList.contains('msg')) {
        st.open = t.dataset.id; const p = all.find(x => x.id === st.open);
        if (p && p.dibaca !== 'Sudah') mutate({ action: 'markPesan', data: { ids: [p.id] }, apply: () => { p.dibaca = 'Sudah'; } }); else rerender();
      }
      else if (t.hasAttribute('data-unread') && cur) { mutate({ action: 'markPesan', data: { ids: [cur.id], dibaca: false }, apply: () => { cur.dibaca = 'Belum'; st.open = ''; } }); }
      else if (t.hasAttribute('data-delmsg') && cur) {
        if (!await confirmDialog('Hapus pesan?', 'Pesan dari ' + cur.nama + ' akan dihapus permanen.', 'Hapus', 'danger')) return;
        mutate({ action: 'markPesan', data: { ids: [cur.id], hapus: true }, apply: () => { App.boot.sheets.Pesan = all.filter(p => p.id !== cur.id); st.open = ''; }, okMsg: 'Pesan dihapus.' });
      }
    };
  }

  // ============================================================
  // HALAMAN: LAPORAN PENGUNJUNG (grafik harian & bulanan)
  // ============================================================
  function renderPengunjung(el) {
    const S = App.boot.stats || {}, series = S.series || {};
    const st = ui.vis = ui.vis || { mode: 'harian' };
    const d30 = lastDays(30), sum = (arr) => arr.reduce((n, d) => n + (series[d] || 0), 0);
    const months = {}; Object.keys(series).forEach(d => { const m = d.slice(0, 7); months[m] = (months[m] || 0) + series[d]; });
    const now = new Date(), mKeys = [];
    for (let i = 11; i >= 0; i--) { const x = new Date(now.getFullYear(), now.getMonth() - i, 1); mKeys.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')); }
    const thisMonth = months[mKeys[11]] || 0, best = Object.keys(series).sort((a, b) => series[b] - series[a])[0];
    el.innerHTML = `${pageHead('Interaksi', 'Laporan Pengunjung', 'Jumlah pengunjung unik per perangkat per hari. Data dicatat otomatis tanpa perlu tindakan pengunjung.', `<button class="btn btn-soft" type="button" data-csv>${icon('download')} Unduh CSV</button>`, 'bars')}
      <div class="kpis">${kpi('users', 'Hari Ini', fmtN(S.hari_ini))}${kpi('chart', '7 Hari', fmtN(sum(lastDays(7))))}${kpi('calendar', '30 Hari', fmtN(sum(d30)))}${kpi('bars', 'Bulan Ini', fmtN(thisMonth))}${kpi('trophy', 'Hari Teramai', best ? fmtDate(best, true) + ' (' + fmtN(series[best]) + ')' : '—')}${kpi('globe', 'Total Kunjungan', fmtN(S.total))}</div>
      <div class="panel"><div class="panel-head"><h3>${icon('bars')} Grafik Kunjungan</h3><div class="seg">${['harian', 'bulanan'].map(m => `<button type="button" class="${st.mode === m ? 'on' : ''}" data-mode="${m}">${m === 'harian' ? '30 Hari' : '12 Bulan'}</button>`).join('')}</div></div>
        <canvas class="chart" id="visChart" height="300"></canvas></div>`;
    const c = $('#visChart', el);
    if (st.mode === 'harian') drawBars(c, d30.map(d => d.slice(8)), d30.map(d => series[d] || 0));
    else drawBars(c, mKeys.map(m => Core.BULAN[+m.slice(5) - 1].slice(0, 3) + ' ' + m.slice(2, 4)), mKeys.map(m => months[m] || 0));
    $$('[data-mode]', el).forEach(b => b.onclick = () => { st.mode = b.dataset.mode; rerender(); });
    $('[data-csv]', el).onclick = () => download('pengunjung-' + Core.today() + '.csv', 'tanggal,jumlah\n' + Object.keys(series).sort().map(d => d + ',' + series[d]).join('\n'), 'text/csv');
  }
  function drawBars(canvas, labels, values) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1, W = canvas.clientWidth || 600, H = canvas.height;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement), col = (v) => css.getPropertyValue(v).trim();
    const pad = { l: 40, r: 8, t: 14, b: 26 }, w = W - pad.l - pad.r, h = H - pad.t - pad.b;
    const max = Math.max(4, ...values), step = Math.pow(10, Math.floor(Math.log10(max))) * (max / Math.pow(10, Math.floor(Math.log10(max))) > 5 ? 2 : 1), top = Math.ceil(max / step) * step;
    ctx.font = '11px Inter, system-ui, sans-serif'; ctx.fillStyle = col('--muted'); ctx.strokeStyle = col('--border'); ctx.lineWidth = 1;
    for (let v = 0; v <= top; v += step) { const y = pad.t + h - (v / top) * h; ctx.beginPath(); ctx.moveTo(pad.l, y + .5); ctx.lineTo(W - pad.r, y + .5); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(fmtN(v), pad.l - 6, y + 4); }
    const n = values.length, bw = w / n, gap = Math.max(2, bw * .28);
    const every = Math.ceil(n / Math.max(1, Math.floor(w / 46)));
    values.forEach((v, i) => {
      const x = pad.l + i * bw + gap / 2, bh = (v / top) * h, y = pad.t + h - bh;
      ctx.fillStyle = i === n - 1 ? col('--gold') : col('--primary');
      const r = Math.min(4, (bw - gap) / 2);
      ctx.beginPath(); ctx.moveTo(x, pad.t + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.lineTo(x + bw - gap - r, y); ctx.quadraticCurveTo(x + bw - gap, y, x + bw - gap, y + r); ctx.lineTo(x + bw - gap, pad.t + h); ctx.fill();
      if (i % every === 0 || i === n - 1) { ctx.fillStyle = col('--muted'); ctx.textAlign = 'center'; ctx.fillText(labels[i], x + (bw - gap) / 2, H - 8); }
    });
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Grafik: ' + labels.map((l, i) => l + ' ' + values[i]).join(', '));
  }
  function download(name, content, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ============================================================
  // HALAMAN: MIGRASI & BACKUP (gas-migrasi-database)
  // ============================================================
  const IMPORT_SHEETS = ['Pengaturan', 'Kontak', 'Beranda', 'Profil', 'Program', 'Prestasi', 'Fasilitas', 'Kegiatan', 'Penghargaan', 'Lulusan PTN', 'Alumni', 'FAQ', 'Berita', 'Mading', 'Video', 'Brosur', 'Testimoni', 'Pesan', 'Pengunjung', 'Logs'];
  function renderMigrasi(el) {
    const st = ui.mig = ui.mig || { src: '', sheets: IMPORT_SHEETS.filter(s => s !== 'Logs'), overwrite: false, result: null, jsonResult: null };
    el.innerHTML = `${pageHead('Sistem', 'Migrasi & Backup Database', 'Cadangkan data, pulihkan dari backup, dan pindahkan data dari spreadsheet app lama tanpa menyentuh app lama.', '', 'database')}
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h3><span class="step">1</span> Backup Database</h3></div>
          <p class="muted">Backup membuat salinan utuh spreadsheet ke folder <b>Backup Database</b> di Google Drive.</p>
          <div class="btn-row"><button class="btn" type="button" data-backup>${icon('database')} Buat Backup Sekarang</button><button class="btn btn-soft" type="button" data-export>${icon('download')} Ekspor JSON</button></div>
          <div class="switch-row field"><div><b>Backup otomatis harian</b><span class="hint">Berjalan pukul 01.00 WIB. Backup lama dihapus otomatis.</span></div><label class="switch"><input type="checkbox" data-auto><span></span></label></div>
          <div class="field inline"><label for="keep">Simpan</label><select id="keep" data-keep>${[7, 14, 30, 60].map(n => `<option value="${n}">${n} backup terakhir</option>`).join('')}</select></div>
        </div>
        <div class="panel"><div class="panel-head"><h3>${icon('history')} Daftar Backup</h3><button class="btn-icon" type="button" data-reload aria-label="Muat ulang">${icon('refresh')}</button></div><div data-backups><div class="skel" style="height:120px"></div></div></div>
      </div>
      <div class="panel"><div class="panel-head"><h3><span class="step">2</span> Migrasi dari App Lama (Spreadsheet)</h3></div>
        <div class="callout">${icon('info')}<div>Sumber <b>hanya dibaca</b>, tidak pernah diubah. Kolom dicocokkan berdasarkan <b>nama header</b> (mis. "Nama Prestasi" → judul, "ID Foto" → foto). Import aman diulang: data yang sudah ada tidak digandakan, jadi jalankan sekali lagi tepat sebelum pindah (delta sync). Gunakan akun Google yang sama agar ID foto/berkas Drive lama tetap terbaca.</div></div>
        <div class="field"><label for="src">URL atau ID Spreadsheet App Lama</label><input id="src" data-src placeholder="https://docs.google.com/spreadsheets/d/…/edit" value="${esc(st.src)}"></div>
        <div class="field"><span class="label">Data yang diimpor</span><div class="checks-grid">${IMPORT_SHEETS.map(s => `<label class="ck"><input type="checkbox" value="${esc(s)}" ${st.sheets.includes(s) ? 'checked' : ''}> ${esc(s)}</label>`).join('')}</div></div>
        <div class="switch-row field"><div><b>Timpa data yang sudah ada</b><span class="hint">Default mati: hanya menambah data baru & mengisi pengaturan yang masih bawaan. Nyalakan bila data app lama lebih benar.</span></div><label class="switch"><input type="checkbox" data-over ${st.overwrite ? 'checked' : ''}><span></span></label></div>
        <div class="btn-row"><button class="btn btn-soft" type="button" data-scan>${icon('search')} Pindai (Dry-run)</button><button class="btn" type="button" data-run>${icon('upload')} Jalankan Import</button></div>
        <div data-result>${st.result ? resultTable(st.result) : ''}</div>
      </div>
      <div class="panel"><div class="panel-head"><h3><span class="step">3</span> Impor dari Berkas (JSON / CSV)</h3></div>
        <div class="grid-2 flat">
          <div><p><b>Berkas JSON</b> hasil "Ekspor JSON" (dari app ini atau versi lain).</p>
            <div class="field inline"><label for="jmode">Mode</label><select id="jmode" data-jmode><option value="merge">Gabung (tambah yang belum ada)</option><option value="replace">Ganti total (seperti restore)</option></select></div>
            <label class="btn btn-soft">${icon('upload')} Pilih berkas .json<input type="file" accept=".json,application/json" data-json hidden></label></div>
          <div><p><b>Berkas CSV</b> per data (baris pertama = nama kolom).</p>
            <div class="field inline"><label for="csvs">Data tujuan</label><select id="csvs" data-csvsheet>${Object.keys(FORMS).concat(['Pesan', 'Pengunjung']).map(s => `<option>${esc(s)}</option>`).join('')}</select></div>
            <div class="btn-row"><label class="btn btn-soft">${icon('upload')} Pilih berkas .csv<input type="file" accept=".csv,text/csv" data-csv hidden></label><button class="btn btn-outline btn-sm" type="button" data-tpl>${icon('download')} Template CSV</button></div></div>
        </div>
        <div data-jresult>${st.jsonResult ? resultTable(st.jsonResult) : ''}</div>
      </div>`;
    const getSheets = () => $$('.checks-grid input:checked', el).map(i => i.value);
    $('[data-src]', el).oninput = (e) => st.src = e.target.value;
    $$('.checks-grid input', el).forEach(i => i.onchange = () => st.sheets = getSheets());
    $('[data-over]', el).onchange = (e) => st.overwrite = e.target.checked;
    const runImport = async (dry) => {
      if (!st.src.trim()) return toast('Tempel URL/ID spreadsheet app lama dulu.', 'error');
      if (!dry && !await confirmDialog('Jalankan import?', 'Data dari app lama akan ditulis ke database ini. Disarankan klik "Buat Backup Sekarang" lebih dulu.', 'Jalankan Import')) return;
      const box = $('[data-result]', el); box.innerHTML = `<p class="muted">${icon('refresh', 'spin')} ${dry ? 'Memindai' : 'Mengimpor'} data…</p>`;
      const res = await api('importData', { source: st.src, sheets: st.sheets, dryRun: dry, overwrite: st.overwrite }, { timeout: 330000, tries: 1 });
      if (!res.success) { box.innerHTML = `<div class="callout err">${icon('alert')}<div>${esc(res.message)}</div></div>`; return; }
      st.result = res.data; box.innerHTML = resultTable(res.data);
      if (!dry) { toast('Import selesai.', 'ok'); refreshBoot(); }
    };
    $('[data-scan]', el).onclick = () => runImport(true);
    $('[data-run]', el).onclick = () => runImport(false);
    $('[data-backup]', el).onclick = async (e) => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = icon('refresh', 'spin') + ' Membuat backup…';
      const res = await api('backupNow', { label: 'Manual' }, { timeout: 120000 });
      b.disabled = false; b.innerHTML = icon('database') + ' Buat Backup Sekarang';
      if (res.success) { toast(res.data.message, 'ok'); loadBackups(el, true); } else toast(res.message, 'error');
    };
    $('[data-export]', el).onclick = async (e) => {
      const b = e.currentTarget; b.disabled = true;
      const res = await api('exportJson', {}, { timeout: 120000 });
      b.disabled = false;
      if (res.success) download('backup-sma-triguna-' + Core.today() + '.json', JSON.stringify(res.data, null, 1), 'application/json'); else toast(res.message, 'error');
    };
    $('[data-reload]', el).onclick = () => loadBackups(el, true);
    const saveAuto = async () => {
      const aktif = $('[data-auto]', el).checked, simpan = $('[data-keep]', el).value;
      const res = await api('setAutoBackup', { aktif, simpan });
      if (res.success) toast(res.data.message, 'ok'); else { toast(res.message, 'error'); $('[data-auto]', el).checked = !aktif; }
    };
    $('[data-auto]', el).onchange = saveAuto; $('[data-keep]', el).onchange = saveAuto;
    $('[data-json]', el).onchange = async (e) => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      let data; try { data = JSON.parse(await f.text()); } catch (x) { return toast('Berkas JSON tidak valid.', 'error'); }
      importFile(el, data, $('[data-jmode]', el).value, null);
    };
    $('[data-csv]', el).onchange = async (e) => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const rows = parseCsv(await f.text()); if (!rows.length) return toast('CSV kosong atau tidak terbaca.', 'error');
      const sh = $('[data-csvsheet]', el).value, obj = {}; obj[sh] = rows;
      importFile(el, obj, 'merge', [sh]);
    };
    $('[data-tpl]', el).onclick = () => {
      const sh = $('[data-csvsheet]', el).value, cols = (App.boot.schema[sh] || { cols: [] }).cols.filter(c => ['dibuat', 'diperbarui'].indexOf(c) === -1);
      download('template-' + sh.replace(/\s+/g, '-').toLowerCase() + '.csv', '﻿' + cols.join(',') + '\n', 'text/csv');
    };
    loadBackups(el, false);
  }
  async function importFile(el, data, mode, sheets) {
    const st = ui.mig, box = $('[data-jresult]', el);
    box.innerHTML = `<p class="muted">${icon('refresh', 'spin')} Memindai berkas…</p>`;
    const dry = await api('importJson', { data, mode, sheets, dryRun: true }, { timeout: 330000, tries: 1 });
    if (!dry.success) { box.innerHTML = `<div class="callout err">${icon('alert')}<div>${esc(dry.message)}</div></div>`; return; }
    box.innerHTML = resultTable(dry.data);
    if (!await confirmDialog('Terapkan impor ini?', mode === 'replace' ? 'Mode GANTI TOTAL: isi data yang dipilih akan diganti seluruhnya dengan isi berkas.' : 'Data baru dari berkas akan ditambahkan.', 'Terapkan', mode === 'replace' ? 'danger' : '')) return;
    const res = await api('importJson', { data, mode, sheets, dryRun: false }, { timeout: 330000, tries: 1 });
    if (!res.success) { box.innerHTML = `<div class="callout err">${icon('alert')}<div>${esc(res.message)}</div></div>`; return; }
    st.jsonResult = res.data; box.innerHTML = resultTable(res.data); toast('Impor berkas selesai.', 'ok'); refreshBoot();
  }
  function resultTable(r) {
    const rep = r.report || {}, keys = Object.keys(rep), replace = r.mode === 'replace';
    return `<div class="result"><p class="result-head">${r.dryRun ? `<span class="tag tag-gold no-dot">DRY-RUN — belum ada yang ditulis</span>` : `<span class="tag tag-ok no-dot">SELESAI</span>`} Sumber: <b>${esc(r.source && r.source.name || '-')}</b></p>
      <table class="tbl compact"><thead><tr><th>Data</th>${replace ? '<th>Di sumber</th><th>Saat ini</th>' : '<th>Di sumber</th><th>Ditambah</th><th>Diperbarui</th><th>Dilewati</th>'}</tr></thead>
      <tbody>${keys.map(k => { const x = rep[k]; return x.missing ? `<tr class="dim"><td>${esc(k)}</td><td colspan="${replace ? 2 : 4}">tidak ada di sumber</td></tr>` : replace ? `<tr><td>${esc(k)}</td><td>${x.source}</td><td>${x.current}</td></tr>` : `<tr><td>${esc(k)}</td><td>${x.source}</td><td class="pos">${x.inserted || 0}</td><td class="upd">${x.updated || 0}</td><td>${x.skipped || 0}</td></tr>`; }).join('')}</tbody></table>
      ${(r.warnings || []).length ? `<ul class="warns">${r.warnings.map(w => `<li>${icon('alert')} ${esc(w)}</li>`).join('')}</ul>` : ''}
      ${r.safetyBackup ? `<p class="muted">${icon('database')} Backup pengaman dibuat otomatis: ${esc(r.safetyBackup.name)}</p>` : ''}</div>`;
  }
  async function loadBackups(el, force) {
    const box = $('[data-backups]', el);
    await Core.swr('backups', () => api('listBackups', {}), (d) => {
      $('[data-auto]', el).checked = !!d.auto; $('[data-keep]', el).value = String([7, 14, 30, 60].includes(d.keep) ? d.keep : 14);
      box.innerHTML = d.backups.length ? `<ul class="bk-list">${d.backups.map(b => `<li><span class="bk-ic">${icon('database')}</span><div><b>${esc(b.name.replace(/^Backup DB — /, ''))}</b><small>${fmtDateTime(b.date)} · ${(b.size / 1024).toFixed(0)} KB</small></div>
        <a class="btn-icon" href="${esc(b.url)}" target="_blank" rel="noopener" aria-label="Buka">${icon('external')}</a><button class="btn btn-soft btn-sm" type="button" data-restore="${esc(b.id)}">${icon('history')} Pulihkan</button><button class="btn-icon danger" type="button" data-delbk="${esc(b.id)}" aria-label="Hapus">${icon('trash')}</button></li>`).join('')}</ul>
        <a class="muted small" href="${esc(d.folderUrl)}" target="_blank" rel="noopener">${icon('external')} Buka folder backup di Drive</a>` : emptyState('database', 'Belum ada backup. Klik "Buat Backup Sekarang".');
      box.onclick = async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.restore) {
          const dry = await api('restoreBackup', { id: b.dataset.restore, dryRun: true }, { timeout: 330000, tries: 1 });
          if (!dry.success) return toast(dry.message, 'error');
          const sum = Object.keys(dry.data.report).filter(k => !dry.data.report[k].missing).map(k => `${k}: ${dry.data.report[k].current} → ${dry.data.report[k].source}`).slice(0, 12).join('\n');
          if (!await confirmDialog('Pulihkan dari backup ini?', 'Seluruh isi website akan dikembalikan ke kondisi backup. Kondisi saat ini otomatis dibackup dulu.\n\n' + sum, 'Pulihkan Sekarang', 'danger')) return;
          b.disabled = true; b.innerHTML = icon('refresh', 'spin') + ' Memulihkan…';
          const res = await api('restoreBackup', { id: b.dataset.restore }, { timeout: 330000, tries: 1 });
          if (res.success) { toast('Data berhasil dipulihkan.', 'ok'); refreshBoot(); loadBackups(el, true); } else { toast(res.message, 'error'); b.disabled = false; }
        } else if (b.dataset.delbk) {
          if (!await confirmDialog('Hapus backup?', 'Berkas backup dipindahkan ke Sampah Google Drive.', 'Hapus', 'danger')) return;
          const res = await api('deleteBackup', { id: b.dataset.delbk });
          if (res.success) { toast(res.data.message, 'ok'); loadBackups(el, true); } else toast(res.message, 'error');
        }
      };
    }, { fresh: force ? 0 : 60000, onError: (r) => { box.innerHTML = `<div class="callout err">${icon('alert')}<div>${esc(r.message)}</div></div>`; } });
  }
  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map(h => h.trim());
    return rows.filter(r => r.join('').trim()).map(r => { const o = {}; head.forEach((h, i) => { if (h) o[h] = (r[i] || '').trim(); }); return o; });
  }

  // ============================================================
  // HALAMAN: LOG AKTIVITAS
  // ============================================================
  function renderLog(el) {
    el.innerHTML = `${pageHead('Sistem', 'Log Aktivitas', 'Riwayat perubahan konten, login, upload, import, dan backup.', `<button class="btn btn-soft" type="button" data-r>${icon('refresh')} Muat Ulang</button>`, 'history')}<div class="panel" data-logs><div class="skel" style="height:200px"></div></div>`;
    const box = $('[data-logs]', el);
    const load = (force) => Core.swr('logs', () => api('logs', {}), (rows) => {
      box.innerHTML = rows.length ? `<table class="tbl compact"><thead><tr><th>Waktu</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>${rows.map(r => `<tr><td>${fmtDateTime(r.waktu)}</td><td><span class="tag no-dot">${esc(r.aksi)}</span></td><td class="t-main"><small>${esc(r.detail)}</small></td></tr>`).join('')}</tbody></table>` : emptyState('history', 'Belum ada aktivitas tercatat.');
    }, { fresh: force ? 0 : 30000, onError: (r) => { box.innerHTML = `<div class="callout err">${icon('alert')}<div>${esc(r.message)}</div></div>`; } });
    $('[data-r]', el).onclick = () => load(true);
    load(false);
  }

  // Prefetch saat idle: daftar backup & log (1 panggilan batch)
  async function prefetch() {
    if (!App.token) return;
    const res = await api('batch', { calls: [{ action: 'listBackups' }, { action: 'logs' }] });
    if (!res.success) return;
    [['listBackups', 'backups'], ['logs', 'logs']].forEach(([a, k]) => { const r = res.data[a]; if (r && r.success) Store.set('c:' + k, { t: Date.now(), h: hashStr(JSON.stringify(r.data)), data: r.data }); });
  }

  // ============================================================
  // DIALOG KONFIRMASI
  // ============================================================
  let dialogResolve = null;
  function confirmDialog(title, text, okLabel, kind) {
    const d = $('#dialog'), box = $('.dialog-box', d);
    box.innerHTML = `<div class="modal-body"><h3>${esc(title)}</h3><p class="pre">${esc(text)}</p><div class="btn-row end"><button class="btn btn-soft" type="button" data-no>Batal</button><button class="btn ${kind === 'danger' ? 'btn-danger' : ''}" type="button" data-yes>${esc(okLabel || 'Ya')}</button></div></div>`;
    d.classList.add('open');
    setTimeout(() => $('[data-yes]', box).focus(), 30);
    return new Promise(res => { dialogResolve = res; $('[data-no]', box).onclick = () => closeDialog(false); $('[data-yes]', box).onclick = () => closeDialog(true); d.onclick = (e) => { if (e.target === d) closeDialog(false); }; });
  }
  function closeDialog(v) { const d = $('#dialog'); if (!d.classList.contains('open')) return; d.classList.remove('open'); if (dialogResolve) { dialogResolve(v); dialogResolve = null; } }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
