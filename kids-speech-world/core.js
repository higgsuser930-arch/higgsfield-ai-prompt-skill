'use strict';
/* Сөйлеу әлемі — ядро: көмекшілер, сақтау, дыбыс, дауыс, микрофон, камера, диалогтар */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') {
      if (typeof v === 'string') e.setAttribute('style', v);
      else for (const [sk, sv] of Object.entries(v)) (sk.startsWith('--') ? e.style.setProperty(sk, sv) : (e.style[sk] = sv));
    } else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return e;
}
const btn = (label, cls, onclick, extra) => h('button', Object.assign({ type: 'button', class: 'btn ' + (cls || ''), onclick }, extra || {}), label);

/* ---------- сақтау (localStorage қол жетпесе де жұмыс істейді) ---------- */
const STORE_KEY = 'soileu-alemi-v1';
const DEFAULTS = () => ({ stars: {}, points: 0, stats: {}, settings: { music: true, voice: true, rate: 0.85, scale: 1, hc: false, reduce: false, sens: 1, paceMs: 900 } });
let S = DEFAULTS();
try {
  const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  if (raw && typeof raw === 'object') {
    const d = DEFAULTS();
    S = { stars: raw.stars || {}, points: +raw.points || 0, stats: raw.stats || {}, settings: Object.assign(d.settings, raw.settings || {}) };
  }
} catch (e) { /* сақтау қол жетімсіз — жад ішінде жұмыс істейді */ }
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
const gstat = (id) => (S.stats[id] = S.stats[id] || { attempts: 0, mistakes: 0, points: 0 });
const starsOf = (id) => S.stars[id] || [false, false, false];
const unlocked = (id, l) => l === 1 || !!starsOf(id)[l - 2];
const totalStars = () => Object.values(S.stars).reduce((n, a) => n + a.filter(Boolean).length, 0);

function applySettings() {
  const r = document.documentElement;
  r.style.setProperty('--scale', S.settings.scale);
  r.classList.toggle('hc', !!S.settings.hc);
  r.classList.toggle('reduce', !!S.settings.reduce);
}
const reducedMotion = () => S.settings.reduce || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- хабарландыру (скринридер) ---------- */
function announce(msg) {
  const l = $('#live'); if (!l) return;
  l.textContent = '';
  setTimeout(() => { l.textContent = msg; }, 60);
}

