/* ============================================================
   CORE — dipakai halaman publik & panel admin
   Pola gas-instant-ux-pro: Store berversi, SWR + TTL kesegaran,
   api() dengan timeout/retry/reqId, Perf, warm-up server.
   ============================================================ */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const GAS_URL = String(CFG.GAS_URL || '').trim();
  const LS_PREFIX = 'trg:v1:';                 // naikkan versi bila bentuk data berubah

  // ---------- Penyimpanan lokal (aman bila diblokir browser) ----------
  const Store = {
    get(k, d) { try { const v = localStorage.getItem(LS_PREFIX + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) {
      const s = JSON.stringify(v);
      try { localStorage.setItem(LS_PREFIX + k, s); }
      catch (e) {                               // kuota penuh → buang cache lama, coba sekali lagi
        try { Object.keys(localStorage).filter(x => x.indexOf(LS_PREFIX + 'c:') === 0).forEach(x => localStorage.removeItem(x)); localStorage.setItem(LS_PREFIX + k, s); } catch (e2) { }
      }
    },
    del(k) { try { localStorage.removeItem(LS_PREFIX + k); } catch (e) { } }
  };
  function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; }

  // ---------- Pengukur performa (ketik Perf.table() di console) ----------
  const Perf = {
    rows: [],
    add(action, total, server) { this.rows.push({ action, total, server: server ?? null, net: server != null ? total - server : null, at: new Date().toLocaleTimeString() }); if (this.rows.length > 200) this.rows.shift(); },
    table() { console.table(this.rows.slice(-30)); }
  };

  // ---------- API ke GAS ----------
  const READ_ACTIONS = /^(site|adminBoot|batch|logs|listBackups|exportJson|login)$/;
  function uuid() { return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)); }

  async function apiOnce(action, data, timeout, reqId, token) {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), timeout), t0 = performance.now();
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST', redirect: 'follow', cache: 'no-store', signal: ctrl.signal,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // WAJIB text/plain: hindari CORS preflight
        body: JSON.stringify({ action, token: token || '', reqId, data: data || {} })
      });
      const text = await res.text();
      try { const j = JSON.parse(text); Perf.add(action, Math.round(performance.now() - t0), j.ms); return j; }
      catch (e) { return { success: false, network: true, retryable: res.status >= 500 || res.status === 429, message: 'Server membalas HTTP ' + res.status + ' (bukan JSON). Periksa GAS_URL & izin deploy "Anyone".' }; }
    } catch (err) {
      return { success: false, network: true, retryable: true, message: err.name === 'AbortError' ? 'Server terlalu lama merespons.' : 'Koneksi terputus.' };
    } finally { clearTimeout(timer); }
  }

  async function api(action, data, opt) {
    opt = opt || {};
    if (!GAS_URL) return { success: false, offline: true, message: 'GAS_URL belum diisi di js/config.js.' };
    const isRead = READ_ACTIONS.test(action);
    const reqId = isRead ? '' : (opt.reqId || uuid());
    const tries = opt.tries || (isRead ? 3 : 2);         // tulis aman diulang karena membawa reqId
    let res;
    for (let i = 0; i < tries; i++) {
      if (i) { await sleep(1200 * i); if (navigator.onLine === false) await waitOnline(15000); }
      res = await apiOnce(action, data, opt.timeout || (isRead ? (i ? 40000 : 25000) : 90000), reqId, opt.token !== undefined ? opt.token : (window.App && App.token));
      if (res.success || !res.retryable) break;
    }
    if (!res.success && res.data && res.data.code === 'AUTH' && window.App && App.onAuthExpired) App.onAuthExpired();
    return res;
  }

  async function apiGet(action) {
    if (!GAS_URL) return { success: false, offline: true, message: 'GAS_URL belum diisi.' };
    for (let i = 0; i < 3; i++) {
      const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), i ? 40000 : 25000), t0 = performance.now();
      try {
        const res = await fetch(GAS_URL + '?action=' + encodeURIComponent(action) + '&t=' + Date.now(), { redirect: 'follow', cache: 'no-store', signal: ctrl.signal });
        const j = JSON.parse(await res.text());
        Perf.add('GET ' + action, Math.round(performance.now() - t0), j.ms);
        return j;
      } catch (e) { if (i < 2) await sleep(1200 * (i + 1)); }
      finally { clearTimeout(timer); }
    }
    return { success: false, network: true, message: 'Gagal memuat data terbaru.' };
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  function waitOnline(ms) { return new Promise(r => { if (navigator.onLine !== false) return r(); const t = setTimeout(done, ms); function done() { clearTimeout(t); removeEventListener('online', done); r(); } addEventListener('online', done); }); }
  function warmUp() { if (GAS_URL) fetch(GAS_URL + '?ping=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).catch(() => { }); }

  /** SWR: render dari cache seketika, segarkan di latar bila sudah lewat TTL. render() hanya dipanggil bila data berubah. */
  async function swr(key, fetcher, render, opt) {
    opt = opt || {};
    const fresh = opt.fresh ?? 60000;
    const c = Store.get('c:' + key, null);
    if (c) render(c.data, true);
    if (c && !opt.force && Date.now() - c.t < fresh) return { success: true, data: c.data, cached: true };
    const res = await fetcher();
    if (res.success) {
      const h = hashStr(JSON.stringify(res.data));
      Store.set('c:' + key, { t: Date.now(), h, data: res.data });
      if (!c || c.h !== h) render(res.data, false);
    } else if (!c && opt.onError) opt.onError(res);
    return res;
  }

  // ---------- Tema terang / malam (tersimpan di perangkat) ----------
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === 'dark' ? '#061A2B' : '#004B87';
    document.querySelectorAll('[data-theme-icon]').forEach(el => { el.innerHTML = icon(t === 'dark' ? 'sun' : 'moon'); });
  }
  function toggleTheme() { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; Store.set('theme', t); applyTheme(t); document.dispatchEvent(new CustomEvent('themechange')); }

  // ---------- Helper tampilan ----------
  function icon(name, cls) {
    const b = (window.ICONS || {})[name] || '';
    return '<svg class="ic ' + ((window.ICONS_FILL || {})[name] ? 'fill ' : '') + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + b + '</svg>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function paras(s) { return String(s || '').split(/\n{2,}/).map(p => '<p>' + nl2br(p.trim()) + '</p>').join(''); }
  function lines(s) { return String(s || '').split('\n').map(x => x.trim()).filter(Boolean); }
  function pairs(s) { return lines(s).map(l => { const i = l.indexOf('|'); return i === -1 ? { a: l, b: '' } : { a: l.slice(0, i).trim(), b: l.slice(i + 1).trim() }; }); }
  const isDriveId = (v) => /^[A-Za-z0-9_-]{25,}$/.test(v);
  function imgUrl(v, w) {
    v = String(v || '').trim();
    if (!v) return '';
    const m = v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([A-Za-z0-9_-]{20,})/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w' + (w || 1000);
    if (isDriveId(v)) return 'https://drive.google.com/thumbnail?id=' + v + '&sz=w' + (w || 1000);
    return v;
  }
  function fileUrls(v) {
    v = String(v || '').trim();
    const m = v.match(/\/d\/([A-Za-z0-9_-]{20,})/) || v.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
    const id = m ? m[1] : (isDriveId(v) ? v : '');
    if (id) return { view: 'https://drive.google.com/file/d/' + id + '/view', download: 'https://drive.google.com/uc?export=download&id=' + id };
    return { view: v, download: v };
  }
  function ytId(u) { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; }
  function ytThumb(u) { const id = ytId(u); return id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : ''; }
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function fmtDate(s, short) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return esc(s || '');
    const b = BULAN[+m[2] - 1] || '';
    return (+m[3]) + ' ' + (short ? b.slice(0, 3) : b) + ' ' + m[1];
  }
  function fmtDateTime(s) { const m = String(s || '').match(/T(\d{2}):(\d{2})/); return fmtDate(s, true) + (m ? ' ' + m[1] + '.' + m[2] : ''); }
  function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function debounce(fn, ms) { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }

  function toast(msg, type, action) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = icon(type === 'error' ? 'alert' : 'check-circle') + '<span>' + esc(msg) + '</span>' + (action ? '<button type="button">' + esc(action.label) + '</button>' : '');
    if (action) el.querySelector('button').onclick = () => { el.remove(); action.fn(); };
    box.appendChild(el);
    setTimeout(() => el.remove(), action ? 7000 : 3800);
  }

  // Gambar: fade-in saat termuat, cadangan gradasi bila gagal
  function wireImages(root) {
    (root || document).querySelectorAll('img[data-fade]:not([data-wired])').forEach(img => {
      img.dataset.wired = '1';
      const done = () => img.classList.add('loaded');
      const fail = () => { img.alt = ''; img.removeAttribute('src'); img.classList.add('loaded', 'img-fb', 'img-err'); };
      if (img.complete) { img.naturalWidth ? done() : fail(); }
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', fail, { once: true }); }
    });
  }

  const LOW_MOTION = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ||
    (navigator.connection && navigator.connection.saveData) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 1);

  window.Core = { GAS_URL, Store, Perf, api, apiGet, swr, warmUp, hashStr, uuid, applyTheme, toggleTheme, icon, esc, nl2br, paras, lines, pairs, imgUrl, fileUrls, ytId, ytThumb, fmtDate, fmtDateTime, today, debounce, toast, wireImages, LOW_MOTION, BULAN, sleep };
  window.Perf = Perf;
})();
