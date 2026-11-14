'use strict';
/* Сөйлеу әлемі — экрандар, маршрутизатор, тапсырма жүргізушісі және ойын механикалары */

const main = () => $('#main');
const gameById = (id) => GAMES.find((g) => g.id === id);
const dirById = (id) => DIRS.find((d) => d.id === id);
const NAMES = { '🍎': ['алма', 'алманы'], '⚽': ['доп', 'допты'], '🏠': ['үй', 'үйді'], '🐱': ['мысық', 'мысықты'], '🌷': ['гүл', 'гүлді'], '☀️': ['күн', 'күнді'], '🐶': ['ит', 'итті'], '🥕': ['сәбіз', 'сәбізді'], '🌙': ['ай', 'айды'], '🚗': ['көлік', 'көлікті'], '📖': ['кітап', 'кітапты'], '🐦': ['құс', 'құсты'], '🍌': ['банан', 'бананды'], '🎈': ['шар', 'шарды'], '🦋': ['көбелек', 'көбелекті'], '🌳': ['ағаш', 'ағашты'], '🍉': ['қарбыз', 'қарбызды'], '🐟': ['балық', 'балықты'], '🐻': ['аю', 'аюды'], '🍅': ['қызанақ', 'қызанақты'], '🚲': ['велосипед', 'велосипедті'], '🎂': ['торт', 'тортты'], '🐢': ['тасбақа', 'тасбақаны'] };
const SC = { cleanups: [], token: 0, run: null };
let lastRun = null;

function go(hash) { if (location.hash === '#' + hash) route(); else location.hash = hash; }
function cleanupAll() { SC.token++; SC.cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); Say.cancel(); Snd.duck(false); }
const stars = (arr, big) => h('span', { class: 'stars' + (big ? ' big' : ''), role: 'img', 'aria-label': arr.filter(Boolean).length + ' жұлдыз, барлығы ' + arr.length }, arr.map((v) => h('span', { class: v ? 'on' : '', 'aria-hidden': 'true' }, v ? '★' : '☆')));

/* ---------- Кейіпкер ---------- */
function mainMascot() {
  const ns = 'http://www.w3.org/2000/svg';
  const wrap = h('div', { class: 'mascot-art' });
  wrap.innerHTML = '<svg viewBox="0 0 260 280" role="img" aria-label="Дос: күлімдеген көгілдір кейіпкер қол бұлғап тұр"><ellipse cx="130" cy="266" rx="76" ry="9" fill="rgba(31,42,68,.16)"/><g class="m-body"><ellipse cx="92" cy="250" rx="26" ry="12" fill="#ffb520" stroke="#1f2a44" stroke-width="5"/><ellipse cx="168" cy="250" rx="26" ry="12" fill="#ffb520" stroke="#1f2a44" stroke-width="5"/><line x1="130" y1="56" x2="130" y2="26" stroke="#1f2a44" stroke-width="6" stroke-linecap="round"/><circle cx="130" cy="20" r="12" fill="#ffd23f" stroke="#1f2a44" stroke-width="5"/><circle cx="130" cy="156" r="98" fill="#35c9b0" stroke="#1f2a44" stroke-width="6"/><ellipse cx="130" cy="192" rx="58" ry="50" fill="#bff5ea"/><path d="M40 170 Q16 190 36 214" fill="none" stroke="#1f2a44" stroke-width="24" stroke-linecap="round"/><path d="M40 170 Q16 190 36 214" fill="none" stroke="#35c9b0" stroke-width="14" stroke-linecap="round"/><circle cx="98" cy="132" r="19" fill="#fff" stroke="#1f2a44" stroke-width="5"/><circle cx="162" cy="132" r="19" fill="#fff" stroke="#1f2a44" stroke-width="5"/><circle cx="101" cy="135" r="9" fill="#1f2a44"/><circle cx="159" cy="135" r="9" fill="#1f2a44"/><circle cx="104" cy="131" r="3.5" fill="#fff"/><circle cx="162" cy="131" r="3.5" fill="#fff"/><circle cx="72" cy="168" r="11" fill="#ff8fa3" opacity=".85"/><circle cx="188" cy="168" r="11" fill="#ff8fa3" opacity=".85"/><path d="M100 166 Q130 204 160 166 Z" fill="#7a1f3d" stroke="#1f2a44" stroke-width="5" stroke-linejoin="round"/><path d="M114 184 Q130 196 146 184 Q130 176 114 184Z" fill="#ff8fa3"/><g class="m-wave"><path d="M212 150 Q246 134 244 92" fill="none" stroke="#1f2a44" stroke-width="24" stroke-linecap="round"/><path d="M212 150 Q246 134 244 92" fill="none" stroke="#35c9b0" stroke-width="14" stroke-linecap="round"/><circle cx="244" cy="86" r="12" fill="#35c9b0" stroke="#1f2a44" stroke-width="5"/></g></g></svg>';
  return wrap;
}
function mascotBadge(emoji, label) { return h('div', { class: 'badge-m', role: 'img', 'aria-label': 'Кейіпкер: ' + label }, h('span', { 'aria-hidden': 'true' }, emoji)); }
function clouds() { return h('div', { class: 'clouds', 'aria-hidden': 'true' }, h('i', { class: 'cl c1' }), h('i', { class: 'cl c2' }), h('i', { class: 'cl c3' })); }

/* ---------- Дыбыс ауыстырғышы ---------- */
function refreshSound() {
  $$('[data-sound]').forEach((b) => {
    const on = S.settings.music;
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Дыбыс қосулы. Өшіру' : 'Дыбыс өшірулі. Қосу');
    const t = b.querySelector('.t'); if (t) t.textContent = on ? 'Дыбыс қосулы' : 'Дыбыс өшірулі';
    const i = b.querySelector('.i'); if (i) i.textContent = on ? '🔊' : '🔇';
  });
}
function toggleSound() { Snd.init(); S.settings.music = !S.settings.music; save(); Snd.applyMusic(); refreshSound(); if (S.settings.music) Snd.play('ok'); announce(S.settings.music ? 'Дыбыс қосылды' : 'Дыбыс өшірілді'); }
const soundBtn = (cls, longLabel) => h('button', { type: 'button', class: 'btn ' + (cls || ''), 'data-sound': '', onclick: toggleSound }, h('span', { class: 'i', 'aria-hidden': 'true' }), longLabel ? h('span', { class: 't' }) : h('span', { class: 't sr-only' }));

/* ---------- Маршрутизатор ---------- */
const ROUTES = [[/^home$/, 'home'], [/^islands$/, 'islands'], [/^dir-(\d)$/, 'dir'], [/^game-(\d+)$/, 'gameIntro'], [/^play-(\d+)-(\d)$/, 'play'], [/^result-(\d+)-(\d)$/, 'result'], [/^done-(\d+)$/, 'done'], [/^therapist$/, 'therapist']];
const SCREENS = {};
function route() {
  cleanupAll();
  const hash = (location.hash || '#home').slice(1);
  let m = null, name = 'home';
  for (const [re, n] of ROUTES) { m = hash.match(re); if (m) { name = n; break; } }
  if (!m) name = 'home';
  const args = m ? m.slice(1).map(Number) : [];
  const root = main(); root.replaceChildren(); root.className = '';
  $('#camwrap') && ($('#camwrap').classList.toggle('in-play', name === 'play'));
  const r = SCREENS[name](...args);
  if (r === false) return;
  root.focus({ preventScroll: true }); window.scrollTo(0, 0);
  const h1 = $('h1', root); if (h1) document.title = h1.textContent + ' · Сөйлеу әлемі';
}
window.addEventListener('hashchange', route);

/* ============================ БАСТЫ БЕТ ============================ */
SCREENS.home = () => {
  Snd.setMood('calm'); Snd.applyMusic();
  const root = main(); root.className = 'screen home';
  const rules = () => openDlg('Ойын ережесі', h('div', { class: 'rules' },
    h('ol', {},
      h('li', {}, 'Бес арал бар. Әр аралда 5 ойын, әр ойында 3 деңгей.'),
      h('li', {}, 'Алдымен 1-деңгейді орында. Ол өтілмесе, 2-деңгей ашылмайды. 2-деңгейден кейін 3-деңгей ашылады.'),
      h('li', {}, 'Әр деңгейде тапсырманы оқы, «Бастау» батырмасын бас да, кейіпкер көрсеткендей орында.'),
      h('li', {}, 'Орындалған деңгей үшін жұлдызша аласың. Ұпай да жиналады.'),
      h('li', {}, 'Асықпа! Анық әрі әдемі сөйлеу — басты мақсат.'),
      h('li', {}, 'Микрофон мен камера міндетті емес. Оларды құрылғылар панелінен қоса аласың.'))), { wide: true });
  const intro = () => introAnim();
  root.append(clouds(),
    h('div', { class: 'wrap hero' },
      h('div', { class: 'hero-txt' },
        h('p', { class: 'eyebrow' }, 'Интерактивті логопедиялық ойындар әлемі'),
        h('h1', {}, 'Сөйлеу әлемі'),
        h('p', { class: 'sub' }, 'Тахилалияны түзетуге арналған интерактивті логопедиялық ойындар әлемі'),
        h('div', { class: 'bubble big' }, HOME_TEXT, btn('🔊 Тыңдау', 'btn-white small', () => Say.speak(HOME_TEXT))),
        h('div', { class: 'btn-grid' },
          btn('ОЙЫНДЫ БАСТАУ', 'btn-sun xl', () => { Snd.init(); Snd.play('ok'); go('islands'); }, { id: 'start-btn' }),
          btn('ОЙЫН ЕРЕЖЕСІ', 'btn-mint', rules),
          soundBtn('btn-grape', true),
          btn('ЛОГОПЕДКЕ АРНАЛҒАН БӨЛІМ', 'btn-white', () => go('therapist'))),
        h('div', { class: 'under' }, btn('▶ Таныстыру анимациясы (12 секунд)', 'btn-link', intro), btn('🎤 Микрофон / 📷 камера', 'btn-link', () => openDlg('Микрофон мен камера', devicePanel(), { wide: true }))))
      ,
      h('div', { class: 'hero-art' }, mainMascot(), h('div', { class: 'friends', 'aria-hidden': 'true' }, ['🐰', '🐻', '🦊', '🐼'].map((e, i) => h('span', { style: { '--d': i * 0.4 + 's' } }, e))))),
    h('div', { class: 'hills', 'aria-hidden': 'true' }));
  refreshSound();
};