/* ---------- Дыбыс: музыка және әсерлер (Web Audio, файлсыз) ---------- */
const MOODS = {
  calm: { root: 60, scale: [0, 2, 4, 7, 9], step: 1.1, wave: 'sine' },
  play: { root: 62, scale: [0, 2, 4, 7, 9, 12], step: 0.55, wave: 'triangle' },
  story: { root: 57, scale: [0, 3, 5, 7, 10], step: 1.0, wave: 'sine' },
  sleuth: { root: 59, scale: [0, 3, 5, 6, 7, 10], step: 0.85, wave: 'triangle' }
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const Snd = {
  ctx: null, music: null, sfx: null, timer: null, mood: 'calm', ducked: false, beat: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    try {
      this.ctx = new C();
      this.music = this.ctx.createGain(); this.sfx = this.ctx.createGain();
      this.music.gain.value = 0; this.sfx.gain.value = 0.9;
      this.music.connect(this.ctx.destination); this.sfx.connect(this.ctx.destination);
      this.applyMusic();
    } catch (e) { this.ctx = null; }
  },
  applyMusic() {
    if (!this.ctx) return;
    const on = S.settings.music;
    this.music.gain.setTargetAtTime(on ? (this.ducked ? 0.12 : 0.4) : 0, this.ctx.currentTime, 0.25);
    if (on) this.start(this.mood); else this.stop();
  },
  duck(on) { this.ducked = on; this.applyMusic(); },
  note(freq, t, dur, type, gain, dest) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.music); o.start(t); o.stop(t + dur + 0.05);
  },
  start(mood) {
    if (mood) this.mood = mood;
    if (!this.ctx || !S.settings.music || this.timer) return;
    const tick = () => {
      this.timer = null;
      if (!S.settings.music || !this.ctx || document.hidden) { if (S.settings.music && this.ctx) this.timer = setTimeout(tick, 800); return; }
      const m = MOODS[this.mood] || MOODS.calm, t = this.ctx.currentTime + 0.05;
      const n = m.scale[Math.floor(Math.random() * m.scale.length)] + (Math.random() < 0.35 ? 12 : 0);
      this.note(mtof(m.root + n + 12), t, 1.8, m.wave, 0.16);
      if (this.beat % 4 === 0) [0, 4, 7].forEach((i) => this.note(mtof(m.root + i), t, 3.2, 'sine', 0.09));
      this.beat++; this.timer = setTimeout(tick, m.step * 1000);
    };
    tick();
  },
  stop() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } },
  setMood(m) { if (this.mood === m) return; this.mood = m; },
  play(name, force) {
    if (!this.ctx || (!S.settings.music && !force)) return;
    const c = this.ctx, t = c.currentTime + 0.02, d = this.sfx;
    const seq = (notes, step, type, g, dur) => notes.forEach((n, i) => this.note(mtof(n), t + i * step, dur || 0.5, type || 'triangle', g || 0.3, d));
    switch (name) {
      case 'tap': seq([84], 0, 'sine', 0.18, 0.12); break;
      case 'ok': seq([72, 76, 79], 0.09); break;
      case 'no': seq([62, 58], 0.14, 'sine', 0.25, 0.4); break;
      case 'star': seq([84, 88, 91, 96], 0.1, 'sine', 0.3, 0.7); break;
      case 'win': seq([67, 72, 76, 79, 84, 79, 84, 88, 91, 96], 0.28, 'triangle', 0.3, 0.9); break;
      case 'bell': this.note(880, t, 1.4, 'sine', 0.4, d); this.note(1320, t, 1.1, 'sine', 0.25, d); this.note(1760, t, 0.8, 'sine', 0.12, d); break;
      case 'cat': this.sweep(t, [520, 880, 620, 420], 0.7, 'sawtooth', 1400); break;
      case 'dog': this.sweep(t, [260, 150], 0.18, 'sawtooth', 700); this.sweep(t + 0.3, [260, 140], 0.2, 'sawtooth', 700); break;
      case 'bird': [0, 0.22, 0.44].forEach((o) => this.sweep(t + o, [2400, 3400, 2600], 0.16, 'sine', 5000, 0.2)); break;
      case 'drum': this.sweep(t, [180, 60], 0.35, 'sine', 600, 0.6); break;
      case 'knock': this.sweep(t, [200, 90], 0.12, 'sine', 600, 0.6); this.sweep(t + 0.25, [200, 90], 0.12, 'sine', 600, 0.6); break;
    }
  },
  sweep(t, freqs, dur, type, cutoff, gain) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = type; f.type = 'lowpass'; f.frequency.value = cutoff;
    freqs.forEach((fr, i) => o.frequency.linearRampToValueAtTime(fr, t + (dur * i) / Math.max(1, freqs.length - 1)));
    o.frequency.setValueAtTime(freqs[0], t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || 0.35, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(f); f.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + dur + 0.1);
  }
};

