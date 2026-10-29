/* Omer games – shared polish kit ("juice"): font, sounds, music, confetti, character, rewards.
   Load (NOT deferred) in <head> via the PWA block, so game scripts can use window.OJ right away.
   All art is original (simple SVG / emoji). Everything degrades silently (no audio / no speech). */
(function () {
  if (window.OJ) return;
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/juice\.js.*$/, '');
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const PREF = Object.assign({ music: true, sfx: true }, LS.get('omerJ', {}));
  const savePref = () => LS.set('omerJ', PREF);
  const isMenu = /^(\/omer-games)?\/(index\.html)?$/.test(location.pathname);

  /* ---------------- CSS ---------------- */
  const css = `
@font-face{font-family:"OJ Rubik";src:url(${BASE}fonts/rubik-hebrew.woff2) format("woff2");font-weight:300 900;font-display:swap;unicode-range:U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}
@font-face{font-family:"OJ Rubik";src:url(${BASE}fonts/rubik-latin.woff2) format("woff2");font-weight:300 900;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
:root{--oj-font:"OJ Rubik","Rubik","Varela Round","Arial Rounded MT Bold",system-ui,Arial,sans-serif;--oj-yel:#ffd43b;--oj-blue:#3b4cca;--oj-red:#ff5a5f;--oj-green:#35c46a;--oj-ink:#2b2d42}
body,button,input,select,.opc,.opc *{font-family:var(--oj-font)!important}
body{animation:ojIn .45s ease-out both}
@keyframes ojIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.oj-enter{animation:ojEnter .38s cubic-bezier(.2,.9,.3,1.2) both}
@keyframes ojEnter{from{opacity:0;transform:scale(.94) translateY(14px)}to{opacity:1;transform:none}}
.oj-shake{animation:ojShake .45s ease both}
@keyframes ojShake{0%,100%{translate:0}20%{translate:-9px}40%{translate:8px}60%{translate:-6px}80%{translate:4px}}
.oj-bounce{animation:ojBounce .5s cubic-bezier(.3,1.6,.5,1) both}
@keyframes ojBounce{0%{scale:1}35%{scale:1.22}70%{scale:.95}100%{scale:1}}
.oj-glow{box-shadow:0 0 0 5px #fff,0 0 0 10px #35c46a,0 0 30px #35c46a!important}
#ojFx{position:fixed;inset:0;pointer-events:none;z-index:2147482000}
#ojMusic{position:fixed;bottom:10px;right:${isMenu ? 58 : 10}px;z-index:2147481000;width:46px;height:46px;border-radius:50%;border:3px solid #fff;background:linear-gradient(#7c8cff,#3b4cca);color:#fff;font-size:22px;box-shadow:0 4px 10px rgba(0,0,0,.25);cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;opacity:.9}
#ojMusic.off{background:linear-gradient(#bbb,#888)}
.oj-ov{position:fixed;inset:0;z-index:2147480000;display:flex;align-items:center;justify-content:center;padding:14px;background:radial-gradient(circle at 50% 40%,rgba(255,240,170,.92),rgba(255,170,60,.9) 55%,rgba(200,80,40,.92));direction:rtl;animation:ojFade .3s both}
.oj-ov.blue{background:radial-gradient(circle at 50% 40%,rgba(190,215,255,.95),rgba(80,110,230,.93) 60%,rgba(30,40,120,.95))}
@keyframes ojFade{from{opacity:0}to{opacity:1}}
.oj-card{background:linear-gradient(#fff,#fff8e1);border-radius:34px;border:6px solid #fff;box-shadow:0 18px 40px rgba(0,0,0,.3),inset 0 -8px 0 rgba(0,0,0,.06);padding:18px 18px 22px;width:min(520px,94vw);max-height:94vh;overflow:auto;text-align:center;color:var(--oj-ink);animation:ojEnter .45s cubic-bezier(.2,.9,.3,1.3) both;position:relative}
.oj-card h2{margin:4px 0 2px;font-size:clamp(30px,8vw,46px);color:var(--oj-blue);font-weight:800;text-shadow:0 3px 0 #ffe082}
.oj-card p{margin:6px 0;font-size:clamp(20px,5vw,26px);font-weight:600}
.oj-stars{display:flex;justify-content:center;gap:10px;margin:6px 0;direction:ltr}
.oj-stars span{font-size:clamp(50px,13vw,72px);filter:grayscale(1) opacity(.35);transform:scale(.4);transition:all .45s cubic-bezier(.3,1.8,.5,1)}
.oj-stars span.on{filter:drop-shadow(0 4px 0 #e0a800);transform:scale(1) rotate(-8deg)}
.oj-stars span.on:nth-child(2){transform:scale(1.18) translateY(-10px)}
.oj-btn{font-family:inherit;font-size:clamp(26px,7vw,36px);font-weight:800;padding:14px 40px;border:5px solid #fff;border-radius:999px;color:#fff;background:linear-gradient(#ff7b7f,#ff4b55);box-shadow:0 7px 0 #b3262e,0 10px 20px rgba(0,0,0,.2);cursor:pointer;margin:8px 6px 0;min-height:64px}
.oj-btn.green{background:linear-gradient(#5be38c,#22a957);box-shadow:0 7px 0 #137a3b,0 10px 20px rgba(0,0,0,.2)}
.oj-btn.blue{background:linear-gradient(#7c8cff,#3b4cca);box-shadow:0 7px 0 #1f2a8a,0 10px 20px rgba(0,0,0,.2)}
.oj-btn.small{font-size:24px;padding:8px 22px;min-height:54px}
.oj-btn:active{translate:0 5px}
.oj-sticker{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:150px;height:170px;border-radius:26px;background:linear-gradient(135deg,#fff,#e3f2fd);border:5px dashed #64b5f6;margin:8px auto 0;animation:ojFlip .8s .5s cubic-bezier(.3,1.5,.5,1) both}
.oj-sticker b{font-size:86px;line-height:1.1;filter:drop-shadow(0 5px 3px rgba(0,0,0,.2))}
.oj-sticker small{font-size:20px;font-weight:700;color:#1565c0}
.oj-sticker.gold{background:linear-gradient(135deg,#fff8d0,#ffd54f);border-color:#ffb300}
@keyframes ojFlip{from{transform:rotateY(90deg) scale(.5)}to{transform:none}}
.oj-pika{display:block;margin:0 auto;overflow:visible}
.oj-pika .ojb{transform-origin:100px 200px;animation:ojBob 2.2s ease-in-out infinite}
.oj-pika.cheer .ojb{animation:ojJump .7s ease-in-out infinite}
.oj-pika .ojel{transform-origin:72px 62px;animation:ojEarL 3s ease-in-out infinite}
.oj-pika .ojer{transform-origin:128px 62px;animation:ojEarR 3s ease-in-out infinite}
.oj-pika .ojt{transform-origin:150px 168px;animation:ojTail 1.6s ease-in-out infinite}
@keyframes ojBob{50%{transform:translateY(-5px) scale(1.01,.99)}}
@keyframes ojJump{0%,100%{transform:translateY(0) scale(1.03,.97)}50%{transform:translateY(-22px) scale(.98,1.03)}}
@keyframes ojEarL{0%,80%,100%{transform:rotate(0)}88%{transform:rotate(-9deg)}}
@keyframes ojEarR{0%,84%,100%{transform:rotate(0)}92%{transform:rotate(9deg)}}
@keyframes ojTail{50%{transform:rotate(8deg)}}
#ojMascot{position:fixed;bottom:64px;left:8px;z-index:2147479000;display:flex;align-items:flex-end;gap:4px;pointer-events:none;direction:rtl;transition:transform .4s cubic-bezier(.3,1.5,.5,1),opacity .3s;transform:translateY(140%);opacity:0}
#ojMascot.on{transform:none;opacity:1}
#ojMascot .bub{background:#fff;border-radius:22px;padding:10px 16px;font-size:24px;font-weight:800;color:var(--oj-blue);box-shadow:0 6px 16px rgba(0,0,0,.2);max-width:56vw;margin-bottom:60px;border:4px solid #ffd43b}
.oj-map{position:relative;display:grid;grid-template-columns:repeat(var(--cols,4),1fr);gap:clamp(12px,3.5vw,26px) clamp(8px,3vw,22px);width:min(560px,96vw);margin:6px auto;direction:ltr;padding:8px}
.oj-map svg.path{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.oj-node{position:relative;justify-self:center;width:clamp(64px,18vw,92px);height:clamp(64px,18vw,92px);border-radius:50%;border:5px solid #fff;background:radial-gradient(circle at 35% 30%,#fff7c2,#ffd43b 60%,#f2a900);box-shadow:0 6px 0 #c98a00,0 10px 16px rgba(0,0,0,.22);font-size:clamp(28px,8vw,40px);font-weight:800;color:#6b4300;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;z-index:1}
.oj-node.lock{background:radial-gradient(circle at 35% 30%,#f4f4f4,#c7c7c7 65%,#9e9e9e);box-shadow:0 6px 0 #777;color:#777;cursor:default}
.oj-node.done{background:radial-gradient(circle at 35% 30%,#d9ffe6,#5be38c 60%,#22a957);box-shadow:0 6px 0 #137a3b,0 10px 16px rgba(0,0,0,.22);color:#fff;text-shadow:0 2px 0 #137a3b}
.oj-node.cur{animation:ojPulse 1.1s ease-in-out infinite alternate}
@keyframes ojPulse{to{scale:1.1;box-shadow:0 6px 0 #c98a00,0 0 0 8px rgba(255,255,255,.7),0 0 28px #fff59d}}
.oj-node .st{position:absolute;bottom:-24px;left:50%;transform:translateX(-50%);font-size:17px;white-space:nowrap;letter-spacing:-2px;text-shadow:0 1px 0 #fff}
.oj-node .ic{font-size:.8em}
.oj-node .me{position:absolute;top:-30px;font-size:30px;animation:ojBob 1.4s infinite}
.oj-album{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:10px;margin:10px 0}
.oj-album div{aspect-ratio:1;border-radius:20px;background:#f1f5ff;border:3px solid #dfe6ff;display:flex;align-items:center;justify-content:center;font-size:44px;position:relative}
.oj-album div.no{filter:grayscale(1) brightness(1.6) opacity(.35)}
.oj-album div.gold{background:linear-gradient(135deg,#fff8d0,#ffd54f);border-color:#ffb300}
.oj-album div i{position:absolute;bottom:2px;left:6px;font-size:14px;font-style:normal;font-weight:800;color:#3b4cca}
.oj-x{position:absolute;top:10px;left:10px;width:54px;height:54px;border-radius:50%;border:none;background:#ffebee;font-size:26px;cursor:pointer}
.oj-help{width:56px;height:56px;border-radius:50%;border:4px solid #fff;background:linear-gradient(#7c8cff,#3b4cca);color:#fff;font-size:28px;font-weight:800;box-shadow:0 4px 0 #1f2a8a;cursor:pointer;padding:0}
.oj-pic{font-size:clamp(70px,20vw,110px);line-height:1.15;margin:4px 0}
.oj-dots{display:flex;gap:8px;justify-content:center;margin-top:8px}.oj-dots i{width:14px;height:14px;border-radius:50%;background:#ddd}.oj-dots i.on{background:#3b4cca}
@media (prefers-reduced-motion:reduce){.oj-pika *,.oj-node.cur{animation:none!important}}
`;
  function addCss() { if (document.getElementById('ojCss')) return; const s = document.createElement('style'); s.id = 'ojCss'; s.textContent = css; (document.head || document.documentElement).appendChild(s); }
  addCss();

  /* ---------------- audio ---------------- */
  let AC = null, master = null, musicBus = null;
  function ac() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        master = AC.createGain(); master.gain.value = 1; master.connect(AC.destination);
        musicBus = AC.createGain(); musicBus.gain.value = 0;
        const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
        musicBus.connect(lp).connect(master);
      } catch (e) { AC = null; }
    }
    if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
    return AC;
  }
  function note(f, dur, o = {}) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + (o.delay || 0), type = o.type || 'sine', vol = o.vol == null ? .18 : o.vol;
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 6; lg.gain.value = o.vib; l.connect(lg).connect(osc.frequency); l.start(t); l.stop(t + dur + .1); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.att || .012)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(o.bus || master); osc.start(t); osc.stop(t + dur + .05);
  }
  function bell(f, delay = 0, vol = .14, dur = .6) { note(f, dur, { delay, vol, type: 'sine' }); note(f * 2, dur * .6, { delay, vol: vol * .35, type: 'sine' }); note(f * 3.01, dur * .3, { delay, vol: vol * .12, type: 'triangle' }); }
  function noise(dur, vol = .12, delay = 0, freq = 1800) {
    const a = ac(); if (!a) return; const t = a.currentTime + delay;
    const b = a.createBuffer(1, Math.max(1, a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = .8;
    const g = a.createGain(); g.gain.value = vol; s.connect(f).connect(g).connect(master); s.start(t);
  }
  const SFX = {
    tap() { note(720, .07, { type: 'triangle', vol: .1, to: 900 }); },
    pop() { note(380, .12, { type: 'sine', vol: .22, to: 980 }); noise(.05, .05, 0, 3000); },
    good() { bell(784); bell(1175, .09); bell(1568, .18, .1); },
    great() { [659, 784, 988, 1319].forEach((f, i) => bell(f, i * .08, .13)); noise(.25, .04, .2, 6000); },
    bad() { note(330, .16, { type: 'triangle', vol: .14, to: 260 }); note(262, .22, { type: 'triangle', vol: .12, delay: .13, to: 220 }); },
    star() { [1047, 1319, 1568].forEach((f, i) => bell(f, i * .06, .11, .4)); },
    whoosh() { noise(.35, .09, 0, 900); },
    sticker() { [523, 784, 1047, 1568, 2093].forEach((f, i) => bell(f, i * .07, .1, .5)); },
    levelup() { const m = [523, 659, 784, 1047, 0, 784, 1047]; m.forEach((f, i) => f && note(f, .22, { type: 'triangle', vol: .17, delay: i * .11, vib: 4 })); [262, 330, 392].forEach(f => note(f, 1.1, { type: 'sine', vol: .06, delay: .66 })); bell(2093, .8, .08, .9); },
    cheer() { note(900, .13, { vol: .14, to: 1300 }); note(1100, .28, { vol: .14, delay: .14, to: 750 }); }
  };
  function sfx(n) { if (!PREF.sfx) return; try { (SFX[n] || SFX.tap)(); } catch (e) {} }

  /* ---------------- background music (soft, generated) ---------------- */
  const PROG = [[262, 330, 392, 523], [220, 262, 330, 440], [175, 220, 262, 349], [196, 247, 294, 392]];
  const MEL = [523, 587, 659, 784, 880, 784, 659, 587];
  let mTimer = null, mNext = 0, mStep = 0, duck = 1;
  function musicLevel() { return PREF.music && !document.hidden && !lockedNow() ? .55 * duck : 0; }
  function lockedNow() { const l = document.getElementById('opcLock'); return !!(l && l.offsetParent !== null); }
  function setMusicGain() { if (!AC || !musicBus) return; const t = AC.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(musicLevel(), t, .4); }
  function scheduleMusic() {
    const a = AC; if (!a) return; const beat = 60 / 84 / 2;
    if (mNext < a.currentTime) mNext = a.currentTime + .1;
    while (mNext < a.currentTime + 1.2) {
      const bar = Math.floor(mStep / 8) % 4, s = mStep % 8, ch = PROG[bar];
      note(ch[[0, 2, 1, 3, 2, 1, 3, 2][s]], beat * 1.8, { delay: mNext - a.currentTime, vol: .055, type: 'triangle', bus: musicBus });
      if (s === 0) note(ch[0] / 2, beat * 7, { delay: mNext - a.currentTime, vol: .06, type: 'sine', bus: musicBus, att: .08 });
      if (mStep % 32 >= 16 && (s === 0 || s === 3 || s === 6)) note(MEL[(mStep * 3 + bar) % 8], beat * 2.4, { delay: mNext - a.currentTime, vol: .035, type: 'sine', bus: musicBus, att: .05 });
      mNext += beat; mStep++;
    }
  }
  function musicOn() { if (!PREF.music) return; if (!ac()) return; if (!mTimer) { mTimer = setInterval(() => { scheduleMusic(); setMusicGain(); }, 300); } setMusicGain(); }
  function musicOff() { setMusicGain(); if (mTimer) { clearInterval(mTimer); mTimer = null; } }
  document.addEventListener('visibilitychange', setMusicGain);
  // duck music while speech is playing
  if (window.speechSynthesis) {
    try {
      const sp = speechSynthesis.speak.bind(speechSynthesis);
      speechSynthesis.speak = function (u) {
        try { duck = .25; setMusicGain(); const end = () => { setTimeout(() => { if (!speechSynthesis.speaking) { duck = 1; setMusicGain(); } }, 200); }; u.addEventListener('end', end); u.addEventListener('error', end); } catch (e) {}
        return sp(u);
      };
    } catch (e) {}
  }
  function musicButton() {
    if (document.getElementById('ojMusic') || window.OJ_NO_MUSIC_BTN) return;
    const b = document.createElement('button'); b.id = 'ojMusic'; b.setAttribute('aria-label', 'מוזיקה');
    const paint = () => { b.textContent = PREF.music ? '🎵' : '🔇'; b.classList.toggle('off', !PREF.music); };
    paint();
    b.addEventListener('click', e => { e.stopPropagation(); PREF.music = !PREF.music; savePref(); paint(); if (PREF.music) musicOn(); else musicOff(); sfx('tap'); });
    document.body.appendChild(b);
  }
  // start audio on first gesture (autoplay rules)
  const firstGesture = () => { ac(); musicOn(); removeEventListener('pointerdown', firstGesture, true); removeEventListener('keydown', firstGesture, true); };
  addEventListener('pointerdown', firstGesture, true); addEventListener('keydown', firstGesture, true);

  /* ---------------- press juice for all buttons ---------------- */
  addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('button,.oj-press,a.box,.opt,.task,.card,.choice,.ch,.big');
    if (!b || b.disabled || !b.animate) return;
    try { b.animate([{ scale: 1 }, { scale: .9 }, { scale: 1.05 }, { scale: 1 }], { duration: 300, easing: 'ease-out' }); } catch (er) {}
  }, true);

  /* ---------------- speech ---------------- */
  let heVoice = null, enVoice = null;
  function voices() { try { const v = speechSynthesis.getVoices(); heVoice = v.find(x => /^he|^iw/i.test(x.lang)) || null; enVoice = v.find(x => /^en[-_]US/i.test(x.lang)) || v.find(x => /^en/i.test(x.lang)) || null; } catch (e) {} }
  if (window.speechSynthesis) { voices(); try { speechSynthesis.addEventListener('voiceschanged', voices); } catch (e) {} }
  function say(t, lang = 'he-IL') {
    return new Promise(res => {
      if (!t || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return res();
      try {
        speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang;
        const v = /^en/.test(lang) ? enVoice : heVoice; if (v) u.voice = v; u.rate = .92; u.pitch = 1.15;
        let done = false; const fin = () => { if (!done) { done = true; res(); } };
        u.onend = fin; u.onerror = fin; setTimeout(fin, 900 + t.length * 110); speechSynthesis.speak(u);
      } catch (e) { res(); }
    });
  }

  /* ---------------- FX canvas: confetti + sparkles ---------------- */
  let fx = null, fctx = null, parts = [], raf = 0;
  function fxCanvas() {
    if (!fx) { fx = document.createElement('canvas'); fx.id = 'ojFx'; document.body.appendChild(fx); fctx = fx.getContext('2d'); }
    const d = Math.min(devicePixelRatio || 1, 2); if (fx.width !== innerWidth * d) { fx.width = innerWidth * d; fx.height = innerHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
    if (fx.parentNode !== document.body || document.body.lastElementChild !== fx) document.body.appendChild(fx);
  }
  const COLS = ['#ff5a5f', '#ffd43b', '#35c46a', '#4dabf7', '#b197fc', '#ff922b', '#f783ac'];
  function run() {
    cancelAnimationFrame(raf); let last = performance.now();
    const step = now => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      fctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(p => (p.life -= dt) > 0);
      for (const p of parts) {
        p.vy += (p.g || 600) * dt; p.vx *= p.drag || .99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        fctx.save(); fctx.globalAlpha = Math.min(1, p.life * 2); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.fillStyle = p.c;
        if (p.k === 'star') { star(fctx, 0, 0, p.s); }
        else if (p.k === 'emoji') { fctx.font = p.s * 2 + 'px serif'; fctx.textAlign = 'center'; fctx.textBaseline = 'middle'; fctx.fillText(p.e, 0, 0); }
        else { fctx.scale(1, Math.abs(Math.cos(p.rot * 2)) * .8 + .2); fctx.fillRect(-p.s, -p.s * .55, p.s * 2, p.s * 1.1); }
        fctx.restore();
      }
      if (parts.length) raf = requestAnimationFrame(step); else fctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    raf = requestAnimationFrame(step);
  }
  function star(c, x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
  function confetti(o = {}) {
    fxCanvas(); const n = o.n || 140, W = innerWidth, H = innerHeight;
    for (let i = 0; i < n; i++) {
      const side = i % 2, x = o.x != null ? o.x : (side ? W * .05 : W * .95), y = o.y != null ? o.y : H * .75;
      const ang = o.x != null ? Math.random() * Math.PI * 2 : (side ? -Math.PI / 2 + .1 + Math.random() * .6 : -Math.PI / 2 - .1 - Math.random() * .6);
      const sp = (o.x != null ? 200 : 700) + Math.random() * 500;
      parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 520, drag: .985, rot: Math.random() * 6, vr: (Math.random() - .5) * 12, s: 5 + Math.random() * 6, c: COLS[i % COLS.length], k: Math.random() < .25 ? 'star' : 'rect', life: 2.2 + Math.random() * 1.2 });
    }
    run();
  }
  function sparkle(target, o = {}) {
    fxCanvas(); let x, y;
    if (target && target.getBoundingClientRect) { const r = target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    else if (target) { x = target.x; y = target.y; } else { x = innerWidth / 2; y = innerHeight / 2; }
    const n = o.n || 18;
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 120 + Math.random() * 260; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, g: 300, drag: .96, rot: 0, vr: (Math.random() - .5) * 6, s: 6 + Math.random() * 6, c: o.color || COLS[i % COLS.length], k: o.emoji ? 'emoji' : 'star', e: o.emoji, life: .7 + Math.random() * .5 }); }
    run();
  }
  function shake(el) { if (!el) return; el.classList.remove('oj-shake'); void el.offsetWidth; el.classList.add('oj-shake'); setTimeout(() => el.classList.remove('oj-shake'), 500); }
  function bounce(el) { if (!el) return; el.classList.remove('oj-bounce'); void el.offsetWidth; el.classList.add('oj-bounce'); setTimeout(() => el.classList.remove('oj-bounce'), 550); }
  function enter(el) { if (!el) return; el.classList.remove('oj-enter'); void el.offsetWidth; el.classList.add('oj-enter'); }

  /* ---------------- original electric-mouse character (SVG) ---------------- */
  let uid = 0;
  function pika(expr = 'happy', size = 160, extra = '') {
    const id = 'oj' + (++uid), Y = `url(#${id}y)`, O = '#5b3a00';
    const eyes = {
      happy: `<ellipse cx="74" cy="92" rx="9" ry="11" fill="#1b1b1b"/><ellipse cx="126" cy="92" rx="9" ry="11" fill="#1b1b1b"/><circle cx="77" cy="87" r="4" fill="#fff"/><circle cx="129" cy="87" r="4" fill="#fff"/>`,
      cheer: `<path d="M63 94 Q74 80 85 94" fill="none" stroke="#1b1b1b" stroke-width="6" stroke-linecap="round"/><path d="M115 94 Q126 80 137 94" fill="none" stroke="#1b1b1b" stroke-width="6" stroke-linecap="round"/>`,
      think: `<ellipse cx="74" cy="90" rx="8" ry="11" fill="#1b1b1b"/><ellipse cx="126" cy="90" rx="8" ry="11" fill="#1b1b1b"/><circle cx="78" cy="84" r="3.5" fill="#fff"/><circle cx="130" cy="84" r="3.5" fill="#fff"/><path d="M62 74 Q72 68 84 73" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      wow: `<circle cx="74" cy="91" r="12" fill="#1b1b1b"/><circle cx="126" cy="91" r="12" fill="#1b1b1b"/><circle cx="78" cy="86" r="5" fill="#fff"/><circle cx="130" cy="86" r="5" fill="#fff"/><circle cx="70" cy="96" r="2" fill="#fff"/><circle cx="122" cy="96" r="2" fill="#fff"/>`,
      oops: `<ellipse cx="74" cy="93" rx="8" ry="10" fill="#1b1b1b"/><ellipse cx="126" cy="93" rx="8" ry="10" fill="#1b1b1b"/><circle cx="77" cy="89" r="3.5" fill="#fff"/><circle cx="129" cy="89" r="3.5" fill="#fff"/><path d="M60 80 L84 74 M140 80 L116 74" stroke="${O}" stroke-width="4" stroke-linecap="round"/><path d="M150 70 q6 10 0 14 q-6 -4 0 -14z" fill="#6ec6ff"/>`,
      sleep: `<path d="M64 94 Q74 100 84 94" fill="none" stroke="#1b1b1b" stroke-width="5" stroke-linecap="round"/><path d="M116 94 Q126 100 136 94" fill="none" stroke="#1b1b1b" stroke-width="5" stroke-linecap="round"/>`
    }[expr] || '';
    const mouth = {
      happy: `<path d="M90 110 Q95 116 100 110 Q105 116 110 110" fill="none" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/><path d="M93 113 Q100 128 107 113 Z" fill="#c0392b"/>`,
      cheer: `<path d="M86 108 Q100 112 114 108 Q112 132 100 134 Q88 132 86 108 Z" fill="#a52a2a" stroke="${O}" stroke-width="3"/><path d="M92 124 Q100 118 108 124 Q104 132 100 132 Q95 132 92 124Z" fill="#ff7a8a"/>`,
      think: `<path d="M93 116 Q101 112 108 117" fill="none" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`,
      wow: `<ellipse cx="100" cy="117" rx="8" ry="10" fill="#a52a2a" stroke="${O}" stroke-width="3"/>`,
      oops: `<path d="M90 118 Q95 113 100 118 Q105 123 110 118" fill="none" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`,
      sleep: `<path d="M95 114 Q100 118 105 114" fill="none" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`
    }[expr] || '';
    const arms = expr === 'cheer'
      ? `<path d="M58 146 Q40 134 30 116" stroke="${O}" stroke-width="15" stroke-linecap="round" fill="none"/><path d="M58 146 Q40 134 30 116" stroke="${Y}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M142 146 Q160 134 170 116" stroke="${O}" stroke-width="15" stroke-linecap="round" fill="none"/><path d="M142 146 Q160 134 170 116" stroke="${Y}" stroke-width="9" stroke-linecap="round" fill="none"/>`
      : expr === 'think' ? `<ellipse cx="80" cy="158" rx="12" ry="9" fill="${Y}" stroke="${O}" stroke-width="3"/><ellipse cx="112" cy="128" rx="11" ry="9" fill="${Y}" stroke="${O}" stroke-width="3"/>`
      : `<ellipse cx="80" cy="160" rx="12" ry="9" fill="${Y}" stroke="${O}" stroke-width="3" transform="rotate(-20 80 160)"/><ellipse cx="120" cy="160" rx="12" ry="9" fill="${Y}" stroke="${O}" stroke-width="3" transform="rotate(20 120 160)"/>`;
    const bubble = expr === 'think' ? `<circle cx="160" cy="44" r="5" fill="#fff" stroke="#9fb3ff" stroke-width="2"/><circle cx="172" cy="28" r="8" fill="#fff" stroke="#9fb3ff" stroke-width="2"/><text x="184" y="18" font-size="26" font-weight="800" fill="#3b4cca" font-family="Arial">?</text>` : expr === 'sleep' ? `<text x="150" y="40" font-size="22" font-weight="800" fill="#3b4cca" font-family="Arial">z</text><text x="166" y="22" font-size="30" font-weight="800" fill="#3b4cca" font-family="Arial">Z</text>` : expr === 'cheer' ? `<text x="18" y="40" font-size="22">✨</text><text x="160" y="36" font-size="22">✨</text>` : '';
    return `<svg class="oj-pika ${expr}" viewBox="-6 -6 212 222" width="${size}" height="${size * 1.05}" aria-hidden="true" ${extra}>
<defs><radialGradient id="${id}y" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#fff38a"/><stop offset=".55" stop-color="#ffd83a"/><stop offset="1" stop-color="#f2b705"/></radialGradient>
<radialGradient id="${id}c" cx="40%" cy="35%" r="60%"><stop offset="0" stop-color="#ff8a80"/><stop offset="1" stop-color="#e53935"/></radialGradient></defs>
<ellipse cx="100" cy="206" rx="52" ry="8" fill="rgba(0,0,0,.18)"/>
<g class="ojb">
<g class="ojt"><path d="M138 178 L168 160 L156 150 L186 126 L170 118 L196 84 L150 112 L164 122 L132 146 L146 154 Z" fill="${Y}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M138 178 L150 170 L144 160 Z" fill="#9a6a00"/></g>
<ellipse cx="78" cy="200" rx="17" ry="8" fill="${Y}" stroke="${O}" stroke-width="3"/><ellipse cx="122" cy="200" rx="17" ry="8" fill="${Y}" stroke="${O}" stroke-width="3"/>
<ellipse cx="100" cy="160" rx="48" ry="42" fill="${Y}" stroke="${O}" stroke-width="3.5"/>
<path d="M78 172 Q100 182 122 172" stroke="#e0a400" stroke-width="3" fill="none" opacity=".6"/>
<g class="ojel"><path d="M66 66 Q38 30 28 0 Q62 18 86 56 Z" fill="${Y}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M28 0 Q44 10 52 20 Q40 22 36 18 Z" fill="#1b1b1b" stroke="#1b1b1b" stroke-width="3" stroke-linejoin="round"/></g>
<g class="ojer"><path d="M134 66 Q162 30 172 0 Q138 18 114 56 Z" fill="${Y}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M172 0 Q156 10 148 20 Q160 22 164 18 Z" fill="#1b1b1b" stroke="#1b1b1b" stroke-width="3" stroke-linejoin="round"/></g>
<ellipse cx="100" cy="98" rx="62" ry="50" fill="${Y}" stroke="${O}" stroke-width="3.5"/>
<ellipse cx="84" cy="66" rx="20" ry="8" fill="#fff" opacity=".35"/>
<circle cx="56" cy="112" r="12" fill="url(#${id}c)"/><circle cx="144" cy="112" r="12" fill="url(#${id}c)"/>
${eyes}<circle cx="100" cy="104" r="2.6" fill="#1b1b1b"/>${mouth}${arms}
</g>${bubble}</svg>`;
  }

  /* ---------------- mascot reaction bubble ---------------- */
  let mT = 0;
  function mascot(expr, text, o = {}) {
    let m = document.getElementById('ojMascot');
    if (!m) { m = document.createElement('div'); m.id = 'ojMascot'; document.body.appendChild(m); }
    m.innerHTML = pika(expr, o.size || 96) + (text ? `<div class="bub">${text}</div>` : '');
    m.style.bottom = (o.bottom != null ? o.bottom : 64) + 'px';
    requestAnimationFrame(() => m.classList.add('on'));
    if (o.say !== false && text) say(o.speak || text.replace(/<[^>]+>/g, ''));
    clearTimeout(mT); mT = setTimeout(() => m.classList.remove('on'), o.ms || 2200);
  }

  /* ---------------- progress (stars per level) ---------------- */
  const PK = 'omerJ_prog';
  function getStars(game, key) { const p = LS.get(PK, {}); return ((p[game] || {})[key]) || 0; }
  function setStars(game, key, n) { const p = LS.get(PK, {}); p[game] = p[game] || {}; if (n > (p[game][key] || 0)) p[game][key] = n; LS.set(PK, p); return p[game][key]; }
  function totalStars(game) { const p = LS.get(PK, {}); const g = game ? [p[game] || {}] : Object.values(p); return g.reduce((s, o) => s + Object.values(o).reduce((a, b) => a + b, 0), 0); }

  /* ---------------- stickers ---------------- */
  const STICKERS = [
    ['⚡', 'ברק'], ['🌈', 'קשת'], ['🦄', 'חד קרן'], ['🐉', 'דרקון'], ['🦖', 'דינוזאור'], ['🐬', 'דולפין'], ['🦋', 'פרפר'], ['🐢', 'צב'],
    ['🦊', 'שועל'], ['🐼', 'פנדה'], ['🦁', 'אריה'], ['🐧', 'פינגווין'], ['🦉', 'ינשוף'], ['🐙', 'תמנון'], ['🐳', 'לווייתן'], ['🦜', 'תוכי'],
    ['🚀', 'חללית'], ['🪐', 'כוכב לכת'], ['🌙', 'ירח'], ['☀️', 'שמש'], ['☄️', 'כוכב שביט'], ['🛸', 'צלחת מעופפת'], ['🌋', 'הר געש'], ['❄️', 'פתית שלג'],
    ['🚂', 'רכבת'], ['🚒', 'כבאית'], ['🚁', 'מסוק'], ['⛵', 'סירה'], ['🏰', 'טירה'], ['🎡', 'גלגל ענק'], ['🎈', 'בלון'], ['🎁', 'מתנה'],
    ['🍓', 'תות'], ['🍉', 'אבטיח'], ['🍦', 'גלידה'], ['🧁', 'קאפקייק'], ['🍩', 'סופגניה'], ['🍕', 'פיצה'], ['🌻', 'חמנייה'], ['🍄', 'פטרייה'],
    ['🧩', 'פאזל'], ['🔭', 'טלסקופ'], ['🧲', 'מגנט'], ['🔬', 'מיקרוסקופ'], ['🎨', 'צבעים'], ['🥁', 'תוף'], ['🎸', 'גיטרה'], ['🏆', 'גביע']
  ];
  const GOLD = new Set(['⚡', '🦄', '🐉', '🏆', '🛸', '🌈']);
  const SK = 'omerJ_stickers';
  function stickers() { return LS.get(SK, {}); }
  function award(game) {
    const have = stickers(); const missing = STICKERS.filter(s => !have[s[0]]);
    const pool = missing.length && Math.random() < .85 ? missing : STICKERS;
    const s = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !have[s[0]]; have[s[0]] = (have[s[0]] || 0) + 1; LS.set(SK, have);
    return { e: s[0], name: s[1], isNew, gold: GOLD.has(s[0]), count: Object.keys(have).length, total: STICKERS.length, game };
  }
  function stickerCount() { return Object.keys(stickers()).length; }

  /* ---------------- overlays ---------------- */
  function overlay(cls) { const o = document.createElement('div'); o.className = 'oj-ov ' + (cls || ''); o.dir = 'rtl'; document.body.appendChild(o); return o; }
  function close(o) { if (!o || !o.parentNode) return; o.style.transition = 'opacity .25s'; o.style.opacity = 0; setTimeout(() => o.remove(), 260); }

  // celebrate({title, sub, stars (0-3, or null), sticker:true|false, game, button, onDone, again:{label,fn}})
  function celebrate(o = {}) {
    return new Promise(res => {
      const ov = overlay();
      const st = o.sticker ? award(o.game || 'game') : null;
      const stars = o.stars == null ? null : Math.max(0, Math.min(3, o.stars));
      ov.innerHTML = `<div class="oj-card">${pika('cheer', 150)}<h2>${o.title || 'כל הכבוד!'}</h2>${o.sub ? `<p>${o.sub}</p>` : ''}
        ${stars != null ? `<div class="oj-stars"><span>⭐</span><span>⭐</span><span>⭐</span></div>` : ''}
        ${st ? `<p style="margin-top:10px">${st.isNew ? 'מדבקה חדשה לאלבום!' : 'עוד מדבקה לאלבום!'}</p><div class="oj-sticker ${st.gold ? 'gold' : ''}"><b>${st.e}</b><small>${st.name}</small></div><p style="font-size:18px;color:#666">📒 ${st.count} / ${st.total}</p>` : ''}
        <div><button class="oj-btn green" data-k="go">${o.button || 'המשך ▶'}</button>${o.again ? `<button class="oj-btn blue small" data-k="again">${o.again.label}</button>` : ''}</div></div>`;
      sfx('levelup'); confetti();
      setTimeout(() => confetti({ n: 60 }), 700);
      if (stars != null) [...ov.querySelectorAll('.oj-stars span')].forEach((s, i) => { if (i < stars) setTimeout(() => { s.classList.add('on'); sfx('star'); sparkle(s, { n: 10 }); }, 500 + i * 380); });
      if (st) setTimeout(() => sfx('sticker'), 1300);
      let speech = (o.speak || (o.title || 'כל הכבוד!').replace(/<[^>]+>/g, '') + (o.sub ? '. ' + o.sub.replace(/<[^>]+>/g, '') : ''));
      if (st) speech += '. קיבלת מדבקה של ' + st.name;
      say(speech);
      const finish = k => { close(ov); sfx('tap'); if (k === 'again' && o.again) o.again.fn(); else if (o.onDone) o.onDone(); res(k); };
      ov.querySelector('[data-k=go]').onclick = () => finish('go');
      const ag = ov.querySelector('[data-k=again]'); if (ag) ag.onclick = () => finish('again');
    });
  }

  // intro(game, [{pic:'🍓', expr:'happy', text:'...'}], {force}) – spoken step-by-step tutorial; first time only unless force
  function intro(game, steps, o = {}) {
    return new Promise(res => {
      const key = 'omerJ_intro_' + game;
      if (!o.force && LS.get(key, 0)) return res(false);
      const ov = overlay('blue'); let i = 0;
      const paint = () => {
        const s = steps[i];
        ov.innerHTML = `<div class="oj-card">${pika(s.expr || (i === 0 ? 'wow' : 'happy'), 120)}${s.pic ? `<div class="oj-pic">${s.pic}</div>` : ''}<p style="font-size:clamp(22px,5.6vw,30px)">${s.text}</p>
          <div class="oj-dots">${steps.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
          <div><button class="oj-btn blue small" data-k="say">🔊</button><button class="oj-btn green" data-k="next">${i < steps.length - 1 ? 'הבא ◀' : 'יאללה! ▶'}</button></div></div>`;
        say(s.speak || s.text.replace(/<[^>]+>/g, ''));
        ov.querySelector('[data-k=say]').onclick = () => say(s.speak || s.text.replace(/<[^>]+>/g, ''));
        ov.querySelector('[data-k=next]').onclick = () => { sfx('pop'); if (++i < steps.length) paint(); else { LS.set(key, 1); close(ov); try { speechSynthesis.cancel(); } catch (e) {} res(true); } };
      };
      sfx('whoosh'); paint();
    });
  }
  function helpButton(game, steps, o = {}) {
    const b = document.createElement('button'); b.className = 'oj-help'; b.textContent = '?'; b.setAttribute('aria-label', 'הסבר');
    b.onclick = e => { e.stopPropagation(); intro(game, steps, { force: true }); };
    if (o.style) b.style.cssText = o.style;
    return b;
  }

  function album() {
    const ov = overlay('blue'), have = stickers();
    ov.innerHTML = `<div class="oj-card" style="width:min(640px,96vw)"><button class="oj-x" aria-label="סגור">✖</button>${pika('wow', 90)}<h2>📒 האלבום שלי</h2><p>${Object.keys(have).length} מתוך ${STICKERS.length} מדבקות</p>
      <div class="oj-album">${STICKERS.map(s => `<div class="${have[s[0]] ? (GOLD.has(s[0]) ? 'gold' : '') : 'no'}" data-n="${have[s[0]] ? s[1] : ''}">${s[0]}${have[s[0]] > 1 ? `<i>x${have[s[0]]}</i>` : ''}</div>`).join('')}</div>
      <p style="font-size:18px;color:#555">מסיימים שלבים במשחקים ומקבלים מדבקות!</p></div>`;
    ov.querySelector('.oj-x').onclick = () => { sfx('tap'); close(ov); };
    ov.addEventListener('click', e => { const d = e.target.closest('.oj-album div'); if (d) { if (d.dataset.n) { say(d.dataset.n); bounce(d); sfx('pop'); } else { say('עוד לא אספת את המדבקה הזאת'); } } });
    say('האלבום שלי. אספת ' + Object.keys(have).length + ' מדבקות');
  }

  // levelMap(container, {count, unlocked (1-based max playable), stars:i=>0..3, icon:i=>'', current, onPick(i), cols})
  function levelMap(box, o) {
    box.innerHTML = ''; const m = document.createElement('div'); m.className = 'oj-map'; const cols = o.cols || (innerWidth < 420 ? 4 : 5); m.style.setProperty('--cols', cols);
    const n = o.count, nodes = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols, col = r % 2 ? cols - 1 - c : c;  // snake path (LTR grid)
      const b = document.createElement('button'); const lock = i + 1 > o.unlocked, st = o.stars ? o.stars(i) : 0;
      b.className = 'oj-node' + (lock ? ' lock' : st ? ' done' : '') + (i === (o.current != null ? o.current : o.unlocked - 1) && !lock ? ' cur' : '');
      b.style.gridRow = r + 1; b.style.gridColumn = col + 1;
      b.innerHTML = (lock ? '🔒' : (o.icon ? `<span class="ic">${o.icon(i)}</span>` : (i + 1))) + `<span class="st">${lock ? '' : '⭐'.repeat(st) + '☆'.repeat(3 - st)}</span>` + (b.className.includes('cur') ? '<span class="me">⚡</span>' : '');
      b.setAttribute('aria-label', 'שלב ' + (i + 1));
      b.onclick = () => { if (lock) { sfx('bad'); shake(b); say('השלב הזה עוד נעול. קודם מסיימים את השלב הקודם'); return; } sfx('pop'); o.onPick(i); };
      m.appendChild(b); nodes.push(b);
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'path'); m.prepend(svg); box.appendChild(m);
    const draw = () => {
      const R = m.getBoundingClientRect(); if (!R.width) return;
      const pts = nodes.map(b => { const r = b.getBoundingClientRect(); return [r.left - R.left + r.width / 2, r.top - R.top + r.height / 2]; });
      svg.innerHTML = `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 22"/>`;
    };
    requestAnimationFrame(draw); setTimeout(draw, 300); addEventListener('resize', draw);
    return m;
  }

  window.OJ = { say, sfx, confetti, sparkle, shake, bounce, enter, pika, mascot, celebrate, intro, helpButton, album, award, stickers, stickerCount, STICKERS,
    getStars, setStars, totalStars, levelMap, ac, music: { on: musicOn, off: musicOff, get enabled() { return PREF.music; } },
    get sfxOn() { return PREF.sfx; }, set sfxOn(v) { PREF.sfx = !!v; savePref(); }, LS };
  const ready = () => { addCss(); musicButton(); };
  if (document.body) ready(); else document.addEventListener('DOMContentLoaded', ready);
})();