function introAnim() {
  const slides = [['👋', 'Сәлем, досым!'], ['🌈', 'Сөйлеу әлеміне қош келдің!'], ['🏝️', 'Бес арал, жиырма бес ойын сені күтіп тұр.'], ['⭐', 'Асықпай, анық әрі әдемі сөйлейік!']];
  let i = 0, timer = null, playing = !reducedMotion();
  const box = h('div', { class: 'intro-slide', role: 'status', 'aria-live': 'polite' });
  const dots = h('div', { class: 'dots', 'aria-hidden': 'true' });
  const playBtn = btn(playing ? '⏸ Тоқтату' : '▶ Ойнату', 'btn-white', () => { playing = !playing; playBtn.textContent = playing ? '⏸ Тоқтату' : '▶ Ойнату'; if (playing) tick(); else clearTimeout(timer); });
  const next = btn('Келесі ▶', 'btn-white', () => { clearTimeout(timer); i = (i + 1) % slides.length; show(); });
  const show = () => { box.replaceChildren(h('div', { class: 'big-e', 'aria-hidden': 'true' }, slides[i][0]), h('p', {}, slides[i][1])); dots.replaceChildren(...slides.map((_, k) => h('i', { class: k === i ? 'on' : '' }))); };
  const tick = () => { clearTimeout(timer); if (!playing) return; timer = setTimeout(() => { if (i < slides.length - 1) { i++; show(); tick(); } else { playing = false; playBtn.textContent = '↻ Қайта көру'; } }, 3000); };
  playBtn.addEventListener('click', () => { if (playBtn.textContent.startsWith('↻')) { i = 0; show(); } });
  show(); tick();
  openDlg('Таныстыру', h('div', { class: 'intro' }, box, dots, h('div', { class: 'row' }, playBtn, next)), { onclose: () => clearTimeout(timer) });
}

/* ============================ АРАЛДАР ============================ */
SCREENS.islands = () => {
  Snd.setMood('calm'); Snd.applyMusic();
  const root = main(); root.className = 'screen islands';
  root.append(clouds(), h('div', { class: 'wrap' },
    h('div', { class: 'page-head' }, btn('← Басты бет', 'btn-white', () => go('home')), h('h1', {}, 'Ойын бағытын таңда'), h('p', { class: 'total' }, '⭐ ', totalStars() + ' / 75')),
    h('ul', { class: 'island-grid' }, DIRS.map((d) => {
      const gs = GAMES.filter((g) => g.dir === d.id), got = gs.reduce((n, g) => n + starsOf(g.id).filter(Boolean).length, 0);
      return h('li', {}, h('a', { class: 'island', href: '#dir-' + d.id, style: { '--c1': d.c1, '--c2': d.c2 }, 'aria-label': d.id + '. ' + d.name + '. Белгісі: ' + d.sub + '. 5 ойын. Жұлдыз: ' + got + ' / 15' },
        h('span', { class: 'isl-num' }, d.id), h('span', { class: 'isl-ico', 'aria-hidden': 'true' }, d.icon), h('span', { class: 'isl-name' }, d.name), h('span', { class: 'isl-count' }, '5 ойын'), h('span', { class: 'isl-prog', 'aria-hidden': 'true' }, '⭐ ' + got + '/15')));
    }))));
};

SCREENS.dir = (id) => {
  const d = dirById(id); if (!d) { go('islands'); return false; }
  Snd.setMood('calm'); Snd.applyMusic();
  const root = main(); root.className = 'screen dir'; root.style.setProperty('--c1', d.c1); root.style.setProperty('--c2', d.c2);
  root.append(clouds(), h('div', { class: 'wrap' },
    h('div', { class: 'page-head' }, btn('← Аралдар', 'btn-white', () => go('islands')), h('h1', {}, d.icon + ' ' + d.name), h('p', { class: 'total' }, d.sub)),
    h('ul', { class: 'game-list' }, GAMES.filter((g) => g.dir === id).map((g) => h('li', {}, h('a', { class: 'game-card', href: '#game-' + g.id, style: { '--b1': g.bg[0], '--b2': g.bg[1] }, 'aria-label': g.id + '-ойын. ' + g.title + '. Жұлдыз: ' + starsOf(g.id).filter(Boolean).length + ' / 3' },
      h('span', { class: 'gc-ico', 'aria-hidden': 'true' }, g.icon), h('span', { class: 'gc-txt' }, h('span', { class: 'gc-n' }, g.id + '-ойын'), h('strong', {}, g.title)), stars(starsOf(g.id))))))));
};

/* ============================ ОЙЫН ТАНЫСТЫРЫМЫ ============================ */
SCREENS.gameIntro = (id) => {
  const g = gameById(id); if (!g) { go('islands'); return false; }
  Snd.setMood(g.mood); Snd.applyMusic();
  const root = main(); root.className = 'screen intro-screen'; root.style.setProperty('--b1', g.bg[0]); root.style.setProperty('--b2', g.bg[1]);
  const st = starsOf(id), nextLevel = st.findIndex((v) => !v) + 1 || 1;
  const how = () => openDlg('Қалай орындау керек?', h('div', { class: 'rules' }, h('p', {}, g.how), g.note ? h('p', { class: 'note' }, '⚠️ ' + g.note) : null, g.levels[0].engine === 'breath' ? breathDemo() : null, btn('🔊 Тыңдау', 'btn-white', () => Say.speak(g.how))), { wide: true });
  root.append(clouds(), h('div', { class: 'wrap' },
    h('div', { class: 'page-head' }, btn('← Артқа', 'btn-white', () => go('dir-' + g.dir)), soundBtn('btn-grape small', true)),
    h('div', { class: 'intro-card' },
      mascotBadge(g.mascot, g.mascotName),
      h('div', { class: 'intro-txt' }, h('p', { class: 'eyebrow' }, g.id + '-ойын'), h('h1', {}, g.title),
        h('div', { class: 'bubble' }, g.intro, btn('🔊', 'btn-white small', () => Say.speak(g.intro), { 'aria-label': 'Кейіпкер сөзін тыңдау' })),
        g.note ? h('p', { class: 'note' }, '⚠️ ' + g.note) : null,
        h('div', { class: 'row' }, btn('Ойынды бастау', 'btn-sun xl', () => { Snd.init(); Snd.play('ok'); go('play-' + id + '-' + nextLevel); }, { id: 'start-btn' }), btn('Қалай орындау керек?', 'btn-mint', how)),
        h('div', { class: 'devline' }, h('span', { class: 'chip' }, '🎤 Микрофон: ' + ({ none: 'қолданылмайды', optional: 'қосымша', required: 'қажет' })[g.mic]), h('span', { class: 'chip' }, '📷 Камера: ' + ({ none: 'қолданылмайды', optional: 'қосымша' })[g.cam])))),
    h('h2', { class: 'lv-title' }, 'Деңгейлер'),
    h('ol', { class: 'levels' }, g.levels.map((lv, i) => {
      const ok = unlocked(id, i + 1), done = st[i];
      return h('li', {}, ok ? h('a', { class: 'lv' + (done ? ' done' : ''), href: '#play-' + id + '-' + (i + 1), 'aria-label': (i + 1) + '-деңгей. ' + lv.title + (done ? '. Орындалды' : '') }, lvInner(i, lv, done))
        : h('div', { class: 'lv locked', role: 'group', 'aria-label': (i + 1) + '-деңгей. ' + lv.title + '. Жабық. Алдымен ' + i + '-деңгейді орында' }, lvInner(i, lv, false, true)));
    }))));
  refreshSound();
};
function lvInner(i, lv, done, lock) { return [h('span', { class: 'lv-n' }, (i + 1) + '-деңгей'), h('strong', {}, lv.title), h('span', { class: 'lv-s', 'aria-hidden': 'true' }, lock ? '🔒' : done ? '★' : '☆')]; }

/* ============================ ТЫНЫС ДЕМО (бейне орнына анимация) ============================ */
function breathDemo() {
  return h('div', { class: 'demo', role: 'img', 'aria-label': 'Тыныс алу үлгісі: үлкейгенде мұрнымен дем аламыз, кішірейгенде ауызбен баяу шығарамыз' }, h('div', { class: 'demo-c' }), h('div', { class: 'demo-t' }, h('span', { class: 'a' }, 'Мұрнымен дем ал'), h('span', { class: 'b' }, 'Ауызбен баяу шығар')));
}