/* ---------- Дауыс: кейіпкер сөйлейді (speechSynthesis) ---------- */
const Say = {
  voices: [], info: { kk: false, any: false },
  load() {
    if (!('speechSynthesis' in window)) return;
    this.voices = speechSynthesis.getVoices() || [];
    this.info = { kk: this.voices.some((v) => /^kk/i.test(v.lang)), any: this.voices.length > 0 };
  },
  pickVoice() {
    return this.voices.find((v) => /^kk/i.test(v.lang)) || this.voices.find((v) => /^ru/i.test(v.lang)) || null;
  },
  get available() { return 'speechSynthesis' in window && S.settings.voice && this.voices.length > 0; },
  cancel() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ } },
  /* true — дауыстап айтылды; false — дауыс жоқ/өшірулі */
  speak(text, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      if (!this.available) return resolve(false);
      this.cancel();
      const u = new SpeechSynthesisUtterance(text), v = this.pickVoice();
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'kk-KZ';
      u.rate = opts.rate || S.settings.rate; u.pitch = 1.1; u.volume = 1;
      let done = false;
      const fin = (r) => { if (!done) { done = true; Snd.duck(false); resolve(r); } };
      u.onend = () => fin(true); u.onerror = () => fin(false);
      if (opts.onBoundary) u.onboundary = (e) => { if (e.name === 'word' || e.charIndex !== undefined) opts.onBoundary(e.charIndex); };
      Snd.duck(true);
      try { speechSynthesis.speak(u); } catch (e) { return fin(false); }
      setTimeout(() => fin(false), 4000 + text.length * 160);
    });
  }
};
if ('speechSynthesis' in window) { Say.load(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', () => Say.load()); }

/* ---------- Микрофон және камера ---------- */
const Media = {
  micStream: null, camStream: null, micNode: null, analyser: null, buf: null, listeners: new Set(),
  onChange() { this.listeners.forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); },
  get micOn() { return !!(this.micStream && this.micStream.active); },
  get camOn() { return !!(this.camStream && this.camStream.active); },
  errMsg(e) {
    const n = e && e.name;
    if (n === 'insecure') return 'Микрофон мен камера тек қауіпсіз (https) бетте немесе localhost-та жұмыс істейді.';
    if (n === 'unsupported') return 'Бұл браузер микрофон мен камераны қолдамайды. Chrome, Edge, Safari немесе Firefox қолданып көр.';
    if (n === 'NotAllowedError' || n === 'SecurityError') return 'Рұқсат берілмеді. Браузердің мекенжай жолындағы құлып белгісі арқылы рұқсат беріп көр.';
    if (n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError') return 'Құрылғы табылмады. Микрофонды немесе камераны қосып, қайта байқа.';
    if (n === 'NotReadableError' || n === 'AbortError') return 'Құрылғыны басқа қолданба пайдаланып тұр. Оны жауып, қайта байқа.';
    return 'Құрылғыны қосу мүмкін болмады. Ойынды құрылғысыз да жалғастыра аласың.';
  },
  async gum(constraints) {
    if (!window.isSecureContext) throw Object.assign(new Error('insecure'), { name: 'insecure' });
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('unsupported'), { name: 'unsupported' });
    return navigator.mediaDevices.getUserMedia(constraints);
  },
  async enableMic() {
    if (this.micOn) return { ok: true };
    Snd.init();
    try {
      const s = await this.gum({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      this.micStream = s;
      const ctx = Snd.ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      this.actx = ctx;
      this.micNode = ctx.createMediaStreamSource(s);
      this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 1024;
      this.buf = new Float32Array(this.analyser.fftSize);
      this.micNode.connect(this.analyser); /* динамикке қосылмайды — жаңғырық болмайды */
      s.getTracks().forEach((t) => t.addEventListener('ended', () => { this.disableMic(); }));
      this.onChange(); return { ok: true };
    } catch (e) { this.onChange(); return { ok: false, msg: this.errMsg(e), name: e && e.name }; }
  },
  disableMic() {
    if (this.micStream) this.micStream.getTracks().forEach((t) => t.stop());
    try { if (this.micNode) this.micNode.disconnect(); } catch (e) { /* ignore */ }
    this.micStream = null; this.micNode = null; this.analyser = null; this.onChange();
  },
  async enableCam() {
    if (this.camOn) return { ok: true };
    try {
      const s = await this.gum({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      this.camStream = s;
      const v = $('#cam'); v.srcObject = s; v.muted = true; await v.play().catch(() => {});
      $('#camwrap').hidden = false;
      s.getTracks().forEach((t) => t.addEventListener('ended', () => { this.disableCam(); }));
      this.onChange(); return { ok: true };
    } catch (e) { this.onChange(); return { ok: false, msg: this.errMsg(e), name: e && e.name }; }
  },
  disableCam() {
    if (this.camStream) this.camStream.getTracks().forEach((t) => t.stop());
    this.camStream = null; const v = $('#cam'); if (v) v.srcObject = null;
    const w = $('#camwrap'); if (w) w.hidden = true; this.onChange();
  },
  stopAll() { this.disableMic(); this.disableCam(); },
  rms() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.buf);
    let s = 0; for (let i = 0; i < this.buf.length; i++) s += this.buf[i] * this.buf[i];
    return Math.sqrt(s / this.buf.length);
  },
  /* Дыбыс белсенділігін бақылау. onFrame({rms, active, level, calibrating, t}) */
  monitor(onFrame, opts) {
    opts = opts || {};
    const start = performance.now(); let floor = 0, n = 0, th = 0.02, alive = true;
    const iv = setInterval(() => {
      if (!alive) return;
      const t = performance.now() - start, r = this.rms(), cal = t < 350;
      if (cal) { floor += r; n++; if (t + 40 >= 350) { floor = n ? floor / n : 0; th = Math.max(0.012, Math.min(0.08, floor * 2.4)) / clamp(S.settings.sens, 0.4, 3); } }
      const active = !cal && r > th;
      onFrame({ rms: r, active, level: clamp(r / (th * 2.5), 0, 1), calibrating: cal, t });
    }, 40);
    return { stop() { alive = false; clearInterval(iv); } };
  },
  /* Сөйлеуді тыңдау: ең болмағанда minVoiceMs дауыс және endSilenceMs үнсіздік немесе maxMs */
  listen(o) {
    const opts = Object.assign({ maxMs: 20000, minVoiceMs: 280, endSilenceMs: 1200, record: true }, o || {});
    let voiced = 0, onset = null, last = null, ended = false, resolveFn, rec = null, chunks = [], prev = performance.now();
    const done = new Promise((r) => { resolveFn = r; });
    const finish = (aborted) => {
      if (ended) return; ended = true; mon.stop();
      const result = { voicedMs: voiced, spanMs: onset != null && last != null ? last - onset : 0, aborted: !!aborted, url: null };
      if (rec && rec.state !== 'inactive') {
        rec.onstop = () => { try { if (chunks.length) result.url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); } catch (e) { /* ignore */ } resolveFn(result); };
        try { rec.stop(); } catch (e) { resolveFn(result); }
      } else resolveFn(result);
    };
    const mon = this.monitor((f) => {
      const now = performance.now(), dt = now - prev; prev = now;
      if (opts.onFrame) opts.onFrame(f);
      if (f.calibrating) return;
      if (f.active) { voiced += dt; if (onset == null) { onset = f.t; if (opts.onVoiceStart) opts.onVoiceStart(); } last = f.t; if (opts.stopAtVoicedMs && voiced >= opts.stopAtVoicedMs) finish(false); }
      else if (onset != null && voiced >= opts.minVoiceMs && f.t - last > opts.endSilenceMs) finish(false);
      if (f.t > opts.maxMs) finish(false);
    });
    if (opts.record && this.micStream && window.MediaRecorder) {
      try { rec = new MediaRecorder(this.micStream); rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); }; rec.start(); } catch (e) { rec = null; }
    }
    return { stop: () => finish(true), done };
  }
};
window.addEventListener('pagehide', () => Media.stopAll());

