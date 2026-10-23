/* Omer games – shared parental controls (one file for the menu and every game; same origin => shared localStorage).
   Included automatically by tools/new-game-pwa.py inside the <!-- PWA --> head block.
   - total daily play time across ALL games (default 55 min), resets at local midnight (key = local date)
   - counts only while a game page is visible and the child was active in the last 3 min; multi-tab safe
     (only the tab holding a fresh heartbeat in localStorage counts, so two open tabs never double count)
   - kid badge ⏳ (tap = hear remaining time), spoken + visual warnings at 5 and 1 minutes left
   - full-screen lock when time is up / outside allowed hours; only the parent PIN opens it
   - parent area: 🔒 button on the menu (or long-press the ⏳ badge 2s anywhere); 4-digit PIN, SHA-256 + salt
   NOTE: client-side only – clearing the browser's site data removes the limit. Use Screen Time / Family Link for hard enforcement. */
(() => {
  if (window.__omerPC) return; window.__omerPC = true;
  const K = 'omerPC', DAYK = 'omerPC_day_', HBK = 'omerPC_hb', NAMESK = 'omerPC_names';
  const TICK = 5000, MAXSTEP = 10000, HB_STALE = 12000, IDLE = 180000, Z = 2147483646;
  const me = document.currentScript && document.currentScript.src;
  const root = me ? new URL('../', me) : new URL('./', location.href);
  const rel = location.pathname.startsWith(root.pathname) ? location.pathname.slice(root.pathname.length) : '';
  const seg = rel.split('/').filter(Boolean);
  const APP = seg.length > 1 ? seg[0] : (seg[0] && !/\.html?$/.test(seg[0]) ? seg[0] : 'menu');
  const IS_MENU = APP === 'menu';
  const tabId = Math.random().toString(36).slice(2);

  const ls = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const cfg = () => Object.assign({ on: true, limit: 55, win: false, from: '07:00', to: '20:00', pin: null, salt: null, fails: 0, lockUntil: 0 }, ls.get(K, {}));
  const saveCfg = c => ls.set(K, c);
  const day = () => Object.assign({ used: 0, games: {}, bonus: 0, warned: {}, stop: false, override: 0 }, ls.get(DAYK + dayKey(), {}));
  const saveDay = d => ls.set(DAYK + dayKey(), d);
  if (!IS_MENU) { const n = ls.get(NAMESK, {}); const t = document.title.trim(); if (t && n[APP] !== t) { n[APP] = t; ls.set(NAMESK, n); } }
  // clean up day records older than 30 days
  try { const old = dayKey(new Date(Date.now() - 30 * 864e5)); Object.keys(localStorage).forEach(k => { if (k.startsWith(DAYK) && k.slice(DAYK.length) < old) localStorage.removeItem(k); }); } catch (e) {}

  const budget = (c, d) => (c.limit + d.bonus) * 60;
  const remaining = (c = cfg(), d = day()) => Math.max(0, budget(c, d) - d.used);
  const mins = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  function outsideHours(c, d) {
    if (!c.win || Date.now() < (d.override || 0)) return false;
    const n = new Date(), now = n.getHours() * 60 + n.getMinutes(), a = mins(c.from), b = mins(c.to);
    return a <= b ? (now < a || now >= b) : (now < a && now >= b);
  }
  function lockReason(c = cfg(), d = day()) {
    if (!c.on) return null;
    if (d.stop) return 'stop';
    if (remaining(c, d) <= 0) return 'time';
    if (outsideHours(c, d)) return 'hours';
    return null;
  }

  // ---------- speech (he-IL, silent if no voice) ----------
  let heVoice = null;
  const findVoice = () => { try { heVoice = speechSynthesis.getVoices().find(v => /^(he|iw)/i.test(v.lang)) || null; } catch (e) {} };
  if (window.speechSynthesis) { findVoice(); try { speechSynthesis.addEventListener('voiceschanged', findVoice); } catch (e) {} }
  function say(t) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'he-IL'; if (heVoice) u.voice = heVoice; u.rate = 0.92; u.pitch = 1.25; speechSynthesis.speak(u); } catch (e) {}
  }
  const numHe = n => ({ 1: 'דקה אחת', 2: 'שתי דקות', 3: 'שלוש דקות', 4: 'ארבע דקות', 5: 'חמש דקות' }[n] || `${n} דקות`);

  // ---------- styles ----------
  const css = `
  .opc,.opc *{box-sizing:border-box;font-family:"Arial Rounded MT Bold","Varela Round",Arial,sans-serif}
  #opcBadge{position:fixed;bottom:10px;left:10px;z-index:${Z - 10};direction:ltr;background:rgba(255,255,255,.92);border:3px solid #43a047;color:#1b5e20;border-radius:20px;padding:3px 10px 3px 8px;font-size:17px;font-weight:bold;box-shadow:0 3px 0 rgba(0,0,0,.2);user-select:none;-webkit-user-select:none;touch-action:manipulation;cursor:pointer;display:flex;align-items:center;gap:4px;line-height:1.2}
  #opcBadge.mid{border-color:#f9a825;color:#8d6e00}#opcBadge.low{border-color:#e53935;color:#b71c1c;background:#ffebee}
  #opcBadge.low.pulse{animation:opcP 1s infinite alternate}@keyframes opcP{to{transform:scale(1.15)}}
  #opcBadge.off{display:none}
  #opcLockBtn{position:fixed;bottom:10px;right:10px;z-index:${Z - 10};width:38px;height:38px;border-radius:50%;border:2px solid rgba(255,255,255,.7);background:rgba(0,0,0,.12);font-size:18px;opacity:.55;cursor:pointer;padding:0}
  #opcWarn{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.6);opacity:0;pointer-events:none;transition:all .35s;z-index:${Z - 5};background:#fff;border:7px solid #ffcb05;border-radius:34px;padding:16px 28px;text-align:center;direction:rtl;box-shadow:0 12px 30px rgba(0,0,0,.35);color:#3b4cca;font-size:30px;font-weight:bold;max-width:92vw}
  #opcWarn.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
  #opcWarn .big{font-size:64px;line-height:1.1}
  #opcLock{position:fixed;inset:0;z-index:${Z};background:radial-gradient(circle at 50% 35%,#3f51b5,#1a237e 70%,#0d1240);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;direction:rtl;color:#fff;padding:20px;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none}
  #opcLock h1{font-size:clamp(30px,7vw,54px);margin:4px 0;color:#ffeb3b;text-shadow:0 4px 0 rgba(0,0,0,.3)}
  #opcLock p{font-size:clamp(20px,4.5vw,30px);margin:0}
  #opcLock svg{width:min(62vw,300px);height:auto}
  #opcLock .stars{position:absolute;inset:0;pointer-events:none;font-size:22px;opacity:.7}
  #opcLock .par{position:absolute;bottom:14px;left:14px;font-size:15px;color:#c5cae9;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:6px 12px;cursor:pointer}
  .opcZ{animation:opcZ 2.4s infinite;opacity:0}@keyframes opcZ{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(18px,-40px)}}
  #opcModal{position:fixed;inset:0;z-index:${Z + 1};background:rgba(10,15,50,.7);display:flex;align-items:center;justify-content:center;direction:ltr;padding:10px;overflow-y:auto}
  #opcModal .box{background:#fff;color:#222;border-radius:22px;border:5px solid #3b4cca;width:420px;max-width:100%;padding:16px 18px;position:relative;max-height:96vh;overflow-y:auto;text-align:left}
  #opcModal h2{margin:0 0 6px;padding-right:26px;color:#3b4cca;font-size:22px}
  #opcModal h3{margin:12px 0 4px;font-size:16px;color:#333;border-top:1px solid #eee;padding-top:10px}
  #opcModal .he{direction:rtl;color:#666;font-size:14px}
  #opcModal .x{position:absolute;top:8px;right:10px;font-size:20px;background:none;border:none;cursor:pointer}
  #opcModal button.b{font-size:16px;border-radius:12px;border:2px solid #3b4cca;background:#e8eaf6;color:#1a237e;padding:6px 12px;margin:3px 2px;cursor:pointer;font-weight:bold}
  #opcModal button.g{background:#43a047;border-color:#2e7d32;color:#fff}
  #opcModal button.r{background:#ffebee;border-color:#e53935;color:#b71c1c}
  #opcModal input{font-size:16px;padding:5px 8px;border:2px solid #9fa8da;border-radius:10px}
  #opcModal input.pin{font-size:30px;letter-spacing:12px;text-align:center;width:180px;-webkit-text-security:disc}
  #opcModal .msg{color:#c62828;min-height:20px;font-size:15px;margin-top:4px}
  #opcModal .bar{height:14px;border-radius:8px;background:#eee;overflow:hidden;margin:6px 0}
  #opcModal .bar i{display:block;height:100%;background:linear-gradient(90deg,#43a047,#fbc02d,#e53935)}
  #opcModal table{width:100%;border-collapse:collapse;font-size:15px}#opcModal td{padding:2px 4px}#opcModal td:last-child{text-align:right}
  #opcModal label{font-size:15px}`;
  const st = document.createElement('style'); st.id = 'opcCss'; st.textContent = css;

  // original simple drawing of a sleeping yellow electric mouse (no copyrighted art)
  const SLEEP_SVG = `<svg viewBox="0 0 240 200" aria-hidden="true">
    <ellipse cx="120" cy="178" rx="92" ry="14" fill="rgba(0,0,0,.25)"/>
    <path d="M58 92 L22 18 Q20 10 30 14 L84 70Z" fill="#ffd400" stroke="#5d4037" stroke-width="3"/><path d="M22 18 L34 42 L44 30Z" fill="#222"/>
    <path d="M182 92 L218 18 Q220 10 210 14 L156 70Z" fill="#ffd400" stroke="#5d4037" stroke-width="3"/><path d="M218 18 L206 42 L196 30Z" fill="#222"/>
    <path d="M196 150 l26 -20 -8 -14 22 -12 -16 -26 -14 8 12 20 -22 12 8 14 -20 14z" fill="#ffd400" stroke="#5d4037" stroke-width="3"/>
    <ellipse cx="120" cy="120" rx="82" ry="62" fill="#ffd400" stroke="#5d4037" stroke-width="3"/>
    <path d="M78 112 q12 10 24 0" stroke="#222" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M138 112 q12 10 24 0" stroke="#222" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="70" cy="138" r="13" fill="#ff5252"/><circle cx="170" cy="138" r="13" fill="#ff5252"/>
    <path d="M114 132 q6 6 12 0" stroke="#5d4037" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text class="opcZ" x="190" y="70" font-size="30" fill="#fff" font-weight="bold">Z</text>
    <text class="opcZ" x="205" y="45" font-size="22" fill="#fff" font-weight="bold" style="animation-delay:.8s">z</text>
    <text class="opcZ" x="215" y="25" font-size="16" fill="#fff" font-weight="bold" style="animation-delay:1.6s">z</text></svg>`;

  // ---------- UI ----------
  let badge, lockEl, warnEl, lockBtn, modal = null, locked = null, inerted = [];
  const ours = n => n && n.closest && n.closest('.opc');
  function build() {
    if (!document.getElementById('opcCss')) document.head.appendChild(st);
    badge = document.createElement('div'); badge.id = 'opcBadge'; badge.className = 'opc'; badge.setAttribute('role', 'button'); badge.setAttribute('aria-label', 'זמן משחק');
    document.body.appendChild(badge);
    let pressT = null;
    badge.addEventListener('pointerdown', () => { clearTimeout(pressT); pressT = setTimeout(() => { pressT = 'done'; openParent(); }, 2000); });
    const up = () => { if (pressT === 'done') { pressT = null; return; } clearTimeout(pressT); pressT = null; };
    badge.addEventListener('pointerup', () => { const was = pressT; up(); if (was && was !== 'done') sayRemaining(); });
    badge.addEventListener('pointerleave', up); badge.addEventListener('pointercancel', up);
    badge.addEventListener('contextmenu', e => e.preventDefault());
    warnEl = document.createElement('div'); warnEl.id = 'opcWarn'; warnEl.className = 'opc'; document.body.appendChild(warnEl);
    if (IS_MENU) {
      lockBtn = document.createElement('button'); lockBtn.id = 'opcLockBtn'; lockBtn.className = 'opc'; lockBtn.type = 'button';
      lockBtn.textContent = '🔒'; lockBtn.title = 'Parents / הורים'; lockBtn.setAttribute('aria-label', 'Parents');
      lockBtn.addEventListener('click', openParent); document.body.appendChild(lockBtn);
    }
  }
  function sayRemaining() {
    const r = remaining(), m = Math.ceil(r / 60);
    if (lockReason()) return say('נגמר הזמן להיום. נתראה מחר!');
    say(m <= 1 ? 'נשארה לך עוד דקה אחת משחק' : `נשארו לך עוד ${numHe(m)} משחק`);
  }
  function renderBadge(c, d) {
    if (!badge) return;
    if (!c.on) { badge.className = 'opc off'; return; }
    const r = remaining(c, d), m = Math.ceil(r / 60);
    badge.className = 'opc ' + (r <= 300 ? 'low' + (r <= 60 ? ' pulse' : '') : r <= 900 ? 'mid' : '');
    badge.textContent = '⏳ ' + (r < 60 ? `0:${pad(Math.floor(r))}` : m + '′');
  }
  function warn(n) {
    const txt = n === 5 ? 'עוד 5 דקות!' : 'עוד דקה אחת!';
    warnEl.innerHTML = `<div class="big">⚡🐭⏳</div><div>${txt}</div><div style="font-size:22px">פיקאצ'ו מתחיל להתעייף 😴</div>`;
    warnEl.classList.add('show'); setTimeout(() => warnEl.classList.remove('show'), 5000);
    say(n === 5 ? "פיקאצ'ו אומר: נשארו עוד חמש דקות משחק להיום. בוא נסיים יפה!" : "פיקאצ'ו אומר: נשארה עוד דקה אחת. מתכוננים להגיד לילה טוב!");
  }
  function lockHTML(reason) {
    const t = reason === 'hours'
      ? ['עכשיו זמן מנוחה 🌙', "פיקאצ'ו ישן עכשיו. נשחק בשעה אחרת!"]
      : reason === 'stop' ? ['הזמן נגמר 😴', "פיקאצ'ו הלך לישון. נתראה מחר!"]
        : ['נגמר הזמן להיום, נתראה מחר!', "פיקאצ'ו הלך לישון 😴 ⚡"];
    return `<div class="stars">✨ ⭐ ✨<br><br>⭐<span style="float:left">✨</span></div>${SLEEP_SVG}<h1>${t[0]}</h1><p>${t[1]}</p><p style="font-size:40px">🌙 ⭐ 🛏️</p><button class="par" type="button">🔒 Parents · הורים</button>`;
  }
  function applyLock(reason) {
    if (reason && (!lockEl || !lockEl.isConnected || locked !== reason)) {
      if (lockEl) lockEl.remove();
      lockEl = document.createElement('div'); lockEl.id = 'opcLock'; lockEl.className = 'opc'; lockEl.setAttribute('role', 'dialog'); lockEl.setAttribute('aria-modal', 'true');
      lockEl.innerHTML = lockHTML(reason);
      lockEl.querySelector('.par').addEventListener('click', openParent);
      document.body.appendChild(lockEl);
      if (locked !== reason) // speak once each time the lock appears on this page
        setTimeout(() => say(reason === 'hours' ? "עכשיו זמן מנוחה. פיקאצ'ו ישן. נשחק אחר כך!" : "נגמר הזמן להיום. פיקאצ'ו הלך לישון. נתראה מחר, עומר!"), 300);
      locked = reason;
    }
    if (reason) {
      // make sure nothing sits above or hides the lock (re-applied every check)
      const s = lockEl.style; s.setProperty('display', 'flex', 'important'); s.setProperty('z-index', String(Z), 'important'); s.setProperty('visibility', 'visible', 'important'); s.setProperty('opacity', '1', 'important');
      if (lockEl.nextElementSibling && !ours(lockEl.nextElementSibling)) document.body.appendChild(lockEl);
      [...document.body.children].forEach(n => { if (!ours(n) && n.tagName !== 'SCRIPT' && !n.inert) { n.inert = true; inerted.push(n); } });
      document.querySelectorAll('audio,video').forEach(m => { try { m.pause(); } catch (e) {} });
    } else if (locked) {
      locked = null; if (lockEl) lockEl.remove(); lockEl = null;
      inerted.forEach(n => { n.inert = false; }); inerted = [];
    }
  }
  // block keyboard / pointer input reaching the game while locked (capture phase on window runs first)
  ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchmove', 'touchend', 'wheel', 'contextmenu'].forEach(t =>
    addEventListener(t, e => { if (locked && !ours(e.target)) { e.stopImmediatePropagation(); if (e.cancelable && t !== 'pointermove') e.preventDefault(); } }, { capture: true, passive: false }));

  // ---------- counting ----------
  let lastTick = Date.now(), lastAct = Date.now();
  ['pointerdown', 'keydown', 'touchstart', 'wheel', 'pointermove'].forEach(t => addEventListener(t, () => { lastAct = Date.now(); }, { capture: true, passive: true }));
  function releaseHb() { const hb = ls.get(HBK, null); if (hb && hb.id === tabId) ls.set(HBK, { id: tabId, t: 0 }); }
  function tick() {
    const now = Date.now(), c = cfg();
    let d = day();
    const visible = document.visibilityState === 'visible';
    if (c.on && !IS_MENU && visible && !lockReason(c, d) && now - lastAct < IDLE) {
      // only one tab (the "leader", holding a fresh heartbeat) writes the counter – localStorage is not atomic across tabs
      const hb = ls.get(HBK, null);
      if (!hb || hb.id === tabId || now - hb.t > HB_STALE) {
        ls.set(HBK, { id: tabId, t: now });
        const dt = hb && hb.id === tabId ? Math.min(now - lastTick, MAXSTEP) : 0;
        if (dt > 0) {
          const before = remaining(c, d);
          d.used = Math.round((d.used + dt / 1000) * 10) / 10; d.games[APP] = Math.round(((d.games[APP] || 0) + dt / 1000) * 10) / 10;
          const after = remaining(c, d);
          [5, 1].forEach(n => { if (before > n * 60 && after <= n * 60 && !d.warned[n]) { d.warned[n] = 1; warn(n); } });
          saveDay(d);
        }
      }
    } else releaseHb();
    lastTick = now;
    d = day();
    renderBadge(c, d);
    applyLock(lockReason(c, d));
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') { tick(); releaseHb(); } lastTick = Date.now(); if (document.visibilityState === 'visible') { lastAct = Date.now(); tick(); } });
  addEventListener('storage', e => { if (e.key && e.key.startsWith('omerPC') && e.key !== HBK) { const c = cfg(), d = day(); renderBadge(c, d); applyLock(lockReason(c, d)); } });
  addEventListener('pagehide', releaseHb);
  addEventListener('pageshow', () => { lastTick = Date.now(); tick(); });

  // ---------- PIN ----------
  const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  async function hash(pin, salt) {
    const data = new TextEncoder().encode('omer-pc:' + salt + ':' + pin);
    if (crypto.subtle) return hex(await crypto.subtle.digest('SHA-256', data));
    throw new Error('SubtleCrypto needs https');
  }
  function closeModal() { if (modal) modal.remove(); modal = null; tick(); }
  function showModal(html) {
    if (modal) modal.remove();
    modal = document.createElement('div'); modal.id = 'opcModal'; modal.className = 'opc';
    modal.innerHTML = `<div class="box"><button class="x" type="button" aria-label="close">✖</button>${html}</div>`;
    modal.querySelector('.x').addEventListener('click', closeModal);
    document.body.appendChild(modal); return modal;
  }
  function openParent() {
    const c = cfg();
    if (!c.pin) return setupPin(false);
    const wait = c.lockUntil - Date.now();
    const m = showModal(`<h2>🔒 Parents · הורים</h2><div>Enter your 4-digit PIN</div><div class="he">הקישו קוד הורים (4 ספרות)</div>
      <div style="text-align:center;margin:10px 0"><input class="pin" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off"></div>
      <div style="text-align:center"><button class="b g ok" type="button">Open</button></div><div class="msg"></div>
      <details style="font-size:13px;color:#777;margin-top:8px"><summary>Forgot PIN?</summary>Clearing this site's data in the browser settings (Site settings → lupovichran.github.io → Clear data) resets the PIN, the limit and the games' saved progress.</details>`);
    const inp = m.querySelector('input'), msg = m.querySelector('.msg');
    if (wait > 0) { msg.textContent = `Too many wrong tries. Try again in ${Math.ceil(wait / 1000)} s.`; inp.disabled = true; setTimeout(() => modal === m && openParent(), wait + 200); return; }
    const go = async () => {
      const cc = cfg(); if (cc.lockUntil > Date.now()) return openParent();
      if (!/^\d{4}$/.test(inp.value)) { msg.textContent = 'Enter 4 digits'; return; }
      let h; try { h = await hash(inp.value, cc.salt); } catch (e) { msg.textContent = e.message; return; }
      if (h === cc.pin) { cc.fails = 0; saveCfg(cc); panel(); }
      else {
        cc.fails = (cc.fails || 0) + 1;
        if (cc.fails >= 5) { cc.lockUntil = Date.now() + 120000; cc.fails = 0; saveCfg(cc); return openParent(); }
        saveCfg(cc); msg.textContent = `Wrong PIN (${5 - cc.fails} tries left)`; inp.value = ''; inp.focus();
      }
    };
    m.querySelector('.ok').addEventListener('click', go);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 4); if (inp.value.length === 4) go(); });
    setTimeout(() => inp.focus(), 50);
  }
  function setupPin(change) {
    const m = showModal(`<h2>🔒 ${change ? 'Change' : 'Create a'} parent PIN</h2><div class="he">${change ? 'שינוי קוד הורים' : 'יצירת קוד הורים – 4 ספרות'}</div>
      <div style="margin-top:8px">Daily play limit is <b>on</b> (${cfg().limit} min). Choose a 4-digit PIN that only parents know.</div>
      <div style="text-align:center;margin:10px 0">New PIN<br><input class="pin p1" inputmode="numeric" maxlength="4" autocomplete="off"><br>Repeat<br><input class="pin p2" inputmode="numeric" maxlength="4" autocomplete="off"></div>
      <div style="text-align:center"><button class="b g ok" type="button">Save PIN</button></div><div class="msg"></div>`);
    const p1 = m.querySelector('.p1'), p2 = m.querySelector('.p2'), msg = m.querySelector('.msg');
    [p1, p2].forEach(i => i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, '').slice(0, 4); }));
    m.querySelector('.ok').addEventListener('click', async () => {
      if (!/^\d{4}$/.test(p1.value)) { msg.textContent = 'PIN must be exactly 4 digits'; return; }
      if (p1.value !== p2.value) { msg.textContent = "PINs don't match"; return; }
      const c = cfg(); const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      try { c.pin = await hash(p1.value, salt); } catch (e) { msg.textContent = e.message; return; }
      c.salt = salt; c.fails = 0; c.lockUntil = 0; saveCfg(c); panel('PIN saved ✔');
    });
    setTimeout(() => p1.focus(), 50);
  }
  const fmt = s => { s = Math.round(s); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${pad(s % 60)}s`; };
  function panel(note) {
    const c = cfg(), d = day(), names = ls.get(NAMESK, {}), r = remaining(c, d), B = budget(c, d);
    const rows = Object.entries(d.games).sort((a, b) => b[1] - a[1]).map(([g, s]) => `<tr><td>${(names[g] || g).replace(/</g, '&lt;')}</td><td>${fmt(s)}</td></tr>`).join('') || '<tr><td colspan="2" style="color:#888">No play yet today</td></tr>';
    const reason = lockReason(c, d);
    const m = showModal(`<h2>👨‍👩‍👦 Parent controls · בקרת הורים</h2>${note ? `<div style="color:#2e7d32;font-weight:bold">${note}</div>` : ''}
      <div><b>Today:</b> ${fmt(d.used)} played of ${c.limit} min${d.bonus ? ` + ${d.bonus} bonus` : ''} · <b>${c.on ? Math.ceil(r / 60) + ' min left' : 'limit off'}</b>${reason ? ` · <span style="color:#c62828">locked (${reason})</span>` : ''}</div>
      <div class="bar"><i style="width:${Math.min(100, B ? d.used / B * 100 : 100)}%"></i></div>
      <table>${rows}</table>
      <h3>➕ Add time today · זמן בונוס</h3>
      <button class="b g" data-add="10" type="button">+10 min</button><button class="b g" data-add="15" type="button">+15 min</button><button class="b g" data-add="30" type="button">+30 min</button>
      <h3>⏱️ Daily limit · מגבלה יומית</h3>
      <label><input type="checkbox" class="on" ${c.on ? 'checked' : ''}> Limit on</label> &nbsp;
      <input type="number" class="lim" min="5" max="600" step="5" value="${c.limit}" style="width:80px"> min/day <button class="b saveLim" type="button">Save</button>
      <h3>🌙 Allowed hours (optional) · שעות מותרות</h3>
      <label><input type="checkbox" class="win" ${c.win ? 'checked' : ''}> Only between</label>
      <input type="time" class="from" value="${c.from}"> and <input type="time" class="to" value="${c.to}"> <button class="b saveWin" type="button">Save</button>
      <div class="he" style="direction:ltr;text-align:left">Bonus time also allows play outside these hours for that many minutes.</div>
      <h3>⚙️ More</h3>
      <button class="b stopNow" type="button">⏹ End play now</button><button class="b r reset" type="button">↺ Reset today's time</button><button class="b chg" type="button">🔑 Change PIN</button>
      <div style="text-align:center;margin-top:12px"><button class="b g done" type="button">✔ Done</button></div>
      <div class="he" style="direction:ltr;text-align:left;margin-top:8px;font-size:12px">Client-side lock on this device/browser. For hard enforcement use iOS Screen Time or Google Family Link.</div>`);
    m.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.add, dd = day(); dd.bonus += n; dd.stop = false; dd.override = Math.max(Date.now(), dd.override || 0) + n * 60000;
      const rr = remaining(cfg(), dd); [5, 1].forEach(k => { if (rr > k * 60) delete dd.warned[k]; });
      saveDay(dd); panel(`+${n} min added ✔`);
    }));
    m.querySelector('.saveLim').addEventListener('click', () => {
      const cc = cfg(); const v = Math.round(+m.querySelector('.lim').value);
      if (!(v >= 5 && v <= 600)) { alert('Limit must be 5–600 minutes'); return; }
      cc.limit = v; cc.on = m.querySelector('.on').checked; saveCfg(cc);
      const dd = day(), rr = remaining(cc, dd); [5, 1].forEach(k => { if (rr > k * 60) delete dd.warned[k]; }); saveDay(dd);
      panel('Limit saved ✔');
    });
    m.querySelector('.on').addEventListener('change', e => { const cc = cfg(); cc.on = e.target.checked; saveCfg(cc); panel(cc.on ? 'Limit on' : 'Limit off'); });
    m.querySelector('.saveWin').addEventListener('click', () => { const cc = cfg(); cc.win = m.querySelector('.win').checked; cc.from = m.querySelector('.from').value || '07:00'; cc.to = m.querySelector('.to').value || '20:00'; saveCfg(cc); panel('Hours saved ✔'); });
    m.querySelector('.stopNow').addEventListener('click', () => { const dd = day(); dd.stop = true; saveDay(dd); closeModal(); });
    m.querySelector('.reset').addEventListener('click', () => { if (confirm("Reset today's play time to 0?")) { const dd = day(); ls.set(DAYK + dayKey(), { used: 0, games: {}, bonus: 0, warned: {}, stop: false, override: dd.override }); panel("Today's time reset ✔"); } });
    m.querySelector('.chg').addEventListener('click', () => setupPin(true));
    m.querySelector('.done').addEventListener('click', closeModal);
    tick();
  }

  function start() {
    build(); tick();
    setInterval(tick, TICK);
    setInterval(() => { // self-heal: badge/lock removed or hidden by a game or devtools
      if (badge && !badge.isConnected) document.body.appendChild(badge);
      if (warnEl && !warnEl.isConnected) document.body.appendChild(warnEl);
      if (lockBtn && !lockBtn.isConnected) document.body.appendChild(lockBtn);
      if (!document.getElementById('opcCss')) document.head.appendChild(st);
      applyLock(lockReason());
    }, 1000);
  }
  window.omerParental = { remaining: () => remaining(), reason: () => lockReason(), tick, open: openParent, dayKey };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