/* ============================ ТАПСЫРМА ЖҮРГІЗУШІСІ ============================ */
SCREENS.play = (gid, l) => {
  const g = gameById(gid), lv = g && g.levels[l - 1];
  if (!lv) { go('islands'); return false; }
  if (!unlocked(gid, l)) { go('game-' + gid); return false; }
  Snd.setMood(g.mood); Snd.applyMusic();
  const root = main(); root.className = 'screen play'; root.style.setProperty('--b1', g.bg[0]); root.style.setProperty('--b2', g.bg[1]);
  const run = { points: 0, mistakes: 0, done: 0, set: {} };
  SC.run = run; let si = 0, started = false, stepDone = false, stepMistakes = 0, cleanups = [], tok = 0;
  const bubble = h('div', { class: 'bubble', role: 'status', 'aria-live': 'polite' });
  const area = h('div', { class: 'area' });
  const prog = h('p', { class: 'progress' });
  const bStart = btn('Бастау', 'btn-sun xl', () => start(), { id: 'start-btn' });
  const bRetry = btn('Қайталап көру', 'btn-white', () => retry());
  const bNext = btn('Келесі тапсырма', 'btn-mint', () => next());
  const mascotEl = mascotBadge(lv.mascot || g.mascot, g.mascotName);
  const say = (text, speak) => { bubble.replaceChildren(h('span', {}, text)); if (speak) Say.speak(text); };
  const clean = () => { tok++; cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); Say.cancel(); };
  SC.cleanups.push(clean);
  const upd = () => {
    bStart.hidden = started; bRetry.hidden = !started; bNext.hidden = !started;
    bNext.disabled = !stepDone; bNext.textContent = si === lv.steps.length - 1 ? 'Нәтижені көру' : 'Келесі тапсырма';
    prog.textContent = started ? 'Тапсырма ' + (si + 1) + ' / ' + lv.steps.length : lv.steps.length + ' тапсырма';
  };
  function preview() {
    area.replaceChildren(h('div', { class: 'preview' }, lv.engine === 'breath' ? breathDemo() : h('div', { class: 'pv-ico', 'aria-hidden': 'true' }, g.icon), h('p', { class: 'pv-txt' }, 'Бастау үшін төмендегі «Бастау» батырмасын бас.'), g.note ? h('p', { class: 'note' }, '⚠️ ' + g.note) : null));
  }
  function mount() {
    clean(); area.replaceChildren(); stepDone = false; stepMistakes = 0; upd();
    const my = ++tok;
    const ui = {
      area, game: g, level: lv, step: lv.steps[si], idx: si, total: lv.steps.length, run, say,
      alive: () => my === tok,
      cleanup: (f) => cleanups.push(f),
      wait: (ms) => new Promise((res) => { const t = setTimeout(() => res(my === tok), ms); cleanups.push(() => { clearTimeout(t); res(false); }); }),
      ok: () => { if (my !== tok || stepDone) return; stepDone = true; run.done++; const p = 10 + (stepMistakes === 0 ? 5 : 0); run.points += p; Snd.play('ok'); say(pick(PRAISE) + ' ' + (si === lv.steps.length - 1 ? lv.praise : ''), true); announce('Тапсырма орындалды'); upd(); bNext.focus(); },
      wrong: (msg) => { if (my !== tok) return; stepMistakes++; run.mistakes++; Snd.play('no'); say(msg || 'Тағы бір рет асықпай байқап көрейік!', true); },
      mistakes: () => stepMistakes
    };
    ENGINES[lv.engine](ui);
  }
  function start() { started = true; Snd.init(); gstat(gid).attempts++; save(); say(lv.say, true); si = 0; mount(); }
  function retry() { gstat(gid).attempts++; save(); say(lv.retry || 'Тағы бір рет асықпай байқап көрейік!', false); mount(); }
  function next() {
    if (!stepDone) return;
    if (si < lv.steps.length - 1) { si++; mount(); const first = area.querySelector('button, a'); if (first) first.focus({ preventScroll: true }); return; }
    /* деңгей аяқталды */
    clean();
    const sa = (S.stars[gid] = S.stars[gid] || [false, false, false]); const was = sa[l - 1]; sa[l - 1] = true;
    const gs = gstat(gid); gs.points += run.points; gs.mistakes += run.mistakes; S.points += run.points; save();
    lastRun = { gid, l, points: run.points, mistakes: run.mistakes, was }; go('result-' + gid + '-' + l);
  }
  root.append(clouds(), h('div', { class: 'wrap' },
    h('div', { class: 'play-head' }, btn('← Артқа', 'btn-white small', () => go('game-' + gid)), h('div', { class: 'ph-t' }, h('p', { class: 'eyebrow' }, g.id + '-ойын · ' + g.title), h('h1', {}, l + '-деңгей. «' + lv.title + '»'))),
    h('div', { class: 'stage' + (g.mic === 'required' ? ' stage-mic' : '') },
      h('div', { class: 'mrow' }, mascotEl, bubble), prog, area),
    h('div', { class: 'actions' }, bStart, bRetry, bNext)));
  say(lv.say, false); preview(); upd(); refreshSound();
  /* Басқаша тілдік ескерту */
  if (!Say.available && S.settings.voice) announce('Кейіпкер дауысы қолжетімсіз, мәтінді экраннан оқы.');
};

/* ============================ НӘТИЖЕ ============================ */
SCREENS.result = (gid, l) => {
  const g = gameById(gid), lv = g && g.levels[l - 1];
  if (!lv || !starsOf(gid)[l - 1]) { go(g ? 'game-' + gid : 'islands'); return false; }
  Snd.setMood('play'); Snd.applyMusic();
  const root = main(); root.className = 'screen result'; root.style.setProperty('--b1', g.bg[0]); root.style.setProperty('--b2', g.bg[1]);
  const r = lastRun && lastRun.gid === gid && lastRun.l === l ? lastRun : null;
  setTimeout(() => { Snd.play('star'); Say.speak(lv.praise); }, 300);
  root.append(clouds(), confetti(), h('div', { class: 'wrap center' },
    h('p', { class: 'eyebrow' }, g.title), h('h1', {}, l + '-деңгей орындалды!'),
    h('div', { class: 'res-stars' }, stars([true, false, false].map((v, i) => i === 0), true)),
    mascotBadge(lv.mascot || g.mascot, g.mascotName),
    h('div', { class: 'bubble' }, lv.praise),
    h('dl', { class: 'res-list' }, h('div', {}, h('dt', {}, 'Бұл деңгейдегі ұпай'), h('dd', {}, String(r ? r.points : '—'))), h('div', {}, h('dt', {}, 'Ойындағы жұлдыз'), h('dd', {}, starsOf(gid).filter(Boolean).length + ' / 3'))),
    h('div', { class: 'row center' },
      btn('Қайта ойнау', 'btn-white', () => go('play-' + gid + '-' + l)),
      l < 3 ? btn('Келесі деңгей', 'btn-sun xl', () => go('play-' + gid + '-' + (l + 1)), { id: 'start-btn' }) : btn('Ойынды аяқтау', 'btn-sun xl', () => go('done-' + gid), { id: 'start-btn' }))));
  setTimeout(() => { const b = $('#start-btn'); if (b) b.focus({ preventScroll: true }); }, 50);
};

function confetti() {
  if (reducedMotion()) return h('div', { class: 'confetti', 'aria-hidden': 'true' });
  const cols = ['#ffd23f', '#ff6f9c', '#35c9b0', '#8a6cf0', '#3aa9f0'];
  return h('div', { class: 'confetti', 'aria-hidden': 'true' }, Array.from({ length: 28 }, (_, i) => h('i', { style: { left: (i * 37 % 100) + '%', background: cols[i % 5], '--d': (i % 7) * 0.35 + 's', '--t': 3 + (i % 5) * 0.5 + 's' } })));
}

/* ============================ ОЙЫН СОҢЫ ============================ */
SCREENS.done = (gid) => {
  const g = gameById(gid); if (!g) { go('islands'); return false; }
  Snd.setMood('play'); Snd.applyMusic();
  const root = main(); root.className = 'screen result done'; root.style.setProperty('--b1', g.bg[0]); root.style.setProperty('--b2', g.bg[1]);
  const st = starsOf(gid), gs = gstat(gid), nextId = gid < GAMES.length ? gid + 1 : null;
  setTimeout(() => { Snd.play('win'); Say.speak(FINAL_TEXT); }, 300);
  root.append(clouds(), confetti(), h('div', { class: 'wrap center' },
    h('h1', {}, 'Ойын аяқталды!'),
    h('div', { class: 'res-stars' }, stars(st, true)),
    h('div', { class: 'cheer' }, mascotBadge(g.mascot, g.mascotName)),
    h('div', { class: 'bubble' }, FINAL_TEXT),
    h('dl', { class: 'res-list' }, h('div', {}, h('dt', {}, 'Жиналған ұпай'), h('dd', {}, String(gs.points))), h('div', {}, h('dt', {}, 'Ойын'), h('dd', {}, g.title))),
    h('div', { class: 'row center' },
      btn('Қайта ойнау', 'btn-white', () => go('game-' + gid)),
      nextId ? btn('Келесі ойын', 'btn-sun xl', () => go('game-' + nextId), { id: 'start-btn' }) : btn('Аралдарға оралу', 'btn-sun xl', () => go('islands'), { id: 'start-btn' }),
      btn('Басты бетке қайту', 'btn-mint', () => go('home')))));
  setTimeout(() => { const b = $('#start-btn'); if (b) b.focus({ preventScroll: true }); }, 50);
};