/* ---------- Диалог (<dialog>) ---------- */
let dlgOpener = null;
function openDlg(title, body, opts) {
  const d = $('#dlg'); dlgOpener = document.activeElement;
  d.replaceChildren(
    h('div', { class: 'dlg-in' },
      h('h2', { id: 'dlg-title' }, title), body,
      h('div', { class: 'dlg-foot' }, btn('Жабу', 'btn-sun', () => d.close(), { id: 'dlg-close' }))));
  d.setAttribute('aria-labelledby', 'dlg-title'); d.classList.toggle('wide', !!(opts && opts.wide));
  if (!d.open) d.showModal();
  setTimeout(() => { const c = $('#dlg-close'); if (c) c.focus(); }, 30);
  d.onclose = () => { if (opts && opts.onclose) opts.onclose(); if (dlgOpener && document.contains(dlgOpener)) dlgOpener.focus(); };
}

/* Құрылғылар панелі (микрофон / камера) */
function devicePanel() {
  const root = h('div', { class: 'devices' });
  const msg = h('p', { class: 'dev-msg', role: 'status' });
  const row = (icon, name, isOn, enable, disable, key) => {
    const state = h('span', { class: 'chip ' + (isOn() ? 'chip-on' : '') }, isOn() ? 'Қосулы' : 'Өшірулі');
    const b = btn(isOn() ? name + ' өшіру' : name + ' қосу', isOn() ? 'btn-white' : 'btn-mint', async () => {
      if (isOn()) { disable(); msg.textContent = ''; return; }
      b.disabled = true; msg.textContent = 'Рұқсат күтіп тұрмын…';
      const r = await enable(); msg.textContent = r.ok ? '' : r.msg; b.disabled = false;
    }, { 'data-dev': key });
    return h('div', { class: 'dev-row' }, h('span', { class: 'dev-ico', 'aria-hidden': 'true' }, icon), h('div', { class: 'dev-txt' }, h('strong', {}, name), state), b);
  };
  const render = () => root.replaceChildren(
    row('🎤', 'Микрофон', () => Media.micOn, () => Media.enableMic(), () => Media.disableMic(), 'mic'),
    row('📷', 'Камера', () => Media.camOn, () => Media.enableCam(), () => Media.disableCam(), 'cam'),
    msg,
    h('p', { class: 'privacy' }, '🔒 Дыбыс пен бейне тек осы құрылғыда өңделеді. Ештеңе интернетке жіберілмейді және сақталмайды. Камера тек өзіңді көру үшін.'),
    h('p', { class: 'privacy' }, 'Микрофон дауыстың бар-жоғын және қарқынын ғана байқайды. Сөздің дұрыстығын логопед немесе ересек тексереді. Құрылғысыз да ойнауға болады.')
  );
  render(); const f = () => { if (root.isConnected) { const m = msg.textContent; render(); msg.textContent = m; } }; Media.listeners.add(f);
  return root;
}

