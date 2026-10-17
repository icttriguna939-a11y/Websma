/* ============================================================
   HALAMAN PUBLIK — SMA Triguna 1956
   Alur instan: render dari cache perangkat / konten bawaan (0 ms),
   lalu ambil data terbaru (1 panggilan GET) dan render ulang
   hanya section yang berubah.
   ============================================================ */
(function () {
  'use strict';
  const { icon, esc, nl2br, paras, lines, pairs, imgUrl, fileUrls, ytId, ytThumb, fmtDate, Store, toast } = Core;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const R = (name) => $('[data-r="' + name + '"]');
  let C = null;                       // konten aktif
  let STATS = Store.get('stats', { hari_ini: 0, total: 0 });
  const secHash = {};                 // hash per section → render ulang hanya bila berubah
  const state = { galTab: 'Fasilitas', beritaCat: 'Semua' };

  // ---------- util kecil ----------
  const img = (src, alt, cls, w, eager) => src ? '<img data-fade class="lazy-fade ' + (cls || '') + '" src="' + esc(imgUrl(src, w)) + '" alt="' + esc(alt || '') + '"' + (eager ? '' : ' loading="lazy" decoding="async"') + '>' : '';
  const set = (name, html) => { const el = R(name); if (el) el.innerHTML = html; return el; };
  const waLink = (msg) => { const n = String((C.Kontak || {}).whatsapp || '').replace(/\D/g, ''); return n ? 'https://wa.me/' + n + (msg ? '?text=' + encodeURIComponent(msg) : '') : '#kontak'; };
  const ppdbUrl = () => (C.Pengaturan || {}).ppdb_url || '#kontak';
  function highlightLast(t, n) { const w = String(t || '').split(' '); if (w.length < 3) return esc(t); return esc(w.slice(0, -n).join(' ')) + ' <span class="hl">' + esc(w.slice(-n).join(' ')) + '</span>'; }
  function hydrateIcons(root) { $$('[data-i]', root).forEach(el => { if (!el.dataset.done) { el.innerHTML = icon(el.dataset.i); el.dataset.done = 1; } }); }
  const SECTIONS = {
    brand: ['Pengaturan'], top: ['Kontak'], hero: ['Beranda', 'Pengaturan'], tentang: ['Profil'], lolos: ['Alumni', 'Lulusan PTN'],
    program: ['Program'], video: ['Video'], pembinaan: ['Profil'], tour: ['Pengaturan', 'Video'], galeri: ['Fasilitas', 'Kegiatan'],
    penghargaan: ['Penghargaan'], prestasi: ['Prestasi'], ptn: ['Lulusan PTN'], berita: ['Berita', 'Mading'], testimoni: ['Testimoni'],
    brosur: ['Brosur', 'Pengaturan'], kontak: ['Kontak'], footer: ['Kontak', 'Pengaturan', 'FAQ']
  };

  // ============================================================
  // RENDER PER SECTION
  // ============================================================
  const Render = {
    brand() {
      const s = C.Pengaturan || {};
      set('brand', '<img src="' + esc(imgUrl(s.logo, 200) || 'assets/logo.svg') + '" alt="" width="44" height="44"><span><b>' + esc(s.nama_sekolah || 'SMA Triguna 1956') + '</b><small>' + esc(s.slogan || '') + '</small></span>');
      const nav = R('navPpdb'); nav.href = ppdbUrl(); nav.textContent = 'Daftar';
      document.title = (s.nama_sekolah || 'SMA Triguna 1956') + ' Jakarta — ' + (s.slogan || 'Excellent in Education and Character');
      if (s.logo) { const l = $('link[rel="icon"]'); l.href = imgUrl(s.logo, 128); l.removeAttribute('type'); }
    },
    top() {
      const k = C.Kontak || {};
      set('topPhone', k.telepon ? '<a href="tel:' + esc(k.telepon.replace(/[^\d+]/g, '')) + '">' + icon('phone') + ' ' + esc(k.telepon) + '</a>' : '');
      set('topMail', k.email ? '<a href="mailto:' + esc(k.email) + '">' + icon('mail') + ' ' + esc(k.email) + '</a>' : '');
      set('topLoc', icon('pin') + ' ' + esc((k.alamat || '').split(',').slice(-2).join(',').trim() || 'Jakarta Selatan'));
      const fab = R('waFab'); fab.href = waLink('Halo, saya ingin konsultasi PPDB SMA Triguna 1956.');
    },
    hero() {
      const b = C.Beranda || {}, s = C.Pengaturan || {};
      const heroImg = R('heroImg');
      const src = imgUrl(b.gambar_latar, 1920);
      if (src && heroImg.getAttribute('src') !== src) heroImg.src = src;
      const moto = s.slogan || 'Excellent in Education and Character';
      const sub = esc(b.subjudul || '').replace(esc(moto), '<em>' + esc(moto) + '</em>');
      set('hero', `
        <span class="chip chip-glass hero-badge" data-a="1">${icon('award')} ${esc(b.badge || '')}</span>
        <h1 data-a="2">${esc(b.judul || '')}</h1>
        <p class="hero-sub" data-a="3">${sub}</p>
        <div class="hero-cta" data-a="4">
          <a class="btn btn-light" href="${esc(ppdbUrl())}" target="_blank" rel="noopener">${icon('cap')} ${esc(s.ppdb_teks || 'Daftar Sekarang')}</a>
          <a class="btn btn-ghost" href="#tentang">${icon('compass')} Jelajahi Profil Sekolah</a>
        </div>
        <div class="hero-stats" data-a="5">${pairs(b.statistik).map(p => `<div><b data-count>${esc(p.a)}</b><span>${esc(p.b)}</span></div>`).join('')}</div>`);
    },
    tentang() {
      const p = C.Profil || {};
      const stats = [[p.jumlah_siswa, 'Siswa Aktif'], [p.jumlah_guru, 'Guru Bersertifikasi'], [p.jumlah_kelas, 'Ruang Kelas'], [p.jumlah_lab, 'Laboratorium']].filter(x => x[0]);
      const misi = lines(p.misi);
      set('tentang', `
        <div class="split">
          <div class="split-media reveal from-left">
            <div class="photo-card" data-speed="-0.06">${img(p.kepsek_foto, p.kepsek_nama, '', 900)}
              <div class="photo-cap"><span class="chip chip-glass">Kepemimpinan</span><b>${esc(p.kepsek_nama || '')}</b><small>${esc(p.kepsek_jabatan || '')}</small></div>
            </div>
          </div>
          <div class="split-text reveal from-right">
            <span class="chip">${icon('check-circle')} Tentang Sekolah Kami</span>
            <h2>${highlightLast(p.judul, 2)}</h2>
            ${paras(p.sejarah)}
            ${p.sambutan_kepsek ? `<blockquote class="quote">${icon('quote')}<p>${nl2br(p.sambutan_kepsek)}</p><cite>— ${esc(p.kepsek_nama || 'Kepala Sekolah')}</cite></blockquote>` : ''}
            <div class="stat-grid">${stats.map(s => `<div class="stat"><b data-count>${esc(s[0])}</b><span>${s[1]}</span></div>`).join('')}</div>
          </div>
        </div>
        <div class="vmm">
          <article class="vm-card reveal" style="--d:0"><span class="num-pill">01</span><h3>Visi</h3><p>${nl2br(p.visi)}</p></article>
          <article class="vm-card reveal" style="--d:1"><span class="num-pill">02</span><h3>Misi</h3><ul class="checks">${misi.map(m => `<li>${icon('check')}${esc(m)}</li>`).join('')}</ul></article>
          <article class="vm-card accent reveal" style="--d:2"><span class="num-pill">03</span><h3>Moto</h3><p class="moto">“${esc(p.moto)}”</p></article>
        </div>`);
    },
    lolos() {
      const A = C.Alumni || [], P = C['Lulusan PTN'] || [];
      const total = P.reduce((n, x) => n + (parseInt(x.jumlah_siswa, 10) || 0), 0);
      set('lolos', `
        <div class="lolos-head reveal">
          <div><span class="chip chip-glass">${icon('trophy')} Pengumuman Resmi Kelulusan SNBP &amp; SNBT</span>
            <h2>Selamat &amp; Sukses Ksatria Triguna 1956 Lolos PTN Favorit</h2>
            <p>Apresiasi setinggi-tingginya kepada para siswa-siswi berprestasi atas dedikasi dan kerja keras hingga menembus universitas negeri impian bangsa.</p></div>
          ${total ? `<div class="lolos-stat"><b data-count>${total}</b><span>Total Siswa Lolos PTN</span></div>` : ''}
        </div>
        <div class="alumni-grid">${A.map((a, i) => `
          <article class="alumni reveal" style="--d:${i % 4}">
            <div class="alumni-img">${img(a.foto, a.nama, '', 600)}<span class="tag tag-gold no-dot">${esc(a.jalur || '')}</span><b class="ptn-badge">${esc(a.singkatan || '')}</b></div>
            <div class="alumni-body"><small>${esc(a.ptn)}</small><h3>${esc(a.nama)}</h3><p>${esc(a.jurusan)}</p></div>
          </article>`).join('')}</div>
        <div class="center"><a class="btn btn-light" href="#ptn">Lihat Jejaring Lulusan PTN ${icon('arrow')}</a></div>`);
    },
    program() {
      const P = C.Program || [];
      set('program', P.map((p, i) => `
        <article class="prog reveal" style="--d:${i % 4}" tabindex="0" data-open="program:${esc(p.id)}">
          <div class="prog-img">${img(p.foto, p.nama, '', 700)}<span class="num-pill">${String(i + 1).padStart(2, '0')}</span></div>
          <div class="prog-body"><h3>${esc(p.nama)}</h3><p>${esc(p.deskripsi)}</p><span class="link">Selengkapnya ${icon('arrow')}</span></div>
        </article>`).join('') || empty('Program akan segera diumumkan.'));
    },
    video() {
      const V = C.Video || [];
      if (!V.length) return set('video', empty('Video belum tersedia.'));
      const main = V.find(v => v.unggulan === 'Ya') || V[0];
      const rest = V.filter(v => v !== main).slice(0, 3);
      const thumb = (v) => imgUrl(v.thumbnail, 1200) || ytThumb(v.tautan);
      set('video', `
        <button class="vid-main reveal from-left" type="button" data-video="${esc(main.id)}" aria-label="Putar video ${esc(main.judul)}">
          ${thumb(main) ? `<img data-fade class="lazy-fade" loading="lazy" src="${esc(thumb(main))}" alt="">` : ''}
          <span class="vid-shade"></span>
          <span class="tag tag-gold no-dot vid-tag">Unggulan</span>${main.durasi ? `<span class="vid-dur">${esc(main.durasi)}</span>` : ''}
          <span class="play">${icon('play')}</span>
          <span class="vid-text"><b>${esc(main.judul)}</b><small>${esc(main.deskripsi || '')}</small></span>
        </button>
        <div class="vid-side reveal from-right">
          <h3>${icon('layers')} Video Dokumentasi Terbaru</h3>
          ${rest.map(v => `<button class="vid-item" type="button" data-video="${esc(v.id)}">
              <span class="vid-th">${thumb(v) ? `<img data-fade class="lazy-fade" loading="lazy" src="${esc(thumb(v))}" alt="">` : ''}<span class="play sm">${icon('play')}</span></span>
              <span><small>${esc(v.jenis || '')}</small><b>${esc(v.judul)}</b>${v.durasi ? `<em>${icon('clock')} ${esc(v.durasi)}</em>` : ''}</span></button>`).join('')}
          <button class="btn btn-soft btn-block" type="button" data-allvideo>Lihat Semua Video Dokumentasi ${icon('arrow')}</button>
        </div>`);
    },
    pembinaan() {
      const p = C.Profil || {};
      set('pembinaan', `
        <div class="split rev">
          <div class="split-media reveal from-right">
            <div class="photo-card wide" data-speed="-0.05">${img(p.pembinaan_foto, 'Siswa SMA Triguna', '', 1000)}</div>
            <div class="float-card">${icon('users')}<div><b>Generasi Unggul</b><small>Toleran, Tangguh &amp; Mandiri</small></div></div>
          </div>
          <div class="split-text reveal from-left">
            <span class="chip">${icon('compass')} Ekosistem Tumbuh Kembang</span>
            <h2>${highlightLast(p.pembinaan_judul, 2)}</h2>
            ${paras(p.pembinaan_teks)}
            <ul class="checks two">${lines(p.pembinaan_poin).map(x => `<li>${icon('check-circle')}${esc(x)}</li>`).join('')}</ul>
            <div class="stat-row">${pairs(p.pembinaan_stat).map(s => `<div><b data-count>${esc(s.a)}</b><span>${esc(s.b)}</span></div>`).join('')}</div>
          </div>
        </div>`);
    },
    tour() {
      const s = C.Pengaturan || {};
      set('tour', `
        <div class="sec-head center reveal light"><span class="chip chip-glass">${icon('compass')} Eksplorasi Fasilitas Daring</span>
          <h2>${esc(s.tour_judul || 'Jelajahi Kampus Secara Virtual')}</h2><p>${esc(s.tour_teks || '')}</p>
          <button class="btn btn-light" type="button" data-tour>${icon('globe')} Mulai Virtual Tour 360°</button></div>
        <button class="pano reveal" type="button" data-tour aria-label="Mulai virtual tour 360 derajat">
          <span class="pano-img" style="background-image:url('${esc(imgUrl(s.tour_gambar, 2000))}')"></span>
          <span class="pano-label">${icon('compass')} 360° Interactive Campus Tour</span>
          <span class="hotspot h1">${icon('flask')}</span><span class="hotspot h2">${icon('book')}</span><span class="hotspot h3">${icon('trophy')}</span>
          <span class="pano-hint">${icon('arrow')} Klik untuk memulai tur 360 derajat</span>
        </button>`);
    },
    galeri() {
      const tabs = [['Fasilitas', 'Fasilitas', 'building'], ['Kegiatan', 'Kegiatan', 'calendar']].filter(t => (C[t[0]] || []).length);
      if (!tabs.some(t => t[0] === state.galTab) && tabs[0]) state.galTab = tabs[0][0];
      set('galTabs', tabs.map(t => `<button type="button" role="tab" aria-selected="${t[0] === state.galTab}" data-gal="${t[0]}">${icon(t[2])} ${t[1]}</button>`).join(''));
      const items = C[state.galTab] || [];
      R('galeri').classList.toggle('feature', items.length >= 5);
      set('galeri', items.map((x, i) => `
        <figure class="gal reveal in" style="--d:${i % 4}" data-lightbox="${state.galTab}:${i}" tabindex="0">
          ${img(x.foto, x.nama || x.judul, '', 800)}
          <figcaption>${x.tanggal ? `<small>${icon('calendar')} ${fmtDate(x.tanggal)}</small>` : ''}<b>${esc(x.nama || x.judul)}</b><span>${esc(x.deskripsi || '')}</span></figcaption>
        </figure>`).join('') || empty('Belum ada data.'));
    },
    penghargaan() {
      set('penghargaan', (C.Penghargaan || []).map((a, i) => `
        <article class="award reveal" style="--d:${i % 4}">
          <div class="award-ic">${a.foto ? img(a.foto, a.nama, '', 300) : icon('award')}</div>
          <div><h3>${esc(a.nama)}</h3><p>${esc(a.institusi)}</p>${a.tanggal ? `<small>${icon('calendar')} ${fmtDate(a.tanggal)}</small>` : ''}</div>
        </article>`).join('') || empty('Belum ada data penghargaan.'));
    },
    prestasi() {
      const P = C.Prestasi || [];
      set('prestasi', `
        <div class="car-track" tabindex="0" aria-label="Galeri prestasi, geser untuk melihat lainnya">${P.map((p, i) => `
          <article class="poster" data-lightbox="Prestasi:${i}">
            <div class="poster-img">${img(p.foto, p.judul, '', 800)}<span class="tag tag-gold no-dot">${esc(p.tingkat ? 'Tingkat ' + p.tingkat : '')}</span>
              <div class="poster-title"><small>${esc([p.bidang, p.tahun].filter(Boolean).join(' • '))}</small><h3>${esc(p.judul)}</h3></div></div>
            <div class="poster-body"><p>${p.peraih ? `<b>${esc(p.peraih)}</b> — ` : ''}${esc(p.keterangan || '')}</p><span class="link">Kategori ${esc(p.bidang || 'Umum')} ${icon('trophy')}</span></div>
          </article>`).join('')}</div>
        <div class="car-nav"><button class="btn-icon" type="button" data-car="-1" aria-label="Sebelumnya">${icon('chev-left')}</button><div class="dots"></div><button class="btn-icon" type="button" data-car="1" aria-label="Berikutnya">${icon('chev-right')}</button></div>`);
      setupCarousel(R('prestasi'));
    },
    ptn() {
      const P = C['Lulusan PTN'] || [];
      const tile = (p) => `<div class="ptn-tile"><span class="ptn-logo">${p.logo ? img(p.logo, p.nama_ptn, '', 200) : esc(p.singkatan || p.nama_ptn.slice(0, 3))}</span><b>${esc(p.nama_ptn)}</b>${p.jumlah_siswa ? `<small>${esc(p.jumlah_siswa)} Siswa Diterima</small>` : ''}</div>`;
      const row = P.map(tile).join('');
      set('ptn', P.length ? `<div class="marquee-track${Core.LOW_MOTION ? ' static' : ''}">${row}<span aria-hidden="true" class="dup">${row}</span></div>` : '');
    },
    berita() {
      const B = C.Berita || [];
      const cats = ['Semua'].concat(Array.from(new Set(B.map(b => b.kategori).filter(Boolean))));
      if (cats.indexOf(state.beritaCat) === -1) state.beritaCat = 'Semua';
      set('beritaCats', cats.map(c => `<button type="button" class="${c === state.beritaCat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c === 'Semua' ? 'Semua Berita' : c)}</button>`).join(''));
      const list = B.filter(b => state.beritaCat === 'Semua' || b.kategori === state.beritaCat);
      set('berita', list.slice(0, 6).map((b, i) => `
        <article class="news ${i === 0 ? 'lead' : ''} reveal in">
          <a class="news-img" href="#berita/${esc(b.id)}" aria-label="Baca ${esc(b.judul)}">${img(b.gambar, b.judul, '', i === 0 ? 1200 : 600)}${b.kategori ? `<span class="tag no-dot">${esc(b.kategori)}</span>` : ''}</a>
          <div class="news-body">
            <small>${icon('calendar')} ${fmtDate(b.tanggal)} · ${readMin(b.isi)} mnt baca</small>
            <h3><a href="#berita/${esc(b.id)}">${esc(b.judul)}</a></h3>
            <p>${esc(b.ringkasan || String(b.isi || '').slice(0, 140))}</p>
            <div class="news-foot"><span>${icon('user')} ${esc(b.penulis || 'Humas')}</span><a href="#berita/${esc(b.id)}">Selengkapnya ${icon('arrow')}</a></div>
          </div>
        </article>`).join('') || empty('Belum ada berita pada kategori ini.'));
      const M = (C.Mading || []).slice().sort((a, b) => (b.sematkan === 'Ya') - (a.sematkan === 'Ya'));
      set('mading', M.map(m => `
        <div class="note note-${esc((m.warna || 'Biru').toLowerCase())}">${m.sematkan === 'Ya' ? `<span class="pin">${icon('pin2')}</span>` : ''}
          <small>${fmtDate(m.tanggal)}</small><b>${esc(m.judul)}</b><p>${nl2br(m.isi)}</p></div>`).join('') || '<p class="muted">Belum ada pengumuman.</p>');
    },
    testimoni() {
      const T = C.Testimoni || [];
      set('testimoni', `
        <div class="testi-head reveal from-left"><span class="chip chip-glass">${icon('quote')} Testimoni &amp; Kisah Alumni</span>
          <h2>Testimoni <em>Alumni Triguna</em></h2><p>Pengalaman otentik para ksatria Triguna tentang atmosfer belajar, dedikasi guru, serta pembinaan karakter yang membekali mereka bersaing di universitas unggulan.</p>
          <div class="stars">${icon('star')}${icon('star')}${icon('star')}${icon('star')}${icon('star')}</div></div>
        <div class="testi-grid">${T.map((t, i) => `
          <figure class="testi-card reveal" style="--d:${i % 3}"><blockquote>“${esc(t.isi)}”</blockquote>
            <figcaption>${t.foto ? img(t.foto, t.nama, 'avatar', 160) : `<span class="avatar">${esc(t.nama.slice(0, 1))}</span>`}<span><b>${esc(t.nama)}</b><small>${esc(t.keterangan)}</small></span></figcaption></figure>`).join('')}</div>`);
    },
    brosur() {
      const B = C.Brosur || [];
      set('brosur', `
        <div class="brosur reveal">
          <div class="brosur-text"><span class="chip chip-glass">${icon('file')} Unduhan Resmi</span><h2>Brosur Sekolah</h2>
            <p>Lihat dan unduh brosur resmi berisi program, fasilitas, biaya, dan jadwal PPDB SMA Triguna 1956.</p></div>
          <div class="brosur-list">${B.map(b => {
            const u = fileUrls(b.file);
            return `<div class="brosur-item"><span class="pdf">PDF</span><div><b>${esc(b.judul)}</b><small>${esc(b.keterangan || '')}</small></div>
              ${b.file ? `<a class="btn btn-sm btn-ghost" href="${esc(u.view)}" target="_blank" rel="noopener">${icon('eye')} Lihat</a><a class="btn btn-sm btn-gold" href="${esc(u.download)}" target="_blank" rel="noopener">${icon('download')} Unduh</a>`
                : `<a class="btn btn-sm btn-gold" href="${esc(waLink('Halo, saya ingin meminta brosur ' + b.judul))}" target="_blank" rel="noopener">${icon('whatsapp')} Minta via WA</a>`}</div>`;
          }).join('') || '<p>Brosur akan segera tersedia.</p>'}</div>
        </div>`);
    },
    kontak() {
      const k = C.Kontak || {};
      set('kontak', `
        <div class="map card">${k.maps_embed ? `<iframe title="Peta lokasi SMA Triguna 1956" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${esc(k.maps_embed)}"></iframe>` : ''}
          <span class="map-pin chip">${icon('pin')} Lokasi Strategis Kebayoran Baru</span></div>
        <div class="card addr">
          <h3>${icon('building')} Kampus ${esc((C.Pengaturan || {}).nama_sekolah || 'SMA Triguna 1956')}</h3>
          <p>${esc(k.alamat || '')}</p>
          <div class="addr-row"><span>${icon('clock')} ${nl2br(k.jam_operasional || '')}</span>${k.telepon ? `<a href="tel:${esc(k.telepon.replace(/[^\d+]/g, ''))}">${icon('phone')} ${esc(k.telepon)}</a>` : ''}${k.email ? `<a href="mailto:${esc(k.email)}">${icon('mail')} ${esc(k.email)}</a>` : ''}</div>
          <div class="addr-btns">${k.maps_url ? `<a class="btn btn-soft btn-sm" href="${esc(k.maps_url)}" target="_blank" rel="noopener">${icon('pin')} Buka di Google Maps</a>` : ''}
            <a class="btn btn-wa btn-sm" href="${esc(waLink('Halo, saya ingin bertanya tentang SMA Triguna 1956.'))}" target="_blank" rel="noopener">${icon('whatsapp')} Chat WhatsApp Petugas</a></div>
        </div>`);
    },
    footer() {
      const k = C.Kontak || {}, s = C.Pengaturan || {}, F = (C.FAQ || []).slice(0, 5);
      const soc = [['instagram', k.instagram], ['youtube', k.youtube], ['facebook', k.facebook], ['tiktok', k.tiktok]].filter(x => x[1]);
      set('footer', `
        <div class="foot-brand"><a class="brand light" href="#beranda"><img src="${esc(imgUrl(s.logo, 200) || 'assets/logo.svg')}" alt="" width="44" height="44"><span><b>${esc(s.nama_sekolah || 'SMA Triguna 1956')}</b><small>${esc(s.slogan || '')}</small></span></a>
          <p>Membina tunas bangsa dengan integritas akademik, kepemimpinan visioner, dan keluhuran budi pekerti sejak 1956 di Kebayoran Baru.</p>
          <div class="socials">${soc.map(x => `<a href="${esc(x[1])}" target="_blank" rel="noopener" aria-label="${x[0]}">${icon(x[0])}</a>`).join('')}</div></div>
        <div><h4>Alamat &amp; Operasional</h4><p>${icon('pin')} ${esc(k.alamat || '')}</p><p>${icon('clock')} ${nl2br(k.jam_operasional || '')}</p></div>
        <div><h4>Tautan Cepat</h4><ul class="foot-links">
          <li><a href="#tentang">${icon('chev-right')} Profil &amp; Visi Misi</a></li><li><a href="#lolos-ptn">${icon('chev-right')} Kelulusan SNBP &amp; SNBT</a></li>
          <li><a href="#prestasi">${icon('chev-right')} Galeri Prestasi Siswa</a></li><li><a href="#berita">${icon('chev-right')} Kabar Kampus Terkini</a></li>
          <li><a href="#brosur">${icon('chev-right')} Unduh Brosur</a></li><li><a href="${esc(ppdbUrl())}" target="_blank" rel="noopener">${icon('chev-right')} Portal PPDB</a></li></ul></div>
        <div><h4>Informasi &amp; FAQ</h4><div class="faq">${F.map(f => `<details><summary>${esc(f.pertanyaan)}${icon('chev-down')}</summary><p>${nl2br(f.jawaban)}</p></details>`).join('')}</div></div>`);
      renderFootBottom();
    }
  };
  function renderFootBottom() {
    const s = (C && C.Pengaturan) || {};
    set('footBottom', `<span>© ${new Date().getFullYear()} ${esc(s.nama_sekolah || 'SMA Triguna 1956')} Jakarta. Hak Cipta Dilindungi Undang-Undang.</span>
      <span class="visits">${icon('users')} Pengunjung hari ini <b>${(STATS.hari_ini || 0).toLocaleString('id-ID')}</b> · Total <b>${(STATS.total || 0).toLocaleString('id-ID')}</b></span>
      <a href="admin.html" class="admin-link">${icon('lock')} Admin</a>`);
  }
  function idle(fn, ms) { if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: ms }); else setTimeout(fn, ms); }
  function readMin(t) { return Math.max(1, Math.round(String(t || '').split(/\s+/).length / 180)); }
  function empty(msg) { return '<p class="empty">' + esc(msg) + '</p>'; }

  /** Render semua section; bila `onlyChanged`, lewati section yang datanya sama. */
  function renderAll(onlyChanged) {
    Object.keys(SECTIONS).forEach(name => {
      const h = Core.hashStr(JSON.stringify(SECTIONS[name].map(k => C[k])));
      if (onlyChanged && secHash[name] === h) return;
      secHash[name] = h;
      try { Render[name](); } catch (e) { console.error('Render ' + name, e); }
    });
    hydrateIcons(document);
    Core.wireImages();
    observeReveal();
    observeCounters();
  }

  // ============================================================
  // ANIMASI — reveal, counter, parallax (hanya saat terlihat)
  // ============================================================
  let revealObs, countObs;
  function observeReveal() {
    if (Core.LOW_MOTION || !('IntersectionObserver' in window)) { $$('.reveal').forEach(el => el.classList.add('in')); return; }
    revealObs = revealObs || new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.reveal:not(.in):not([data-ob])').forEach(el => { el.dataset.ob = 1; revealObs.observe(el); });
  }
  function observeCounters() {
    if (Core.LOW_MOTION || !('IntersectionObserver' in window)) return;
    countObs = countObs || new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { countUp(e.target); countObs.unobserve(e.target); } }), { threshold: .6 });
    $$('[data-count]:not([data-ob])').forEach(el => { el.dataset.ob = 1; countObs.observe(el); });
  }
  function countUp(el) {
    const txt = el.textContent, m = txt.match(/^(\D*)([\d.]+)(.*)$/);
    if (!m) return;
    const target = parseFloat(m[2].replace(/\./g, '')); if (!isFinite(target) || target < 2) return;
    const dots = m[2].indexOf('.') > -1, t0 = performance.now(), dur = 1100;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 3))); el.textContent = m[1] + (dots ? v.toLocaleString('id-ID') : v) + m[3]; if (p < 1) requestAnimationFrame(step); else el.textContent = txt; };
    requestAnimationFrame(step);
  }
  function setupParallax() {
    if (Core.LOW_MOTION) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight;
      $$('[data-speed]').forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;          // hanya elemen yang terlihat
        const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed);
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ============================================================
  // INTERAKSI — menu, tab, carousel, modal, lightbox, video, berita
  // ============================================================
  function setupCarousel(root) {
    const track = $('.car-track', root), dots = $('.dots', root);
    if (!track) return;
    const cards = $$('.poster', track);
    const per = () => Math.max(1, Math.round(track.clientWidth / (cards[0] ? cards[0].getBoundingClientRect().width : 1)));
    const pages = () => Math.max(1, Math.ceil(cards.length / per()));
    const draw = () => { const n = pages(), cur = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); dots.innerHTML = Array.from({ length: n }, (_, i) => `<span class="${i === Math.min(cur, n - 1) ? 'on' : ''}"></span>`).join(''); };
    track.addEventListener('scroll', Core.debounce(draw, 60), { passive: true });
    $$('[data-car]', root).forEach(b => b.onclick = () => track.scrollBy({ left: track.clientWidth * Number(b.dataset.car), behavior: Core.LOW_MOTION ? 'auto' : 'smooth' }));
    draw();
  }

  const modal = () => $('#modal');
  let lastFocus = null;
  function openModal(html, media) {
    const m = modal();
    lastFocus = document.activeElement;
    $('.modal-content', m).innerHTML = html;
    m.classList.toggle('media', !!media);
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    hydrateIcons(m); Core.wireImages(m);
    setTimeout(() => $('.modal-close', m).focus(), 30);
  }
  function closeModal() {
    const m = modal();
    if (!m.classList.contains('open')) return;
    m.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { if (!m.classList.contains('open')) $('.modal-content', m).innerHTML = ''; }, 220);   // hentikan video
    if (/^#berita\//.test(location.hash)) history.replaceState(null, '', '#berita');
    if (lastFocus) lastFocus.focus();
  }
  function playVideo(v) {
    const id = ytId(v.tautan);
    if (!id) { if (v.tautan) open(v.tautan, '_blank', 'noopener'); return; }
    openModal(`<div class="ratio"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${esc(v.judul)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><div class="media-cap"><b>${esc(v.judul)}</b><small>${esc(v.deskripsi || '')}</small></div>`, true);
  }
  function allVideos() {
    const V = C.Video || [];
    openModal(`<div class="modal-body"><h3>Semua Video Dokumentasi</h3><div class="vlist">${V.map(v => `<button class="vid-item" type="button" data-video="${esc(v.id)}"><span class="vid-th"><img data-fade class="lazy-fade" loading="lazy" src="${esc(imgUrl(v.thumbnail, 600) || ytThumb(v.tautan))}" alt=""><span class="play sm">${icon('play')}</span></span><span><small>${esc(v.jenis)}</small><b>${esc(v.judul)}</b></span></button>`).join('')}</div></div>`);
  }
  function openTour() {
    const s = C.Pengaturan || {};
    if (s.tour_url) {
      const id = ytId(s.tour_url);
      return openModal(`<div class="ratio"><iframe src="${esc(id ? 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1' : s.tour_url)}" title="Virtual tour 360°" allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer" allowfullscreen></iframe></div>`, true);
    }
    const v = (C.Video || []).find(x => /tour/i.test(x.jenis));
    if (v) return playVideo(v);
    toast('Virtual tour sedang disiapkan. Silakan hubungi kami untuk kunjungan langsung.');
  }
  function openLightbox(key) {
    const [sheet, idx] = key.split(':'), list = C[sheet] || [];
    let i = Number(idx);
    const draw = () => {
      const x = list[i]; if (!x) return;
      openModal(`<div class="lb"><div class="lb-img">${img(x.foto, x.judul || x.nama, '', 1600, true)}</div>
        <div class="media-cap"><b>${esc(x.judul || x.nama)}</b><small>${esc([x.peraih, x.tingkat && ('Tingkat ' + x.tingkat), x.tahun, x.tanggal && fmtDate(x.tanggal)].filter(Boolean).join(' • '))}</small><p>${esc(x.keterangan || x.deskripsi || '')}</p></div>
        ${list.length > 1 ? `<button class="lb-nav prev btn-icon" type="button" data-lb="-1" aria-label="Sebelumnya">${icon('chev-left')}</button><button class="lb-nav next btn-icon" type="button" data-lb="1" aria-label="Berikutnya">${icon('chev-right')}</button>` : ''}</div>`, true);
      $$('[data-lb]', modal()).forEach(b => b.onclick = () => { i = (i + Number(b.dataset.lb) + list.length) % list.length; draw(); });
    };
    draw();
  }
  function openProgram(id) {
    const p = (C.Program || []).find(x => x.id === id); if (!p) return;
    if (p.tautan) { open(p.tautan, '_blank', 'noopener'); return; }
    openModal(`<div class="detail">${img(p.foto, p.nama, 'detail-img', 1200, true)}<div class="modal-body"><span class="chip">${icon('cap')} Program</span><h2>${esc(p.nama)}</h2>${paras(p.deskripsi)}<a class="btn" href="${esc(ppdbUrl())}" target="_blank" rel="noopener">${icon('cap')} Daftar Sekarang</a></div></div>`);
  }
  function openBerita(id) {
    const b = (C.Berita || []).find(x => x.id === id);
    if (!b) return;
    const others = (C.Berita || []).filter(x => x.id !== id).slice(0, 3);
    openModal(`<article class="detail">${img(b.gambar, b.judul, 'detail-img', 1400, true)}<div class="modal-body reader">
      <div class="meta">${b.kategori ? `<span class="tag no-dot">${esc(b.kategori)}</span>` : ''}<small>${icon('calendar')} ${fmtDate(b.tanggal)} · ${icon('user')} ${esc(b.penulis || 'Humas')}</small></div>
      <h2>${esc(b.judul)}</h2>${paras(b.isi)}
      <div class="reader-share"><b>Bagikan:</b> ${shareLinks(location.origin + location.pathname + '#berita/' + b.id, b.judul)}</div>
      ${others.length ? `<h4>Berita lainnya</h4><ul class="others">${others.map(o => `<li><a href="#berita/${esc(o.id)}">${esc(o.judul)}</a><small>${fmtDate(o.tanggal)}</small></li>`).join('')}</ul>` : ''}
    </div></article>`);
  }
  function shareLinks(url, title) {
    const u = encodeURIComponent(url), t = encodeURIComponent(title || document.title);
    return `<a class="btn-icon" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener" aria-label="Bagikan ke WhatsApp">${icon('whatsapp')}</a>
      <a class="btn-icon" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" aria-label="Bagikan ke Facebook">${icon('facebook')}</a>
      <button class="btn-icon" type="button" data-copy="${esc(url)}" aria-label="Salin tautan">${icon('copy')}</button>`;
  }
  function onHash() {
    const m = location.hash.match(/^#berita\/(.+)$/);
    if (m) openBerita(decodeURIComponent(m[1]));
  }

  function bindEvents() {
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-video],[data-allvideo],[data-tour],[data-lightbox],[data-open],[data-gal],[data-cat],[data-copy],.modal-close,.dd > button,#menu a');
      if (!t) { if (e.target === modal()) closeModal(); if (!e.target.closest('#sharePop,#shareBtn')) $('#sharePop').hidden = true; if (!e.target.closest('.dd')) closeDropdowns(); return; }
      if (t.matches('.modal-close')) return closeModal();
      if (t.matches('.dd > button')) { const li = t.parentElement, open_ = !li.classList.contains('open'); closeDropdowns(); li.classList.toggle('open', open_); t.setAttribute('aria-expanded', open_); return; }
      if (t.matches('#menu a')) { closeDropdowns(); toggleMenu(false); return; }
      if (t.dataset.video) { const v = (C.Video || []).find(x => x.id === t.dataset.video); if (v) playVideo(v); return; }
      if (t.hasAttribute('data-allvideo')) return allVideos();
      if (t.hasAttribute('data-tour')) return openTour();
      if (t.dataset.lightbox) return openLightbox(t.dataset.lightbox);
      if (t.dataset.open) { const [k, id] = t.dataset.open.split(':'); if (k === 'program') openProgram(id); return; }
      if (t.dataset.gal) { state.galTab = t.dataset.gal; Render.galeri(); Core.wireImages(R('galeri')); return; }
      if (t.dataset.cat) { state.beritaCat = t.dataset.cat; Render.berita(); Core.wireImages(R('berita')); return; }
      if (t.dataset.copy) { copyText(t.dataset.copy); return; }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); closeDropdowns(); toggleMenu(false); $('#sharePop').hidden = true; }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-lightbox],[data-open]')) { e.preventDefault(); e.target.click(); }
    });
    addEventListener('hashchange', onHash);
    $('#themeBtn').onclick = Core.toggleTheme;
    $('#menuBtn').onclick = () => toggleMenu();
    $('#toTop').onclick = () => scrollTo({ top: 0, behavior: Core.LOW_MOTION ? 'auto' : 'smooth' });
    $('#shareBtn').onclick = async () => {
      const url = location.origin + location.pathname;
      if (navigator.share) { try { await navigator.share({ title: document.title, url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
      const pop = $('#sharePop'); pop.innerHTML = '<b>Bagikan halaman</b><div>' + shareLinks(url, document.title) + '</div>'; pop.hidden = !pop.hidden;
    };
    // Navbar: berubah solid saat digulir + tombol kembali ke atas
    const hdr = $('#top'), top = $('#toTop');
    const onScroll = () => { const y = scrollY; hdr.classList.toggle('solid', y > 40); top.classList.toggle('show', y > 900); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    // Penanda menu aktif
    if ('IntersectionObserver' in window) {
      const navObs = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { $$('#menu a[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === e.target.id)); } }), { rootMargin: '-45% 0px -50% 0px' });
      ['beranda', 'berita', 'kontak'].forEach(id => { const el = document.getElementById(id); if (el) navObs.observe(el); });
    }
    $('#contactForm').addEventListener('submit', submitPesan);
  }
  function closeDropdowns() { $$('.dd.open').forEach(li => { li.classList.remove('open'); $('button', li).setAttribute('aria-expanded', 'false'); }); }
  function toggleMenu(force) {
    const open_ = force !== undefined ? force : !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open_);
    $('#menuBtn').setAttribute('aria-expanded', open_);
    $('#menuBtn').innerHTML = icon(open_ ? 'x' : 'menu');
  }
  function copyText(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Tautan disalin.', 'ok')).catch(() => prompt('Salin tautan ini:', t)); }

  // ============================================================
  // FORMULIR KONTAK (dengan antrean offline — aman diulang karena reqId)
  // ============================================================
  async function submitPesan(e) {
    e.preventDefault();
    const f = e.target, msg = $('.form-msg', f), btn = $('button[type="submit"]', f);
    const d = Object.fromEntries(new FormData(f).entries());
    $$('.field', f).forEach(x => x.classList.remove('err'));
    const bad = [];
    if (!d.nama.trim()) bad.push('nama');
    if (!d.isi.trim()) bad.push('isi');
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) bad.push('email');
    if (!d.email.trim() && !d.whatsapp.trim()) bad.push('email', 'whatsapp');
    if (bad.length) {
      bad.forEach(n => { const el = f.elements[n]; if (el) el.closest('.field').classList.add('err'); });
      msg.className = 'form-msg error'; msg.textContent = bad.includes('whatsapp') && !bad.includes('nama') ? 'Isi email atau nomor WhatsApp agar kami bisa membalas.' : 'Mohon lengkapi kolom yang ditandai.';
      return;
    }
    const reqId = Core.uuid();
    btn.disabled = true; btn.innerHTML = icon('refresh', 'spin') + ' Mengirim…';
    msg.className = 'form-msg'; msg.textContent = '';
    const res = await Core.api('kirimPesan', d, { reqId });
    btn.disabled = false; btn.innerHTML = icon('send') + ' Kirim Pesan Sekarang';
    if (res.success) { f.reset(); msg.className = 'form-msg ok'; msg.textContent = res.data.message; return; }
    if (res.network || res.offline) {
      const q = Store.get('outbox', []); q.push({ d, reqId }); Store.set('outbox', q);
      f.reset(); msg.className = 'form-msg ok';
      msg.textContent = res.offline ? 'Pesan tersimpan di perangkat. (Server belum terhubung.)' : 'Koneksi sedang terputus. Pesan disimpan dan akan terkirim otomatis saat koneksi kembali.';
      return;
    }
    msg.className = 'form-msg error'; msg.textContent = res.message || 'Gagal mengirim pesan.';
  }
  async function flushOutbox() {
    const q = Store.get('outbox', []); if (!q.length || !Core.GAS_URL) return;
    const left = [];
    for (const it of q) { const r = await Core.api('kirimPesan', it.d, { reqId: it.reqId, tries: 1 }); if (!r.success && (r.network || r.retryable)) left.push(it); }
    Store.set('outbox', left);
    if (left.length < q.length) toast('Pesan yang tertunda berhasil terkirim.', 'ok');
  }

  // ============================================================
  // DATA — SWR + pencatatan pengunjung
  // ============================================================
  async function refresh(force) {
    const res = await Core.swr('site', () => Core.apiGet('site'), (data, fromCache) => {
      if (fromCache) return;                         // cache sudah dirender saat boot
      C = Object.assign({}, window.DEFAULT_CONTENT, data.content);
      if (data.stats) { STATS = data.stats; Store.set('stats', STATS); }
      renderAll(true);
    }, { fresh: force ? 0 : 60000 });
    if (res.success && res.data && res.data.stats && res.cached !== true) { STATS = res.data.stats; Store.set('stats', STATS); renderFootBottom(); }
  }
  async function recordVisit() {
    const k = 'hit:' + Core.today();
    if (Store.get(k) || !Core.GAS_URL) return;
    const r = await Core.api('hit', {}, { tries: 2 });
    if (r.success) { Store.set(k, 1); STATS = r.data.stats; Store.set('stats', STATS); renderFootBottom(); hydrateIcons(R('footBottom')); }
  }

  // ============================================================
  // BOOT
  // ============================================================
  function boot() {
    Core.applyTheme(document.documentElement.dataset.theme || 'light');
    const cached = Store.get('c:site', null);
    C = Object.assign({}, window.DEFAULT_CONTENT, cached && cached.data ? cached.data.content : {});
    renderAll(false);                                 // render pertama: instan dari perangkat
    bindEvents();
    setupParallax();
    requestAnimationFrame(() => document.documentElement.classList.add('ready'));
    onHash();
    Core.warmUp();
    refresh(false);
    idle(() => { recordVisit(); flushOutbox(); }, 1200);
    addEventListener('online', flushOutbox);
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 120000) { Core.warmUp(); refresh(false); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