/* ============================ ЛОГОПЕД БӨЛІМІ ============================ */
SCREENS.therapist = () => {
  Snd.setMood('calm'); Snd.applyMusic();
  const root = main(); root.className = 'screen therapist';
  const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 5);
  const wrap = h('div', { class: 'wrap narrow' }, h('div', { class: 'page-head' }, btn('← Басты бет', 'btn-white', () => go('home')), h('h1', {}, 'Логопедке арналған бөлім')));
  const msg = h('p', { class: 'dev-msg', role: 'status' });
  const gate = h('form', { class: 'gate', novalidate: '' },
    h('p', {}, 'Бұл бөлім ересектерге арналған. Кіру үшін есепті шығар:'),
    h('label', { for: 'gate-in', class: 'lab' }, a + ' + ' + b + ' = ?'),
    h('input', { id: 'gate-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', pattern: '[0-9]*' }),
    btn('Кіру', 'btn-sun', null, { type: 'submit' }), msg);
  gate.addEventListener('submit', (e) => { e.preventDefault(); if (+$('#gate-in').value === a + b) { panel(); } else { msg.textContent = 'Жауап дұрыс емес. Қайта байқап көр.'; $('#gate-in').focus(); } });
  wrap.append(gate); root.append(wrap);
  function panel() {
    gate.remove();
    const rows = GAMES.map((g) => { const st = gstat(g.id); return h('tr', {}, h('th', { scope: 'row' }, g.id + '. ' + g.title), h('td', {}, starsOf(g.id).filter(Boolean).length + ' / 3'), h('td', {}, String(st.attempts)), h('td', {}, String(st.mistakes)), h('td', {}, String(st.points))); });
    const slider = (id, lab, min, max, step, key, fmt) => { const out = h('output', { for: id }, fmt(S.settings[key])); const i = h('input', { type: 'range', id, min, max, step, value: String(S.settings[key]) }); i.addEventListener('input', () => { S.settings[key] = +i.value; out.textContent = fmt(+i.value); save(); }); return h('div', { class: 'field' }, h('label', { for: id, class: 'lab' }, lab, ' ', out), i); };
    const resetMsg = h('p', { class: 'dev-msg', role: 'status' });
    const reset = btn('Прогрессті тазалау', 'btn-coral', () => {
      if (!reset.dataset.sure) { reset.dataset.sure = '1'; reset.textContent = 'Растау: барлық жұлдыз бен ұпай өшеді'; return; }
      S.stars = {}; S.stats = {}; S.points = 0; save(); resetMsg.textContent = 'Прогресс тазаланды.'; go('therapist'); });
    wrap.append(
      h('section', { class: 'card' }, h('h2', {}, 'Прогресс'), h('p', {}, 'Жалпы жұлдыз: ' + totalStars() + ' / 75. Жалпы ұпай: ' + S.points + '.'),
        h('div', { class: 'tbl' }, h('table', {}, h('caption', { class: 'sr-only' }, 'Ойындар бойынша нәтиже'), h('thead', {}, h('tr', {}, ['Ойын', 'Жұлдыз', 'Талпыныс', 'Қате', 'Ұпай'].map((t) => h('th', { scope: 'col' }, t)))), h('tbody', {}, rows)))),
      h('section', { class: 'card' }, h('h2', {}, 'Баптаулар'),
        slider('sens', 'Микрофон сезімталдығы (төмен — жоғары)', '0.5', '2', '0.1', 'sens', (v) => v.toFixed(1)),
        slider('pace', 'Баяу оқу көмекшісі: бір сөзге миллисекунд', '600', '1600', '100', 'paceMs', (v) => v + ' мс'),
        slider('rate2', 'Кейіпкердің сөйлеу жылдамдығы', '0.6', '1', '0.05', 'rate', (v) => v.toFixed(2))),
      h('section', { class: 'card' }, h('h2', {}, 'Құрылғылар'), devicePanel()),
      h('section', { class: 'card' }, h('h2', {}, 'Бұл құралды қалай қолдану керек'),
        h('ul', {}, h('li', {}, 'Бұл ойындар логопедтің жұмысын толықтырады және оны алмастырмайды.'), h('li', {}, 'Микрофон дауыстың бар-жоғын және сөйлеу қарқынын ғана байқайды. Айтылудың дұрыстығын ересек тыңдап тексереді.'), h('li', {}, 'Қарқын тым жылдам болса, ойын сыпайы түрде баяулауды ұсынады.'), h('li', {}, 'Деректер тек осы құрылғыдағы браузерде сақталады. Микрофон жазбасы сақталмайды және жіберілмейді.'))),
      h('section', { class: 'card' }, h('h2', {}, 'Деректерді басқару'), reset, resetMsg));
    wrap.querySelector('h1').focus && wrap.querySelector('h1').setAttribute('tabindex', '-1'); wrap.querySelector('h1').focus();
  }
  setTimeout(() => $('#gate-in') && $('#gate-in').focus(), 50);
};

/* =====================================================================
   ОЙЫН МЕХАНИКАЛАРЫ (ENGINES)
   ===================================================================== */
const ENGINES = {};

function readDelay(text) { return Math.max(1200, text.length * 75); }
async function speakOrRead(ui, text, opts) { const ok = await Say.speak(text, opts); if (!ui.alive()) return false; if (!ok) return ui.wait(readDelay(text)); return true; }
function micNote(ui) { return h('p', { class: 'note small' }, ui.game.mic === 'none' ? '' : (Media.micOn ? '🎤 Микрофон қосулы.' : '🎤 Микрофонсыз да ойнауға болады.')); }

/* ---------- Баяу оқу көмекшісі (караоке) ---------- */
function tokenize(text) { return text.split(/\s+/).filter(Boolean); }
function wordsEls(text, opts) {
  opts = opts || {};
  return tokenize(text).map((w, i, arr) => {
    const end = /[.!?,…]$/.test(w);
    const e = h('span', { class: 'w' }, w);
    if (opts.pace && (end || (opts.pauseAfter && i === arr.length - 1))) e.dataset.pause = '1';
    return e;
  });
}
function makeGuide(els, ui, ms) {
  let live = true;
  const mark = (k) => els.forEach((e, j) => e.classList.toggle('hl', j === k));
  const run = (async () => {
    for (let k = 0; k < els.length && live; k++) {
      mark(k);
      if (!(await ui.wait(ms))) return;
      if (els[k].dataset.pause) { mark(-1); els[k].classList.add('pz'); if (!(await ui.wait(Math.max(900, ms * 1.1)))) return; els[k].classList.remove('pz'); }
    }
    mark(-1);
  })();
  return { stop() { live = false; mark(-1); els.forEach((e) => e.classList.remove('pz')); }, done: run };
}