/* Қолжетімділік параметрлері */
function accessPanel() {
  const root = h('div', { class: 'access' });
  const sw = (label, key, after) => {
    const b = h('button', { type: 'button', class: 'btn btn-white switch', role: 'switch', 'aria-checked': String(!!S.settings[key]) }, label, h('span', { class: 'sw-state' }, S.settings[key] ? 'Қосулы' : 'Өшірулі'));
    b.addEventListener('click', () => { S.settings[key] = !S.settings[key]; b.setAttribute('aria-checked', String(S.settings[key])); b.lastChild.textContent = S.settings[key] ? 'Қосулы' : 'Өшірулі'; save(); applySettings(); if (after) after(); });
    return b;
  };
  const sizes = [[1, 'Қалыпты'], [1.2, 'Үлкен'], [1.4, 'Өте үлкен']];
  const sizeRow = h('div', { class: 'seg', role: 'group', 'aria-label': 'Мәтін өлшемі' });
  const paint = () => $$('button', sizeRow).forEach((b, i) => b.setAttribute('aria-pressed', String(sizes[i][0] === S.settings.scale)));
  sizes.forEach(([v, t]) => sizeRow.append(btn(t, 'btn-white', () => { S.settings.scale = v; save(); applySettings(); paint(); })));
  paint();
  const rate = h('input', { type: 'range', id: 'rate', min: '0.6', max: '1', step: '0.05', value: String(S.settings.rate) });
  rate.addEventListener('input', () => { S.settings.rate = +rate.value; save(); });
  root.append(
    h('div', { class: 'field' }, h('span', { class: 'lab' }, 'Мәтін өлшемі'), sizeRow),
    sw('Жоғары контраст', 'hc'), sw('Қозғалысты азайту', 'reduce'),
    sw('Кейіпкер дауысы (дауыстап оқу)', 'voice'),
    h('div', { class: 'field' }, h('label', { for: 'rate', class: 'lab' }, 'Кейіпкердің сөйлеу жылдамдығы (баяу — жылдам)'), rate),
    btn('🔈 Дауысты тексеру', 'btn-mint', () => Say.speak('Сәлем, досым! Мен баяу және анық сөйлеймін.')),
    h('p', { class: 'privacy' }, Say.available ? (Say.info.kk ? 'Қазақ тіліндегі дауыс табылды.' : 'Қазақ дауысы табылмады, сондықтан орыс дауысы қолданылады. Сөздердің айтылуы дәл болмауы мүмкін. Қажет болса, кейіпкер дауысын өшір: мәтін экранда қала береді.') : 'Бұл құрылғыда дауыстап оқу қолжетімсіз. Барлық мәтін экранда көрінеді.')
  );
  return root;
}