/* ---------- ТЫНЫС АЛУ ---------- */
const PHASE = { in: { t: 3000, label: 'Мұрнымен дем ал…', from: 0.62, to: 1.18 }, out: { t: 5000, label: 'Ауызбен баяу шығар…', from: 1.18, to: 0.62 }, rest: { t: 1200, label: 'Тыныштық…', from: 0.62, to: 0.62 } };
function breathPhases(step) {
  const ph = [];
  for (let c = 0; c < step.cycles; c++) {
    if (step.pattern === 'in') { ph.push('in', 'rest'); } else if (step.pattern === 'out') { ph.push(c === 0 ? 'prep' : 'rest', 'out'); } else { ph.push('in', 'out'); }
  }
  return ph;
}
function pinwheel() {
  const d = document.createElement('div');
  d.innerHTML = '<svg viewBox="-60 -60 120 160" width="100%" height="100%" aria-hidden="true"><rect x="-4" y="0" width="8" height="95" rx="4" fill="#9b6b43"/><g class="pw"><path d="M0 0 L0 -50 A50 50 0 0 1 50 0Z" fill="#ff6f9c"/><path d="M0 0 L50 0 A50 50 0 0 1 0 50Z" fill="#ffd23f"/><path d="M0 0 L0 50 A50 50 0 0 1 -50 0Z" fill="#35c9b0"/><path d="M0 0 L-50 0 A50 50 0 0 1 0 -50Z" fill="#3aa9f0"/><circle r="7" fill="#1f2a44"/></g></svg>';
  return d.firstChild;
}
ENGINES.breath = (ui) => {
  const st = ui.step, area = ui.area;
  const scene = h('div', { class: 'scene sc-' + st.mode }), circle = h('div', { class: 'bcircle', 'aria-hidden': 'true' }), label = h('p', { class: 'blabel', role: 'status', 'aria-live': 'polite' }), count = h('p', { class: 'bcount', 'aria-hidden': 'true' });
  const guide = h('div', { class: 'bguide' }, circle, h('div', { class: 'bg-t' }, label, count));
  let sprite = st.sprite, filter = 'none', mode = st.mode;
  let update = () => {};
  function build() {
    scene.replaceChildren();
    const n = st.count || 1;
    if (mode === 'x') {
      const s = h('span', { class: 'sp' }, sprite); s.style.filter = filter;
      scene.append(h('div', { class: 'water' }), s, h('span', { class: 'goal' }, st.goal || '🚩'));
      update = (p) => { s.style.left = (4 + p * 74) + '%'; };
    } else if (mode === 'y') {
      const arr = Array.from({ length: n }, (_, j) => { const s = h('span', { class: 'sp y' }, sprite); s.style.left = (n === 1 ? 46 : 14 + (j * 66) / (n - 1)) + '%'; s.style.filter = filter; return s; });
      scene.append(h('div', { class: 'sea' }), ...arr);
      update = (p) => arr.forEach((s, j) => { const q = clamp((p - j * 0.1) / (1 - 0.1 * (n - 1)), 0, 1); s.style.bottom = (2 + q * 66) + '%'; });
    } else if (mode === 'spin') {
      const pw = pinwheel(); scene.append(h('div', { class: 'pwrap' }, pw), h('span', { class: 'wind' }, '🌬️➡️'));
      const g = pw.querySelector('.pw'); update = (p) => g.setAttribute('transform', 'rotate(' + (p * 1080) + ')');
    } else if (mode === 'seeds') {
      const seeds = Array.from({ length: 8 }, (_, j) => h('span', { class: 'seed' }, '·'));
      scene.append(h('div', { class: 'dandel' }, h('span', { class: 'sp', 'aria-hidden': 'true' }, sprite), ...seeds));
      update = (p) => seeds.forEach((s, j) => { const q = clamp(p * 9 - j, 0, 1); s.style.transform = 'translate(' + (q * (60 + j * 22)) + 'px,' + (-q * (30 + (j % 3) * 18)) + 'px)'; s.style.opacity = String(1 - q * 0.8); });
    } else if (mode === 'bloom') {
      const fl = Array.from({ length: n }, () => h('span', { class: 'fl' }, '🌱'));
      scene.append(h('div', { class: 'garden' }, ...fl));
      update = (p) => fl.forEach((f, j) => { const q = clamp(p * n - j, 0, 1); f.textContent = q >= 1 ? '🌷' : q > 0.4 ? '🌱' : '🌰'; f.style.transform = 'scale(' + (0.7 + q * 0.6) + ')'; });
    } else if (mode === 'candle') {
      const cs = Array.from({ length: n }, () => h('span', { class: 'candle' }, h('span', { class: 'fire' }, '🔥'), h('span', { class: 'wax' })));
      scene.append(h('div', { class: 'cake' }, h('div', { class: 'cs' }, ...cs), h('div', { class: 'cake-b', 'aria-hidden': 'true' })));
      update = (p) => cs.forEach((c, j) => { const q = clamp(p * n - j, 0, 1); const f = c.firstChild; f.style.transform = 'scale(' + (1 - q) + ')'; f.style.opacity = String(1 - q); });
    }
    update(0);
  }
  function chooseStage() {
    area.replaceChildren(h('p', { class: 'task-txt' }, st.text), h('div', { class: 'opts' }, st.choose.map((c) => btn(c.s ? c.s + ' ' + c.t : c.t, 'btn-white opt', () => {
      Snd.play('tap'); if (c.f) filter = c.f; if (c.s) sprite = c.s; ready();
    }))));
  }
  function ready() {
    build(); area.replaceChildren(h('p', { class: 'task-txt' }, st.text), scene, guide, h('div', { class: 'row center' }, btn('Дем алуды бастау', 'btn-sun', begin, { id: 'go-breath' })));
    label.textContent = 'Дайын болғанда бастаймыз.'; circle.style.transform = 'scale(0.62)';
  }
  async function begin() {
    const phases = breathPhases(st); const total = phases.reduce((s, p) => s + (PHASE[p] || PHASE.rest).t, 0);
    area.querySelector('.row').replaceChildren(h('span', { class: 'note' }, 'Қозғалыс дем ырғағымен жүріп жатыр…'));
    for (let c = 3; c > 0; c--) { label.textContent = 'Дайын бол… ' + c; if (!(await ui.wait(800))) return; }
    let elapsed = 0, last = null;
    for (const pn of phases) {
      const P = pn === 'prep' ? { t: 1500, label: 'Ауызбен баяу шығаруға дайын бол…', from: 1.18, to: 1.18 } : (PHASE[pn] || PHASE.rest);
      label.textContent = P.label; announce(P.label);
      const t0 = performance.now(); let raf;
      await new Promise((res) => {
        const f = (now) => {
          if (!ui.alive()) return res();
          const e = now - t0, q = clamp(e / P.t, 0, 1), ease = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
          circle.style.transform = 'scale(' + (P.from + (P.to - P.from) * ease) + ')';
          count.textContent = String(Math.max(1, Math.ceil((P.t - e) / 1000)));
          update(clamp((elapsed + Math.min(e, P.t)) / total, 0, 1));
          if (e >= P.t) return res(); raf = requestAnimationFrame(f);
        };
        raf = requestAnimationFrame(f); ui.cleanup(() => { cancelAnimationFrame(raf); res(); });
      });
      if (!ui.alive()) return; elapsed += P.t;
    }
    update(1); label.textContent = 'Дайын!'; count.textContent = '';
    await ui.wait(500); if (ui.alive()) ui.ok();
  }
  if (st.choose) chooseStage(); else ready();
};

/* ---------- ДЫБЫС СОЗУ (микрофон) ---------- */
ENGINES.sound = (ui) => {
  const st = ui.step, lv = ui.level, area = ui.area, TARGET = 2000;
  const set = ui.run.set; set.sound = set.sound || new Set();
  function cards() {
    const avail = lv.steps.filter((s) => !set.sound.has(s.letter));
    area.replaceChildren(h('p', { class: 'task-txt' }, 'Бір карточканы таңда:'), h('div', { class: 'opts' }, avail.map((s) => btn(s.icon + '  ' + s.letter, 'btn-white opt big', () => { Snd.play('tap'); show(s); }, { 'aria-label': s.letter + ' дыбысы' }))));
  }
  function show(sp) {
    const meter = h('div', { class: 'meter', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0', 'aria-label': 'Дыбыс шкаласы' }, h('i'));
    const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' }, 'Дыбысты жайлы дауыспен айт.');
    const man = btn('✅ Мен орындадым', 'btn-white', () => finish(), { hidden: false });
    let ses = null, busy = false;
    const listenBtn = btn(Media.micOn ? '🎤 Дыбыс шығару' : '🎤 Микрофонмен айту', 'btn-sun', async () => {
      if (busy) return; busy = true; listenBtn.disabled = true;
      if (!Media.micOn) { status.textContent = 'Рұқсат күтіп тұрмын…'; const r = await Media.enableMic(); if (!r.ok) { status.textContent = r.msg + ' «Мен орындадым» батырмасын қолдан.'; busy = false; listenBtn.disabled = false; return; } }
      if (!ui.alive()) return;
      status.textContent = 'Тыныш тұр… Айтуға дайындал.'; Snd.duck(true);
      ses = Media.listen({ maxMs: 9000, stopAtVoicedMs: TARGET, minVoiceMs: 200, endSilenceMs: 1500,
        onFrame: (f) => { if (!f.calibrating && listenBtn.dataset.rdy !== '1') { listenBtn.dataset.rdy = '1'; status.textContent = 'Айт: ' + sp.model + ' (жайлы дауыспен)'; } meter.firstChild.style.width = Math.round(f.level * 100) + '%'; meter.setAttribute('aria-valuenow', String(Math.round(f.level * 100))); } });
      ui.cleanup(() => ses && ses.stop());
      const res = await ses.done; Snd.duck(false); listenBtn.dataset.rdy = '0'; meter.firstChild.style.width = '0%';
      if (!ui.alive()) return;
      if (res.voicedMs >= TARGET * 0.9) { finish(res); return; }
      status.textContent = res.voicedMs < 200 ? 'Дауысыңды естімедім. Микрофонға жақынырақ айтып көр.' : 'Жақсы! Сәл ұзағырақ байқап көрейік. Күштеме.';
      busy = false; await ui.wait(1800); if (ui.alive()) listenBtn.disabled = false;
    });
    function finish(res) { if (ses) ses.stop(); set.sound.add(sp.letter); area.append(h('p', { class: 'ok-line' }, '✓ ' + sp.letter + ' дыбысы орындалды!')); if (res && res.url) addPlayback(area, res.url); ui.ok(); }
    area.replaceChildren(
      h('div', { class: 'big-card' }, h('span', { class: 'bc-i', 'aria-hidden': 'true' }, sp.icon), h('span', { class: 'bc-l' }, sp.letter)),
      h('div', { class: 'row center' }, btn('🔊 Тыңда', 'btn-mint', () => { Say.speak(sp.model, { rate: 0.7 }); }), listenBtn, man),
      meter, status, camToggle(ui), h('p', { class: 'note small' }, '⚠️ ' + ui.game.note));
    Say.speak(sp.model, { rate: 0.7 });
  }
  if (lv.pick) cards(); else show(st);
};

function addPlayback(area, url) {
  if (area.querySelector('.playback')) area.querySelector('.playback').remove();
  const a = new Audio(url);
  area.append(h('p', { class: 'playback' }, btn('▶ Өз дауысымды тыңдау', 'btn-white small', () => { a.currentTime = 0; a.play().catch(() => {}); })));
}
function camToggle(ui) {
  if (ui.game.cam === 'none') return null;
  const b = btn(Media.camOn ? '📷 Камераны өшіру' : '📷 Өзімді көру (камера)', 'btn-white small', async () => {
    if (Media.camOn) { Media.disableCam(); b.textContent = '📷 Өзімді көру (камера)'; return; }
    b.disabled = true; const r = await Media.enableCam(); b.disabled = false;
    if (!r.ok) { status.textContent = r.msg; } else b.textContent = '📷 Камераны өшіру';
  });
  const status = h('span', { class: 'note small', role: 'status' });
  return h('div', { class: 'camtoggle' }, b, status);
}

/* ---------- АЙТУ / ОҚУ ---------- */
function mountSay(ui, box, sp, onDone) {
  const model = sp.answer || sp.text;
  const showBlank = sp.answer && !sp.free;
  const textEl = h('p', { class: 'say-text' + (sp.rhythm ? ' rh' : ''), 'aria-label': sp.text });
  const wels = wordsEls(sp.text, { pace: sp.pace, pauseAfter: sp.pauseAfter });
  wels.forEach((e, i) => { textEl.append(e, i < wels.length - 1 ? ' ' : ''); if (e.dataset.pause) textEl.append(h('span', { class: 'pmark', 'aria-hidden': 'true' }, '⏸')); });
  let rhythm = null;
  if (sp.rhythm && sp.syl) {
    rhythm = h('div', { class: 'rhythm', 'aria-hidden': 'true' }, sp.syl.map((word, wi) => [h('span', { class: 'rw' }, word.map((s) => h('span', { class: 'beat' }, s))), wi < sp.syl.length - 1 ? h('span', { class: 'rpause' }, '⏸') : null]));
  }
  const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' }, sp.cue ? 'Оқиғаны «' + sp.cue + '» сөзімен баста.' : '');
  const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, h('i'));
  const verb = sp.verb || 'айт'; const past = { 'оқы': 'оқыдым', 'айт': 'айттым', 'қайтала': 'қайталадым' }[verb] || 'орындадым';
  let guide = null, ses = null, fails = 0, finished = false, busy = false;
  const stopGuide = () => { if (guide) guide.stop(); guide = null; };
  const beats = rhythm ? $$('.beat', rhythm) : [];
  const runBeats = async (ms) => { for (const b of beats) { b.classList.add('hl'); if (!(await ui.wait(ms))) return false; b.classList.remove('hl'); } return true; };
  const startGuide = () => { stopGuide(); if (sp.free || !sp.pace && !sp.rhythm) return; if (rhythm) { runBeats(S.settings.paceMs * 0.8); } else guide = makeGuide(wels, ui, S.settings.paceMs); };
  const modelBtn = btn('🔊 Тыңда', 'btn-mint', async () => { startGuide(); await Say.speak(model, { rate: Math.min(0.75, S.settings.rate) }); });
  const finish = (res) => {
    if (finished) return; finished = true; stopGuide(); if (ses) ses.stop();
    if (sp.answer) { textEl.replaceChildren(sp.answer); }
    box.append(h('p', { class: 'ok-line' }, sp.answer && sp.free ? '✓ Үлгі: ' + sp.answer : '✓ Жарайсың!'));
    if (res && res.url) addPlayback(box, res.url);
    manual.hidden = true; listenBtn.hidden = true; onDone();
  };
  const manual = btn(sp.doneLabel ? '✅ ' + sp.doneLabel : '✅ Мен ' + past, 'btn-white', () => finish());
  const listenBtn = btn(Media.micOn ? '🎤 ' + (verb === 'оқы' ? 'Оқу' : 'Айту') : '🎤 Микрофонмен ' + (verb === 'оқы' ? 'оқу' : 'айту'), 'btn-sun', async () => {
    if (busy) return; busy = true; listenBtn.disabled = true;
    if (!Media.micOn) { status.textContent = 'Рұқсат күтіп тұрмын…'; const r = await Media.enableMic(); if (!r.ok) { status.textContent = r.msg + ' «' + manual.textContent.replace('✅ ', '') + '» батырмасын қолдан.'; busy = false; listenBtn.disabled = false; return; } listenBtn.textContent = '🎤 ' + (verb === 'оқы' ? 'Оқу' : 'Айту'); }
    if (!ui.alive()) return;
    status.textContent = 'Тыныш тұр… бір сәт.'; Snd.duck(true); let rdy = false;
    ses = Media.listen({ maxMs: 20000, endSilenceMs: sp.pace ? 1600 : 1200, onFrame: (f) => { if (!f.calibrating && !rdy) { rdy = true; status.textContent = 'Тыңдап тұрмын. Асықпай ' + verb + '!'; startGuide(); } meter.firstChild.style.width = Math.round(f.level * 100) + '%'; } });
    ui.cleanup(() => ses && ses.stop());
    const res = await ses.done; Snd.duck(false); stopGuide(); meter.firstChild.style.width = '0%';
    if (!ui.alive() || finished) return;
    const words = tokenize(sp.free ? model : sp.text).length;
    if (res.aborted) { busy = false; listenBtn.disabled = false; return; }
    if (res.voicedMs < 250) { fails++; ui.wrong('Дауысыңды естімедім. Микрофонға жақынырақ, асықпай айтып көрейік!'); status.textContent = fails >= 2 ? 'Әлі естілмей тұр. Дыбыс деңгейін тексер немесе «Мен ' + past + '» батырмасын бас.' : 'Дауыс естілмеді. Тағы бір рет.'; }
    else if (sp.pace && words >= 3 && words / Math.max(1, res.spanMs / 1000) > 3.8) { ui.wrong('Сәл баяу айтып көрейік! Әр сөзді анық айт.'); status.textContent = 'Қарқын тым жылдам болды. Жасыл көмекшіні қарап, баяулап көр.'; }
    else { finish(res); return; }
    busy = false; await ui.wait(900); if (ui.alive()) listenBtn.disabled = false;
  });
  const parts = [];
  if (sp.pic) parts.push(h('div', { class: 'pic', role: 'img', 'aria-label': 'Сурет' }, sp.pic));
  if (sp.answer && showBlank || sp.free) parts.push(h('p', { class: 'cue' }, sp.free ? 'Суретке қарап сөйлем құрастыр.' : 'Сөйлемді толықтырып айт.'));
  parts.push(textEl); if (rhythm) parts.push(rhythm);
  parts.push(h('div', { class: 'row center' }, modelBtn, listenBtn, manual), meter, status, camToggle(ui), ui.game.mic === 'none' ? null : micNote(ui));
  box.replaceChildren(...parts.filter(Boolean));
  if (sp.autoModel) setTimeout(() => { if (ui.alive()) modelBtn.click(); }, 500);
  ui.cleanup(stopGuide);
}
ENGINES.say = (ui) => {
  const st = ui.step, g = ui.game;
  const deco = h('div', { class: 'deco' });
  if (st.train) deco.append(h('div', { class: 'train', 'aria-hidden': 'true' }, '🚂', ...Array.from({ length: ui.idx }, () => '🚃'), h('span', { class: 'wag' }, '🚃'), ' '.repeat(0)));
  if (st.book) deco.append(h('p', { class: 'pgno' }, '📖 Бет ' + (ui.idx + 1) + ' / ' + ui.total));
  if (st.robot) deco.append(h('p', { class: 'robot-eyes', 'aria-hidden': 'true' }, '🤖 ', ...tokenize(st.text).map(() => '💡')));
  if (st.stage) deco.append(h('p', { class: 'spot', 'aria-hidden': 'true' }, '🔦 🎤 🔦'));
  const box = h('div', { class: 'say-box' });
  ui.area.replaceChildren(deco, box);
  mountSay(ui, box, st, () => { if (st.train) $('.wag', deco) && $('.wag', deco).classList.add('in'); ui.ok(); });
};

/* ---------- ТАҢДАУ ---------- */
ENGINES.choose = (ui) => {
  const st = ui.step, area = ui.area;
  const head = h('div', { class: 'ch-head' });
  const optsBox = h('div', { class: 'opts' + (st.opts.length === 2 ? ' two' : '') });
  const after = h('div', { class: 'say-box' });
  const spoken = st.speak || null, sfx = st.sfx || null;
  const play = () => { if (sfx) Snd.play(sfx, true); else if (spoken) Say.speak(spoken); };
  head.append(st.pic ? h('div', { class: 'pic', role: 'img', 'aria-label': 'Сурет' }, st.pic) : null, h('p', { class: 'task-txt' }, st.prompt));
  if (spoken || sfx) {
    head.append(btn('🔊 Тыңдау', 'btn-mint', play));
    if (!sfx && !Say.available && !st.reveal) head.append(h('p', { class: 'note small' }, 'Дауыс қолжетімсіз. Айтылған мәтін: «' + spoken + '»'));
    if (!sfx && !Say.available && st.reveal) head.append(h('p', { class: 'note small' }, 'Дауыс қолжетімсіз. Айтылған сөйлем: «' + spoken + '»'));
  }
  const reveal = () => { optsBox.hidden = false; };
  if (st.knock) { optsBox.hidden = true; head.append(btn('🚪 Есікті қақ', 'btn-sun', function () { Snd.play('knock', true); this.hidden = true; reveal(); })); }
  st.opts.forEach((o) => {
    const b = h('button', { type: 'button', class: 'btn btn-white opt', 'aria-label': (o.text || '') }, o.pic ? h('span', { class: 'o-i', 'aria-hidden': 'true' }, o.pic) : null, o.text ? h('span', { class: 'o-t' }, o.text) : null);
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-disabled') === 'true') return;
      if (o.ok || st.any) {
        $$('.opt', optsBox).forEach((x) => { x.setAttribute('aria-disabled', 'true'); x.classList.add('off'); }); b.classList.remove('off'); b.classList.add('right'); Snd.play('ok');
        if (st.after) { const a = st.after; const text = a.text.replace('{t}', o.text); optsBox.after(after); mountSay(ui, after, Object.assign({}, a, { text }), () => ui.ok()); if (!spoken && !sfx) Say.speak(text); } else ui.ok();
      } else { b.classList.add('wrongo'); b.setAttribute('aria-disabled', 'true'); ui.wrong('Тағы бір рет байқап көрейік! Мұқият қара.'); setTimeout(() => b.classList.remove('wrongo'), 600); }
    });
    optsBox.append(b);
  });
  area.replaceChildren(head, optsBox);
  if (spoken || sfx) setTimeout(() => { if (ui.alive() && !st.knock) play(); }, 500);
};

/* ---------- СӨЙЛЕМ ҚҰРАСТЫР ---------- */
ENGINES.build = (ui) => {
  const st = ui.step, area = ui.area; let nextIdx = 0;
  const target = st.words, slots = target.map((_, i) => h('span', { class: 'slot', 'aria-label': (i + 1) + '-сөз орны' }, '＿＿'));
  let order = target.map((_, i) => i); for (let k = 0; k < 8 && order.every((v, i) => v === i); k++) order = order.sort(() => Math.random() - 0.5);
  if (order.every((v, i) => v === i)) order.reverse();
  const tray = h('div', { class: 'opts tray' });
  order.forEach((wi) => { const b = btn(target[wi], 'btn-white opt', () => {
    if (b.disabled) return;
    if (wi === nextIdx) { b.disabled = true; slots[nextIdx].textContent = target[wi]; slots[nextIdx].classList.add('on'); Snd.play('tap'); nextIdx++; if (nextIdx === target.length) complete(); }
    else { b.classList.add('wrongo'); ui.wrong('Сөйлем осылай басталмайды. Тағы байқап көрейік!'); setTimeout(() => b.classList.remove('wrongo'), 600); }
  }); tray.append(b); });
  const sent = target.join(' ') + (st.end || '.');
  const rest = h('div', { class: 'say-box' });
  function complete() {
    const afterRead = () => ui.ok();
    const readStep = () => { tray.hidden = true; rest.replaceChildren(); area.append(rest); mountSay(ui, rest, { text: sent, verb: 'оқы', pace: true }, afterRead); Say.speak(sent, { rate: 0.75 }); };
    if (!st.punct) return readStep();
    const names = { '.': 'нүкте', '?': 'сұрақ белгісі', '!': 'леп белгісі' };
    const box = h('div', { class: 'punct' }, h('p', { class: 'task-txt' }, 'Сөйлем соңына қандай тыныс белгісі қойылады?'), h('div', { class: 'opts two' }, ['.', '?', '!'].map((p) => { const b = btn(h('span', { class: 'pm' }, p), 'btn-white opt', () => {
      if (p === st.end) { box.remove(); slots[slots.length - 1].textContent += p; Snd.play('ok'); readStep(); } else { b.classList.add('wrongo'); ui.wrong('Сөйлемнің мағынасына қара. Тағы бір рет байқап көрейік!'); setTimeout(() => b.classList.remove('wrongo'), 600); }
    }, { 'aria-label': names[p] }); return b; })));
    tray.hidden = true; area.append(box);
  }
  area.replaceChildren(h('div', { class: 'pic', role: 'img', 'aria-label': 'Сурет' }, st.pic), h('p', { class: 'task-txt' }, 'Сөздерді дұрыс ретпен бас.'), h('div', { class: 'sentence', 'aria-live': 'polite' }, ...slots), tray);
};

/* ---------- БАҒДАРШАМ ---------- */
ENGINES.traffic = (ui) => {
  const st = ui.step, area = ui.area; let text = st.text || null, round = 0;
  const lights = ['red', 'yellow', 'green'].map((c) => h('i', { class: 'lamp ' + c }));
  const tl = h('div', { class: 'tl', role: 'img', 'aria-label': 'Бағдаршам' }, ...lights);
  const phase = h('p', { class: 'phase', role: 'status', 'aria-live': 'polite' }, 'Бағдаршам дайын');
  const card = h('div', { class: 'sent-card' });
  const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, h('i'));
  const lamp = (c) => lights.forEach((l) => l.classList.toggle('on', l.classList.contains(c)));
  const manualBox = h('div', { class: 'row center' });
  function intro() {
    area.replaceChildren(h('p', { class: 'task-txt' }, 'Бағдаршам түстері:'), h('ul', { class: 'tl-help' }, h('li', {}, '🟢 Жасыл: сөйле'), h('li', {}, '🟡 Сары: кідір'), h('li', {}, '🔴 Қызыл: тоқта')), btn('Түсінікті', 'btn-sun', () => ready()));
    Say.speak('Жасыл түс жанғанда айтамыз. Сары түсте кідіреміз. Қызыл түсте тоқтаймыз.');
  }
  function choosePick() {
    area.replaceChildren(h('p', { class: 'task-txt' }, 'Сөйлем карточкасын таңда:'), h('div', { class: 'opts two' }, st.pick.map((t) => btn(t, 'btn-white opt', () => { Snd.play('tap'); text = t; ready(); }))));
  }
  function ready() {
    card.replaceChildren(h('p', { class: 'say-text' }, text));
    lamp('none'); phase.textContent = 'Бағдаршамды қосайық';
    const go1 = btn('🚦 Бағдаршамды қос', 'btn-sun', () => runRound());
    area.replaceChildren(h('div', { class: 'tl-wrap' }, tl, h('div', { class: 'tl-side' }, card, phase)), h('div', { class: 'row center' }, go1, !Media.micOn ? btn('🎤 Микрофонды қосу', 'btn-white small', async (e) => { const b = e.currentTarget; b.disabled = true; const r = await Media.enableMic(); status.textContent = r.ok ? 'Микрофон қосылды.' : r.msg; b.hidden = r.ok; b.disabled = false; }) : null), meter, status, camToggle(ui), micNote(ui));
  }
  async function runRound() {
    round++;
    const gMs = st.g || (tokenize(text).length >= 3 ? 7000 : 5000);
    const btns = area.querySelector('.row'); if (btns) btns.hidden = true;
    lamp('none'); phase.textContent = 'Дайын бол…'; status.textContent = '';
    let green = 0, red = 0, cur = 'none', prev = performance.now(), mon = null;
    if (Media.micOn) { Snd.duck(true); mon = Media.monitor((f) => { const n = performance.now(), dt = n - prev; prev = n; if (f.active) { if (cur === 'green') green += dt; if (cur === 'red') red += dt; } meter.firstChild.style.width = Math.round(f.level * 100) + '%'; }); ui.cleanup(() => { mon && mon.stop(); Snd.duck(false); }); }
    if (!(await ui.wait(1800))) return;
    const wels = $$('.w', card); if (!wels.length) { const p = $('.say-text', card); p.replaceChildren(...wordsEls(text, { pace: false }).flatMap((e, i, a) => [e, i < a.length - 1 ? ' ' : ''])); }
    cur = 'green'; lamp('green'); phase.textContent = '🟢 Жасыл: сөйле!'; Snd.play('tap'); announce('Жасыл. Сөйле!');
    const g = makeGuide($$('.w', card), ui, Math.min(S.settings.paceMs, Math.max(500, gMs / Math.max(1, tokenize(text).length) * 0.9))); ui.cleanup(g.stop);
    if (!(await ui.wait(gMs))) return; g.stop();
    cur = 'yellow'; lamp('yellow'); phase.textContent = '🟡 Сары: кідір'; announce('Сары. Кідір.'); if (!(await ui.wait(2800))) return;
    cur = 'red'; lamp('red'); phase.textContent = '🔴 Қызыл: тоқта'; announce('Қызыл. Тоқта.'); if (!(await ui.wait(3200))) return;
    cur = 'none'; if (mon) { mon.stop(); Snd.duck(false); meter.firstChild.style.width = '0%'; }
    const again = btn('↻ Тағы бір рет', 'btn-white', () => ready());
    if (Media.micOn) {
      if (green < 300) { ui.wrong('Жасыл түсте айтуды ұмытпа. Тағы бір рет байқап көрейік!'); status.textContent = 'Жасыл түсте дауыс естілмеді.'; manualBox.replaceChildren(again, btn('✅ Мен орындадым', 'btn-white', () => ui.ok())); area.append(manualBox); }
      else if (red > 900) { ui.wrong('Қызыл түсте тоқтайық. Тағы бір рет байқап көрейік!'); status.textContent = 'Қызыл түсте үндемеу керек.'; manualBox.replaceChildren(again, btn('✅ Мен орындадым', 'btn-white', () => ui.ok())); area.append(manualBox); }
      else { status.textContent = '✓ Жасыл түсте айттың, қызыл түсте тоқтадың!'; ui.ok(); }
    } else { phase.textContent = 'Орындадың ба?'; manualBox.replaceChildren(btn('✅ Мен орындадым', 'btn-sun', () => { ui.ok(); }), again); area.append(manualBox); }
  }
  if (st.intro) intro(); else if (st.pick) choosePick(); else ready();
};

/* ---------- ДИАЛОГ ---------- */
ENGINES.dialog = (ui) => {
  const st = ui.step, g = ui.level, area = ui.area, G = ui.game;
  const who = g.who || {};
  const names = g.names || {};
  let me = 'me';
  const chat = h('div', { class: 'chat', 'aria-live': 'polite' }), box = h('div', { class: 'say-box' });
  const lines = st.lines;
  const isMe = (w) => w === me;
  const nameOf = (w) => (w === 'me' ? 'Сен' : names[w] || '');
  const addLine = (w, t) => chat.append(h('div', { class: 'msg ' + (isMe(w) ? 'mine' : 'theirs') }, h('span', { class: 'av', 'aria-hidden': 'true' }, who[w] || '🧒'), h('span', { class: 'mt' }, nameOf(w) ? h('b', {}, nameOf(w) + ': ') : null, t)));
  async function play(i) {
    if (!ui.alive()) return;
    if (i >= lines.length) { ui.ok(); return; }
    const ln = lines[i];
    if (isMe(ln.w)) {
      addLine(ln.w, ln.t); box.replaceChildren(); area.append(box);
      ui.say('Сенің кезегің! ' + (G.mic === 'none' ? '' : 'Айт: «' + ln.t + '»'), false); Snd.play('tap');
      mountSay(ui, box, { text: ln.t, verb: 'айт' }, async () => { box.replaceChildren(); await ui.wait(600); play(i + 1); });
    } else { addLine(ln.w, ln.t); box.replaceChildren(); if (!(await speakOrRead(ui, ln.t))) return; if (!(await ui.wait(400))) return; play(i + 1); }
  }
  function begin() { area.replaceChildren(h('p', { class: 'task-txt' }, 'Әңгімені тыңда, кезегің келгенде айт.'), chat); play(0); }
  if (st.pick) {
    const roles = [...new Set(lines.map((l) => l.w))];
    area.replaceChildren(h('p', { class: 'task-txt' }, 'Қай кейіпкердің рөлін алғың келеді?'), h('div', { class: 'opts two' }, roles.map((r) => btn((who[r] || '') + ' ' + (names[r] || ''), 'btn-white opt', () => { me = r; Snd.play('ok'); begin(); }))));
  } else begin();
};

/* ---------- АЙЫРМАШЫЛЫҚ ---------- */
ENGINES.diff = (ui) => {
  const st = ui.step; let found = 0;
  const left = h('div', { class: 'grid3', role: 'group', 'aria-label': 'Сол жақ сурет' }, st.a.map((e) => h('span', { class: 'cell fixed' }, e)));
  const counter = h('p', { class: 'task-txt' }, 'Табылған айырмашылық: 0 / ' + st.diffs.length);
  const right = h('div', { class: 'grid3', role: 'group', 'aria-label': 'Оң жақ сурет. Айырмашылықты тап' }, st.b.map((e, i) => { const b = h('button', { type: 'button', class: 'cell', 'aria-label': 'Ұяшық ' + (i + 1) + ': ' + e }, e);
    b.addEventListener('click', () => { if (b.dataset.f) return; if (st.diffs.includes(i)) { b.dataset.f = '1'; b.classList.add('found'); b.setAttribute('aria-label', 'Табылды: ' + e); Snd.play('ok'); found++; counter.textContent = 'Табылған айырмашылық: ' + found + ' / ' + st.diffs.length; if (found === st.diffs.length) ui.ok(); } else { b.classList.add('wrongo'); ui.wrong('Бұл ұяшықтар бірдей. Басқасын қарап көрейік!'); setTimeout(() => b.classList.remove('wrongo'), 600); } }); return b; }));
  ui.area.replaceChildren(counter, h('div', { class: 'twin' }, left, right));
};

/* ---------- ІЗДЕУ ---------- */
ENGINES.find = (ui) => {
  const st = ui.step; let k = 0;
  const prompt = h('p', { class: 'task-txt', role: 'status', 'aria-live': 'polite' });
  const targets = st.targets;
  const say = () => { const nm = NAMES[targets[k]] || ['сурет', 'суретті']; const t = nm[1][0].toUpperCase() + nm[1].slice(1) + ' тап!'; prompt.textContent = (targets.length > 1 ? (k + 1) + '/' + targets.length + '. ' : '') + t; Say.speak(t); };
  const grid = h('div', { class: 'grid4' }, st.grid.map((e) => { const nm = NAMES[e]; const b = h('button', { type: 'button', class: 'cell', 'aria-label': nm ? nm[0] : e }, e);
    b.addEventListener('click', () => { if (b.dataset.f) return; if (e === targets[k]) { b.dataset.f = '1'; b.classList.add('found'); Snd.play('ok'); k++; if (k >= targets.length) { prompt.textContent = 'Барлығын таптың!'; ui.ok(); } else say(); } else { b.classList.add('wrongo'); ui.wrong('Бұл басқа сурет. Қайта қарап көрейік!'); setTimeout(() => b.classList.remove('wrongo'), 600); } }); return b; }));
  ui.area.replaceChildren(h('div', { class: 'row center' }, prompt, btn('🔊 Қайталау', 'btn-mint small', () => say())), grid);
  setTimeout(() => ui.alive() && say(), 400);
};

/* ---------- ҚАТЕ ЗАТ ---------- */
ENGINES.odd = (ui) => {
  const st = ui.step;
  const cells = Array.from({ length: st.n }, (_, i) => i === st.at ? st.odd : st.base);
  const grid = h('div', { class: 'grid3' }, cells.map((e, i) => { const b = h('button', { type: 'button', class: 'cell', 'aria-label': 'Ұяшық ' + (i + 1) + ': ' + e }, e);
    b.addEventListener('click', () => { if (ui.done) return; if (i === st.at) { ui.done = true; b.textContent = st.base; b.classList.add('found'); b.setAttribute('aria-label', 'Түзетілді'); Snd.play('ok'); ui.ok(); } else { b.classList.add('wrongo'); ui.wrong('Бұл дұрыс зат. Қате затты іздейік!'); setTimeout(() => b.classList.remove('wrongo'), 600); } }); return b; }));
  ui.area.replaceChildren(h('p', { class: 'task-txt' }, 'Қате зат қайсы? Оны тап та, бас.'), grid);
};

/* ---------- ЕСТЕ САҚТАУ ---------- */
ENGINES.seq = (ui) => {
  const st = ui.step; let pos = 0, busy = true;
  const msg = h('p', { class: 'task-txt', role: 'status', 'aria-live': 'polite' }, '');
  const items = st.pool.map((e, i) => { const b = h('button', { type: 'button', class: 'cell', 'aria-label': 'Сурет ' + (i + 1) + ': ' + e }, e);
    b.addEventListener('click', () => { if (busy) return; if (i === st.seq[pos]) { b.classList.add('found'); setTimeout(() => b.classList.remove('found'), 400); Snd.play('tap'); pos++; if (pos >= st.seq.length) { msg.textContent = 'Дұрыс ретпен таптың!'; busy = true; ui.ok(); } } else { b.classList.add('wrongo'); ui.wrong('Тағы бір рет қарайық. Көр де, қайтала!'); setTimeout(() => b.classList.remove('wrongo'), 600); pos = 0; showSeq(); } }); return b; });
  async function showSeq() {
    busy = true; pos = 0; msg.textContent = 'Қара! Суреттер жанады…';
    if (!(await ui.wait(700))) return;
    for (const idx of st.seq) { items[idx].classList.add('lit'); Snd.play('tap'); if (!(await ui.wait(900))) return; items[idx].classList.remove('lit'); if (!(await ui.wait(300))) return; }
    msg.textContent = 'Енді сен қайтала! Суреттерді сол ретпен бас.'; busy = false;
  }
  ui.area.replaceChildren(msg, h('div', { class: 'grid-row' }, items), h('div', { class: 'row center' }, btn('👁 Қайта көрсету', 'btn-mint small', () => showSeq())));
  showSeq();
};

/* ---------- ЖҰП ТАП ---------- */
ENGINES.pairs = (ui) => {
  const st = ui.step; let first = null, lock = false, matched = 0;
  const deck = [...st.emojis, ...st.emojis].map((e, i) => ({ e, i })).sort(() => Math.random() - 0.5);
  const msg = h('p', { class: 'task-txt', role: 'status', 'aria-live': 'polite' }, 'Табылған жұп: 0 / ' + st.emojis.length);
  const cards = deck.map((c, idx) => { const b = h('button', { type: 'button', class: 'cell card', 'aria-label': 'Жабық карточка ' + (idx + 1) }, h('span', { class: 'face' }, '❓'));
    b.addEventListener('click', async () => {
      if (lock || b.dataset.open || b.dataset.done) return;
      b.dataset.open = '1'; b.firstChild.textContent = c.e; b.setAttribute('aria-label', 'Ашық: ' + c.e); Snd.play('tap');
      if (!first) { first = { b, c }; return; }
      if (first.c.e === c.e) { first.b.dataset.done = '1'; b.dataset.done = '1'; first.b.classList.add('found'); b.classList.add('found'); matched++; msg.textContent = 'Табылған жұп: ' + matched + ' / ' + st.emojis.length; Snd.play('ok'); first = null; if (matched === st.emojis.length) ui.ok(); }
      else { lock = true; const f = first; first = null; ui.wrong('Бұл бірдей емес. Көргеніңді есте сақта!'); if (!(await ui.wait(900))) return; [f.b, b].forEach((x) => { delete x.dataset.open; x.firstChild.textContent = '❓'; x.setAttribute('aria-label', 'Жабық карточка'); }); lock = false; }
    }); return b; });
  ui.area.replaceChildren(msg, h('div', { class: 'grid4' }, cards));
};

/* ============================ ІСКЕ ҚОСУ ============================ */
function init() {
  applySettings();
  const top = $('#top');
  top.append(
    h('a', { class: 'brand', href: '#home' }, h('span', { 'aria-hidden': 'true' }, '🌈'), ' Сөйлеу әлемі'),
    h('div', { class: 'tools' },
      h('button', { type: 'button', class: 'btn btn-white tool', 'aria-label': 'Қолжетімділік параметрлері', onclick: () => openDlg('Қолжетімділік', accessPanel(), { wide: true }) }, h('span', { 'aria-hidden': 'true' }, '♿'), h('span', { class: 'tl-t' }, 'Қолжетімділік')),
      h('button', { type: 'button', class: 'btn btn-white tool', 'aria-label': 'Микрофон мен камера', id: 'dev-btn', onclick: () => openDlg('Микрофон мен камера', devicePanel(), { wide: true }) }, h('span', { 'aria-hidden': 'true' }, '🎤📷'), h('span', { class: 'tl-t' }, 'Құрылғылар')),
      h('button', { type: 'button', class: 'btn btn-grape tool', 'data-sound': '', onclick: toggleSound }, h('span', { class: 'i', 'aria-hidden': 'true' }), h('span', { class: 't tl-t' }))));
  const refreshDev = () => { const b = $('#dev-btn'); if (b) b.classList.toggle('active', Media.micOn || Media.camOn); const m = $('#devstate'); if (m) m.textContent = (Media.micOn ? 'Микрофон қосулы. ' : '') + (Media.camOn ? 'Камера қосулы.' : ''); };
  Media.listeners.add(refreshDev);
  $('#cam-off').addEventListener('click', () => Media.disableCam());
  /* Алғашқы әрекеттен кейін дыбыс қосылады (браузер талабы) */
  const firstGesture = () => { Snd.init(); Snd.applyMusic(); window.removeEventListener('pointerdown', firstGesture); window.removeEventListener('keydown', firstGesture); };
  window.addEventListener('pointerdown', firstGesture); window.addEventListener('keydown', firstGesture);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Snd.ctx) Snd.ctx.resume().catch(() => {}); });
  refreshSound(); route();
}
document.addEventListener('DOMContentLoaded', init);
