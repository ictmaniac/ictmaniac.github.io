/* ICT Maniac shared helpers (Chapter 3 labs) */
const IM = (() => {
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Boolean expression parser ----------
     Accepts: A-Z variables, 0/1, + (OR), · . * & (AND), juxtaposition AB (AND),
     ' after a term (NOT), ~ ! ¬ before a term (NOT), ⊕ ^ (XOR), ⊙ (XNOR), ( ) */
  function parse(src) {
    const s = src.replace(/\s+/g, '').replace(/[×∙•]/g, '·').replace(/[’`´]/g, "'").replace(/[–−]/g, '-');
    if (!s) throw new Error('একটি রাশি লেখো।');
    let i = 0;
    const peek = () => s[i];
    const isAtomStart = c => c && (/[A-Za-z01(~!¬]/.test(c));
    function pOr() { let l = pXor(); while (peek() === '+' || peek() === '|') { i++; l = { op: 'OR', a: l, b: pXor() }; } return l; }
    function pXor() { let l = pAnd(); while (peek() === '⊕' || peek() === '^' || peek() === '⊙') { const o = s[i++] === '⊙' ? 'XNOR' : 'XOR'; l = { op: o, a: l, b: pAnd() }; } return l; }
    function pAnd() {
      let l = pNot();
      while (true) {
        if (peek() === '·' || peek() === '.' || peek() === '*' || peek() === '&') { i++; l = { op: 'AND', a: l, b: pNot() }; }
        else if (isAtomStart(peek())) { l = { op: 'AND', a: l, b: pNot() }; }
        else break;
      }
      return l;
    }
    function pNot() {
      if (peek() === '~' || peek() === '!' || peek() === '¬') { i++; return { op: 'NOT', a: pNot() }; }
      let a = pAtom();
      while (peek() === "'") { i++; a = { op: 'NOT', a }; }
      return a;
    }
    function pAtom() {
      const c = peek();
      if (c === undefined) throw new Error('রাশিটি অসম্পূর্ণ। শেষে কিছু বাকি আছে।');
      if (c === '(') { i++; const e = pOr(); if (peek() !== ')') throw new Error('বন্ধনী ")" বন্ধ করা হয়নি।'); i++; return { op: 'P', a: e }; }
      if (c === '0' || c === '1') { i++; return { op: 'C', v: +c }; }
      if (/[A-Za-z]/.test(c)) { i++; return { op: 'V', n: c.toUpperCase() }; }
      throw new Error(`"${c}" চিহ্নটি বুঝতে পারিনি।`);
    }
    const ast = pOr();
    if (i < s.length) throw new Error(`"${s[i]}" এর কাছে ভুল আছে।`);
    const vars = new Set(); (function walk(n) { if (!n) return; if (n.op === 'V') vars.add(n.n); walk(n.a); walk(n.b); })(ast);
    return { ast, vars: [...vars].sort() };
  }
  function ev(n, env) {
    switch (n.op) {
      case 'C': return n.v; case 'V': return env[n.n] ? 1 : 0; case 'P': return ev(n.a, env);
      case 'NOT': return 1 - ev(n.a, env);
      case 'AND': return ev(n.a, env) & ev(n.b, env);
      case 'OR': return ev(n.a, env) | ev(n.b, env);
      case 'XOR': return ev(n.a, env) ^ ev(n.b, env);
      case 'XNOR': return 1 - (ev(n.a, env) ^ ev(n.b, env));
    }
  }
  function show(n) {
    switch (n.op) {
      case 'C': return String(n.v); case 'V': return n.n; case 'P': return '(' + show(n.a) + ')';
      case 'NOT': return (n.a.op === 'V' || n.a.op === 'C' || n.a.op === 'P' || n.a.op === 'NOT') ? show(n.a) + "'" : '(' + show(n.a) + ")'";
      case 'AND': return show(n.a) + '·' + show(n.b);
      case 'OR': return show(n.a) + ' + ' + show(n.b);
      case 'XOR': return show(n.a) + ' ⊕ ' + show(n.b);
      case 'XNOR': return show(n.a) + ' ⊙ ' + show(n.b);
    }
  }
  const rows = n => [...Array(1 << n)].map((_, r) => [...Array(n)].map((_, k) => (r >> (n - 1 - k)) & 1));
  const envOf = (vars, r) => Object.fromEntries(vars.map((v, k) => [v, r[k]]));

  /* ---------- toggles ---------- */
  function toggles(cont, names, st, onChange, label) {
    cont.innerHTML = names.map(n => `<button class="toggle" data-k="${n}" aria-pressed="false"><span class="name">${label ? label(n) : 'ইনপুট ' + n}</span><span class="val">0</span></button>`).join('');
    cont.querySelectorAll('.toggle').forEach(b => b.onclick = () => { st[b.dataset.k] ^= 1; onChange(); });
    return () => cont.querySelectorAll('.toggle').forEach(b => { const v = st[b.dataset.k] ? 1 : 0; b.setAttribute('aria-pressed', !!v); b.querySelector('.val').textContent = v; });
  }

  /* ---------- truth table ---------- */
  function tt(table, vars, cols, st, onPick) {
    table.classList.add('tt');
    const R = rows(vars.length);
    table.innerHTML = `<thead><tr>${vars.map(v => `<th>${v}</th>`).join('')}${cols.map((c, k) => `<th class="${k === 0 ? 'sep' : ''}">${c.h}</th>`).join('')}</tr></thead>
      <tbody>${R.map(r => { const e = envOf(vars, r); return `<tr tabindex="0" data-r="${r.join('')}">${r.map(v => `<td>${v}</td>`).join('')}${cols.map((c, k) => `<td class="y ${k === 0 ? 'sep' : ''} ${c.cls || ''}">${c.f(e)}</td>`).join('')}</tr>`; }).join('')}</tbody>`;
    table.querySelectorAll('tbody tr').forEach(tr => {
      const go = () => { [...tr.dataset.r].forEach((b, k) => st[vars[k]] = +b); onPick && onPick(); };
      tr.onclick = go; tr.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
    return () => table.querySelectorAll('tbody tr').forEach(tr => tr.classList.toggle('active', tr.dataset.r === vars.map(v => st[v] ? 1 : 0).join('')));
  }

  /* ---------- gate shapes (local coords, height h) ---------- */
  const FN = {
    AND: a => a.every(Boolean) ? 1 : 0, OR: a => a.some(Boolean) ? 1 : 0, NOT: a => a[0] ? 0 : 1, BUF: a => a[0] ? 1 : 0,
    NAND: a => a.every(Boolean) ? 0 : 1, NOR: a => a.some(Boolean) ? 0 : 1,
    XOR: a => a.reduce((x, y) => x ^ y, 0), XNOR: a => 1 - a.reduce((x, y) => x ^ y, 0),
  };
  function shape(t, h) {
    const m = h / 2;
    const AND = `M0 0 H26 A${m} ${m} 0 0 1 26 ${h} H0 Z`;
    const OR = `M0 0 Q14 ${m} 0 ${h} Q36 ${h} 58 ${m} Q36 0 0 0 Z`;
    const bub = x => `<circle class="gate-bub" cx="${x}" cy="${m}" r="5"/>`;
    switch (t) {
      case 'AND': return { d: AND, out: 26 + m, pin: 0 };
      case 'NAND': return { d: AND, out: 26 + m + 10, pin: 0, extra: bub(26 + m + 5) };
      case 'OR': return { d: OR, out: 58, pin: 6 };
      case 'NOR': return { d: OR, out: 68, pin: 6, extra: bub(63) };
      case 'XOR': return { d: OR, out: 58, pin: 6, pre: -8, extra: `<path d="M-8 0 Q6 ${m} -8 ${h}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>` };
      case 'XNOR': return { d: OR, out: 68, pin: 6, pre: -8, extra: `<path d="M-8 0 Q6 ${m} -8 ${h}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>` + bub(63) };
      case 'NOT': return { d: `M0 ${m - 18} L0 ${m + 18} L32 ${m} Z`, out: 42, pin: 0, extra: bub(37) };
      case 'BUF': return { d: `M0 ${m - 18} L0 ${m + 18} L32 ${m} Z`, out: 32, pin: 0 };
    }
  }

  /* ---------- circuit renderer ----------
     spec = { vb:[w,h], inputs:[{id,x,y,lbl?}], gates:[{id,t,x,y,h?,in:[src|{s,p:[[x,y]..]}],mx?:[..],lbl?}],
              outputs:[{id,s,x,y,lbl?, p?}], dots:[[x,y,src]], extra:'svg', st:{}, onChange } */
  function circuit(svg, spec) {
    const st = spec.st || {};
    const vals = Object.assign({}, spec.init || {});
    spec.inputs.forEach(i => { if (st[i.id] === undefined) st[i.id] = 0; });
    const pos = {}; // source id -> [x,y]
    spec.inputs.forEach(i => pos[i.id] = [i.x + 40, i.y]);
    const G = spec.gates.map(g => {
      const n = g.in.length, h = g.h || (n > 2 ? n * 15 + 8 : 44), sh = shape(g.t, h);
      pos[g.id] = [g.x + sh.out, g.y + h / 2];
      return { ...g, n, h, sh };
    });
    let wires = '', bodies = '', top = '';
    const wireIds = [];
    const path = (src, pts, end) => {
      const [sx, sy] = pos[src];
      let d = `M${sx} ${sy}`;
      pts.forEach(([x, y]) => d += ` L${x} ${y}`);
      d += ` L${end[0]} ${end[1]}`;
      const k = wireIds.length; wireIds.push(src);
      wires += `<path class="wire" data-w="${k}" d="${d}"/><path class="flow" data-w="${k}" d="${d}"/>`;
    };
    G.forEach(g => {
      g.in.forEach((src0, k) => {
        const src = typeof src0 === 'string' ? src0 : src0.s;
        const py = g.n === 1 ? g.y + g.h / 2 : g.y + g.h * (k + 1) / (g.n + 1);
        const px = g.x + (g.sh.pre !== undefined ? g.sh.pre + 6 : g.sh.pin);
        let pts;
        if (typeof src0 !== 'string' && src0.p) pts = src0.p;
        else { const [sx, sy] = pos[src]; const mx = g.mx && g.mx[k] !== undefined ? g.mx[k] : px - 14; pts = sy === py ? [] : [[mx, sy], [mx, py]]; }
        path(src, pts, [px, py]);
      });
      bodies += `<g transform="translate(${g.x} ${g.y})"><path class="gate-body" d="${g.sh.d}"/>${g.sh.extra || ''}<text class="gate-label" x="${g.t === 'NOT' || g.t === 'BUF' ? 3 : 8}" y="${g.h / 2 + 4}">${g.lbl ?? g.t}</text></g>`;
    });
    (spec.outputs || []).forEach(o => {
      const [sx, sy] = pos[o.s];
      path(o.s, o.p || (sy === o.y ? [] : [[o.x - 30, sy], [o.x - 30, o.y]]), [o.x - 14, o.y]);
      top += `<g class="bulb" data-o="${o.id}"><circle class="bulb-halo" cx="${o.x}" cy="${o.y}" r="22"/><circle class="bulb-glass" cx="${o.x}" cy="${o.y}" r="13"/>
        <text class="lbl" x="${o.x + 18}" y="${o.y + 5}">${o.lbl ?? o.id}</text><text class="bit" data-ob="${o.id}" x="${o.x - 4}" y="${o.y + 5}">0</text></g>`;
    });
    spec.inputs.forEach(i => {
      top += `<g class="sw" data-i="${i.id}" tabindex="0" role="button" aria-label="ইনপুট ${i.lbl ?? i.id} বদলাও">
        <rect x="${i.x}" y="${i.y - 16}" width="40" height="32" rx="8"/>
        <text class="lbl" x="${i.x + 5}" y="${i.y + 5}">${i.lbl ?? i.id}</text><text class="bit" data-ib="${i.id}" x="${i.x + 27}" y="${i.y + 5}">0</text></g>`;
    });
    const dots = (spec.dots || []).map(([x, y, s]) => `<circle class="jdot" data-d="${s}" cx="${x}" cy="${y}" r="4"/>`).join('');
    svg.setAttribute('viewBox', `0 0 ${spec.vb[0]} ${spec.vb[1]}`);
    svg.classList.add('circuit');
    svg.innerHTML = wires + dots + bodies + top + (spec.extra || '');
    function evaluate() {
      spec.inputs.forEach(i => vals[i.id] = st[i.id] ? 1 : 0);
      G.forEach(g => { if (vals[g.id] === undefined) vals[g.id] = 0; });
      for (let pass = 0; pass < 30; pass++) {
        let changed = false;
        G.forEach(g => {
          const v = FN[g.t](g.in.map(s => vals[typeof s === 'string' ? s : s.s]));
          if (v !== vals[g.id]) { vals[g.id] = v; changed = true; }
        });
        if (!changed) break;
      }
      return vals;
    }
    function render() {
      evaluate();
      svg.querySelectorAll('[data-w]').forEach(p => p.classList.toggle('on', !!vals[wireIds[+p.dataset.w]]));
      svg.querySelectorAll('[data-d]').forEach(p => p.classList.toggle('on', !!vals[p.dataset.d]));
      svg.querySelectorAll('.sw').forEach(g => g.classList.toggle('on', !!vals[g.dataset.i]));
      svg.querySelectorAll('[data-ib]').forEach(t => t.textContent = vals[t.dataset.ib]);
      (spec.outputs || []).forEach(o => {
        svg.querySelector(`[data-o="${o.id}"]`).classList.toggle('on', !!vals[o.s]);
        svg.querySelector(`[data-ob="${o.id}"]`).textContent = vals[o.s];
      });
      return vals;
    }
    svg.querySelectorAll('.sw').forEach(g => {
      const f = () => { st[g.dataset.i] ^= 1; spec.onChange ? spec.onChange() : render(); };
      g.addEventListener('click', f);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } });
    });
    return { st, vals, render, evaluate };
  }

  /* ---------- tabs ---------- */
  function tabs(cont, onPick) {
    const b = [...cont.querySelectorAll('.tab')];
    b.forEach(t => t.onclick = () => { b.forEach(x => x.setAttribute('aria-selected', x === t)); onPick(t.dataset.k); });
  }

  /* ---------- 0/1 quiz ---------- */
  function quiz01(root, gen) {
    root.innerHTML = `<h2>আগে অনুমান করো</h2><p class="q-ask"></p>
      <div class="q-btns"><button data-a="0">0</button><button data-a="1">1</button></div>
      <p class="feedback" aria-live="polite"></p>
      <div class="q-foot"><span class="score">স্কোর: 0/0</span><button class="btn primary" style="flex:none">পরের প্রশ্ন</button></div>`;
    let q, right = 0, total = 0;
    const ask = root.querySelector('.q-ask'), fb = root.querySelector('.feedback'), sc = root.querySelector('.score'), bs = root.querySelectorAll('.q-btns button');
    const next = () => { q = gen(); ask.innerHTML = q.ask; fb.textContent = ''; fb.className = 'feedback'; bs.forEach(b => b.disabled = false); };
    bs.forEach(b => b.onclick = () => {
      const v = +b.dataset.a, ok = v === q.ans; total++; if (ok) right++; sfx(ok ? 'ok' : 'no');
      fb.className = 'feedback ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = ok ? `ঠিক! উত্তর ${q.ans}।` : `হয়নি। সঠিক উত্তর ${q.ans}।${q.why ? ' ' + q.why : ''}`;
      sc.textContent = `স্কোর: ${right}/${total}`; bs.forEach(x => x.disabled = true);
      q.after && q.after();
    });
    root.querySelector('.q-foot .btn').onclick = next;
    next();
    return { reset() { right = total = 0; sc.textContent = 'স্কোর: 0/0'; next(); } };
  }
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));


  /* ---------- sound (soft marimba, Web Audio, no files) ---------- */
  const SND = (() => {
    let ac = null, master, dry, rev, NB, on = true; const last = {};
    try { on = localStorage.getItem('im-snd') !== '0'; } catch (e) {}
    function A() { if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C();
        const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(ac.destination);
        master = ac.createGain(); master.gain.value = .45; master.connect(comp); dry = ac.createGain(); dry.connect(master);
        rev = ac.createConvolver(); const len = ac.sampleRate * 1.3, ir = ac.createBuffer(2, len, ac.sampleRate);
        for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
        rev.buffer = ir; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4500; const w = ac.createGain(); w.gain.value = .2; rev.connect(lp).connect(w).connect(master); }
      if (ac.state === 'suspended') ac.resume(); return ac; }
    function out(n, pan, r) { let x = n; if (ac.createStereoPanner && pan) { const p = ac.createStereoPanner(); p.pan.value = pan; n.connect(p); x = p; } x.connect(dry); if (r) { const g = ac.createGain(); g.gain.value = r; x.connect(g).connect(rev); } }
    function env(g, t, pk, at, dc) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + dc); }
    function mallet(f, v, dc, dl, pan) { const t = ac.currentTime + (dl || 0), bus = ac.createGain(); bus.gain.value = v; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 6); bus.connect(lp); out(lp, pan, .8);
      [[1, 1, dc], [3.99, .18, dc * .25], [10, .05, .03]].forEach(([m, g, d]) => { const o = ac.createOscillator(), e = ac.createGain(); o.frequency.value = f * m; env(e, t, g, .004, d); o.connect(e).connect(bus); o.start(t); o.stop(t + d + .1); }); }
    function nbuf() { if (NB) return NB; const n = ac.sampleRate * 1.5; NB = ac.createBuffer(1, n, ac.sampleRate); const d = NB.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * .1848) * .18; } return NB; }
    function air(dur, f1, f2, v, p1, p2, q) { const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = nbuf(); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .9;
      bp.frequency.setValueAtTime(f1, t); bp.frequency.exponentialRampToValueAtTime(f2, t + dur); const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur * .45); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(bp).connect(g); let n = g; if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.setValueAtTime(p1, t); p.pan.linearRampToValueAtTime(p2, t + dur); g.connect(p); n = p; } n.connect(dry); const r = ac.createGain(); r.gain.value = .5; n.connect(r).connect(rev); s.start(t, Math.random()); s.stop(t + dur + .05); }
    function glide(f1, f2, dur, v) { const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); env(g, t, v, dur * .3, dur * .7); o.connect(g); out(g, 0, .8); o.start(t); o.stop(t + dur + .1); }
    function tick(f, v, dl) { const t = ac.currentTime + (dl || 0), s = ac.createBufferSource(); s.buffer = nbuf(); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 3; const g = ac.createGain(); env(g, t, v, .001, .025); s.connect(bp).connect(g); out(g, 0, .2); s.start(t, Math.random()); s.stop(t + .05); }
    const P = {
      step: () => { tick(2500, .1); mallet(1568, .14, .18); },
      back: () => { tick(2000, .08); mallet(1175, .12, .16); },
      pop: i => { glide(320, 880, .07, .13); mallet([1047, 1175, 1319, 1568, 1760][(i || 0) % 5], .09, .15, .03); },
      whoosh: () => air(.5, 350, 2400, .45, -.6, .6),
      zin: () => { air(.42, 300, 3200, .28, 0, 0, 1.4); glide(260, 780, .42, .06); },
      zout: () => { air(.42, 3200, 300, .28, 0, 0, 1.4); glide(780, 260, .42, .06); },
      hl: () => mallet(1319, .15, .28),
      tap: () => { tick(3000, .08); mallet(1760, .08, .12); },
      ok: () => { mallet(1047, .26, .5); mallet(1319, .26, .6, .09); mallet(1568, .22, .8, .18); },
      no: () => { mallet(330, .26, .3); mallet(262, .26, .45, .14); },
      done: () => [523, 659, 784, 1047].forEach((f, i) => mallet(f, .2, .9, i * .1, -.4 + i * .27)),
      type: () => { for (let i = 0; i < 5; i++) tick(1800 + Math.random() * 1500, .14, i * .07); }
    };
    const GAP = { whoosh: 450, pop: 160, hl: 220, step: 60, tap: 80 };
    function play(k, i) { if (!on || !P[k]) return; const now = performance.now(); if (now - (last[k] || 0) < (GAP[k] || 120)) return; last[k] = now;
      try { if (!A()) return; if (ac.state !== 'running') return; P[k](i); } catch (e) {} }
    function unlock() { if (on) try { A(); } catch (e) {} }
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));
    function btn() { const b = document.createElement('button'); b.className = 'sndb'; b.type = 'button';
      const paint = () => { b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-label', on ? 'সাউন্ড বন্ধ করো' : 'সাউন্ড চালু করো'); b.setAttribute('aria-pressed', on); };
      b.onclick = () => { on = !on; try { localStorage.setItem('im-snd', on ? '1' : '0'); } catch (e) {} paint(); if (on) { unlock(); setTimeout(() => play('hl'), 30); } }; paint(); return b; }
    function mount() { if (document.querySelector('.sndb')) return; const sp = document.querySelector('.dock .spd'); const b = btn();
      if (sp) { b.classList.add('in-dock'); sp.appendChild(b); } else { b.classList.add('float'); document.body.appendChild(b); } }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else setTimeout(mount, 0);
    /* generic click sounds for buttons that are not handled elsewhere */
    document.addEventListener('click', e => { if (!e.isTrusted) return; const t = e.target.closest('button,.tab,.toggle,.sw,[data-x],.c,tr[data-r]'); if (!t || t.closest('.dock') || t.closest('.mcq') || t.classList.contains('sndb') || t.closest('.q-btns')) return;
      play(t.matches('[data-x],.c') ? 'hl' : 'tap'); }, true);
    return { play, get on() { return on; } };
  })();
  const sfx = (k, i) => SND.play(k, i); let stepT = 0; const fresh = ms => performance.now() - stepT < ms;

  /* ---------- kit (Ch4+): explain bar, step player, code view, token mover ---------- */
  const bn = x => String(x).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const reduce = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  function say(tag, html, tap) {
    const t = $('extag'), p = $('extx'); if (!t) return;
    t.textContent = (tap ? '👆 ' : '') + tag; t.className = 'tag' + (tap ? ' tap' : '');
    p.innerHTML = shorten(html, tap); p.classList.remove('fade'); void p.offsetWidth; p.classList.add('fade');
    const mb = p.querySelector('.more-b'); if (mb) mb.onclick = ev => { ev.stopPropagation(); p.classList.add('open'); };
  }
  /* long step text: first sentence stays, the rest opens with "আরও" */
  function shorten(html, tap) { const plain = html.replace(/<[^>]+>/g, ''); if (tap || plain.length < 140) return html;
    const re = /[।!?](\s|<\/b>\s?)/g; let m, cut = -1;
    while ((m = re.exec(html))) { const head = html.slice(0, m.index + 1).replace(/<[^>]+>/g, ''); if (head.length >= 35) { cut = m.index + m[0].length; break; } }
    if (cut < 0 || html.slice(cut).replace(/<[^>]+>/g, '').trim().length < 25) return html;
    let head = html.slice(0, cut), rest = html.slice(cut);
    const ob = (head.match(/<b>/g) || []).length - (head.match(/<\/b>/g) || []).length; if (ob > 0) { head += '</b>'; rest = '<b>' + rest; }
    return `${head}<button class="more-b" type="button">আরও ▾</button><span class="more">${rest}</span>`; }
  /* player({count:()=>n, show:(k,prev)=>{}, swipe:el, label:'ধাপ', interval:1500}) — drives the bottom dock */
  function player(o) {
    const d = document.querySelector('.dock');
    const pv = d.querySelector('.pv'), nx = d.querySelector('.nx'), au = d.querySelector('.au'), bar = d.querySelector('.bar i'), cnt = d.querySelector('.cnt');
    const sbs = [...d.querySelectorAll('.spd button')], aul = au.querySelector('span') || au, tm = au.querySelector('.tm');
    const nxT = nx.textContent; let k = 0, timer = null, spd = 1;
    try { const v = parseFloat(localStorage.getItem('im-speed')); if (v > 0) spd = v; } catch (e) {}
    const n = () => o.count(), gap = () => (o.interval || 1500) / spd;
    function markSpd() { if (window.IM && IM.setSpd) IM.setSpd(spd); sbs.forEach(b => b.classList.toggle('sel', Math.abs(+b.dataset.s - spd) < .01)); document.documentElement.style.setProperty('--spd', spd); }
    const ex = document.querySelector('.explain'); let lad = null;
    if (ex && !o.noLadder) { lad = document.createElement('div'); lad.className = 'ladder'; ex.appendChild(lad);
      lad.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; stop(); const p = k; k = +b.dataset.i; show(k > p ? p : null); }); }
    function paintLad() { if (!lad) return; const N = n(); if (lad.childElementCount !== N) { lad.innerHTML = Array.from({ length: N }, (_, i) => `<button type="button" data-i="${i}" aria-label="ধাপ ${bn(i + 1)}">${N <= 12 ? bn(i + 1) : ''}</button>`).join(''); lad.classList.toggle('dots', N > 12); }
      [...lad.children].forEach((b, i) => { b.classList.toggle('cur', i === k); b.classList.toggle('past', i < k); }); }
    let first = true;
    function show(prev) { stepT = performance.now(); watchChanges(); o.show(k, prev); paintLad();
      if (!first) sfx(k >= n() - 1 && prev !== null ? 'done' : prev === null && k > 0 ? 'back' : 'step'); first = false; pv.disabled = k === 0; const end = k >= n() - 1; nx.disabled = false; nx.classList.toggle('again', end); nx.textContent = end ? '🔄 আবার শুরু করো' : nxT; bar.style.width = (100 * (k + 1) / n()) + '%';
      cnt.textContent = end ? 'শেষ! আবার দেখতে "আবার শুরু করো" চাপো' : timer ? 'অটো চলছে… থামাতে "থামো" চাপো' : (o.hint || 'সোয়াইপ করেও ধাপ বদলানো যায়'); }
    function countdown() { if (!tm) return; tm.style.animation = 'none'; void tm.offsetWidth; tm.style.animation = `tmfill ${gap()}ms linear forwards`; }
    function stop() { clearTimeout(timer); timer = null; au.setAttribute('aria-pressed', 'false'); aul.textContent = '▶ অটো'; if (tm) tm.style.animation = 'none'; o.onPlay && o.onPlay(false); if (k < n() - 1) cnt.textContent = o.hint || 'সোয়াইপ করেও ধাপ বদলানো যায়'; }
    function next() { if (k < n() - 1) { const p = k; k++; show(p); } }
    function prev() { if (k > 0) { k--; show(null); } }
    function loop() { timer = setTimeout(() => { next(); if (k >= n() - 1) stop(); else { countdown(); loop(); } }, gap()); }
    function play() { au.setAttribute('aria-pressed', 'true'); aul.textContent = '⏸ থামো'; o.onPlay && o.onPlay(true); timer = -1;
      if (k >= n() - 1) { k = 0; show(null); } else next();
      if (k >= n() - 1) { stop(); return; } countdown(); loop(); }
    nx.onclick = () => { stop(); if (k >= n() - 1) { k = 0; show(null); } else next(); }; pv.onclick = () => { stop(); prev(); };
    au.onclick = () => timer ? stop() : play();
    sbs.forEach(b => b.onclick = () => { spd = +b.dataset.s; markSpd(); try { localStorage.setItem('im-speed', spd); } catch (e) {}
      if (timer) { clearTimeout(timer); countdown(); loop(); } });
    markSpd();
    /* flash whatever turns on / gets highlighted right after a step change */
    const root = document.getElementById('main') || document.body; let mo = null, mt = 0;
    function watchChanges() { if (!window.MutationObserver || reduce()) return; if (mo) mo.disconnect(); let cnt = 0;
      mo = new MutationObserver(list => { for (const m of list) { const el = m.target; if (cnt > 8 || !el.classList) continue;
        const was = ' ' + (m.oldValue || '') + ' ', is = ' ' + el.getAttribute('class') + ' ';
        const hit = ['on', 'hl', 'active', 'sel', 'cur', 'ok', 'bad', 'new', 'done', 'match', 'hit', 'show'].some(c => is.includes(' ' + c + ' ') && !was.includes(' ' + c + ' '));
        if (hit && !el.closest('.dock,.explain,.ladder,.parts,.tabs,.spd')) { cnt++; try { el.animate([{ filter: 'drop-shadow(0 0 0 rgba(245,166,35,0))' }, { filter: 'drop-shadow(0 0 7px rgba(245,166,35,.95))', offset: .35 }, { filter: 'drop-shadow(0 0 0 rgba(245,166,35,0))' }], { duration: 1100, easing: 'ease-out' }); } catch (e) {} if (cnt === 1) setTimeout(() => sfx('hl'), 120); } } });
      mo.observe(root, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true }); clearTimeout(mt); mt = setTimeout(() => mo && mo.disconnect(), 1600); }
    (o.swipe ? [].concat(o.swipe) : []).forEach(el => { let x0 = null, y0 = 0;
      el.addEventListener('touchstart', e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
      el.addEventListener('touchend', e => { if (x0 === null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) { stop(); dx < 0 ? next() : prev(); } }, { passive: true }); });
    document.addEventListener('keydown', e => { if (e.target.closest('input,select,textarea')) return; if (e.key === 'ArrowRight') { stop(); next(); } if (e.key === 'ArrowLeft') { stop(); prev(); } });
    const api = { reset() { stop(); k = 0; show(null); }, go(i) { stop(); k = Math.max(0, Math.min(n() - 1, i)); show(null); }, get k() { return k; }, get speed() { return spd; }, stop };
    return api;
  }
  /* code view: lines = array of html strings; onTap(i, el) */
  function codeView(pre, lines, onTap) {
    pre.classList.add('cv');
    pre.innerHTML = lines.map((t, i) => `<span class="ln" data-l="${i}"><i>${i + 1}</i><span>${t}</span></span>`).join('');
    const L = [...pre.querySelectorAll('.ln')];
    L.forEach((e, i) => e.onclick = ev => { if (ev.target.closest('[data-x]')) return; L.forEach(x => x.classList.toggle('hl', x === e)); onTap && onTap(i, e); });
    return { on(i) { L.forEach((e, j) => { e.classList.toggle('on', Array.isArray(i) ? i.includes(j) : j === i); e.classList.remove('hl'); }); },
      dimAfter(i) { L.forEach((e, j) => e.classList.toggle('dim', j > i)); }, lines: L };
  }
  /* tap-to-explain for any element with data-x="key" inside root, using dict */
  function tapx(root, dict, tagOf) {
    root.addEventListener('click', e => { const el = e.target.closest('[data-x]'); if (!el || !root.contains(el)) return; const k = el.dataset.x; if (!dict[k]) return;
      e.stopPropagation(); say(tagOf ? tagOf(k, el) : (dict[k].t || 'ব্যাখ্যা'), dict[k].d || dict[k], true); });
  }
  /* move an svg element (translate) along points [[x,y],...] */
  let animIds = new WeakMap();
  function moveAlong(el, pts, dur, done) {
    cancelAnimationFrame(animIds.get(el));
    if (reduce() || pts.length < 2) { const p = pts[pts.length - 1]; el.setAttribute('transform', `translate(${p[0]},${p[1]})`); done && done(); return; }
    const seg = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
    const t0 = performance.now();
    const go = now => { let t = Math.min(1, (now - t0) / dur); const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; let dist = e * tot, i = 0;
      while (i < seg.length - 1 && dist > seg[i]) { dist -= seg[i]; i++; } const f = seg[i] ? dist / seg[i] : 1, a = pts[i], b = pts[i + 1];
      el.setAttribute('transform', `translate(${a[0] + (b[0] - a[0]) * f},${a[1] + (b[1] - a[1]) * f})`);
      if (t < 1) animIds.set(el, requestAnimationFrame(go)); else done && done(); };
    animIds.set(el, requestAnimationFrame(go));
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /* C syntax colouring (very small) */
  const cHL = s => esc(s).replace(/(&quot;|"[^"]*")/g, '<span class="st">$1</span>')
    .replace(/\b(int|float|double|char|void|return|if|else|switch|case|break|default|for|while|do|printf|scanf|include|main|long)\b/g, '<span class="kw">$1</span>');
  /* HTML colouring */
  const hHL = s => esc(s).replace(/([a-z-]+)="([^"]*)"/g, '\u0001$1\u0002="$2"').replace(/(&lt;\/?)([a-zA-Z0-9]+)/g, '$1<span class="tg">$2</span>').replace(/\u0001/g, '<span class="at">').replace(/\u0002/g, '</span>');



  /* same section order on every page: … → quiz → মনে রাখো (last) */
  function tidy() { const qz = document.querySelector('.mcq'); const qs = qz && qz.closest('section'); if (!qs) return; const par = qs.parentNode;
    let pts = [...document.querySelectorAll('section')].find(x => { const h = x.querySelector('h2'); return h && h.textContent.trim() === 'মনে রাখো'; });
    if (!pts) { const uls = [...document.querySelectorAll('ul.points')].filter(u => !u.closest('#main') && !u.closest('[hidden]') && u.id !== 'pts'); const ul = uls[uls.length - 1];
      if (ul) { const sec = ul.closest('section'); const solo = sec && sec.parentNode === par && [...sec.children].every(c => c === ul || /^H[23]$/.test(c.tagName) || (c.tagName === 'P' && c.textContent.length < 160));
        if (solo) { pts = sec; let h = sec.querySelector('h2'); if (!h) { h = document.createElement('h2'); sec.prepend(h); } h.textContent = 'মনে রাখো'; }
        else { pts = document.createElement('section'); pts.className = 'card'; pts.innerHTML = '<h2>মনে রাখো</h2>'; pts.appendChild(ul); } } }
    const foot = [...par.children].find(x => x.tagName === 'FOOTER'); par.insertBefore(qs, foot || null); if (pts) par.insertBefore(pts, foot || null); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tidy); else setTimeout(tidy, 0);
  /* video button: reads links.csv (first two columns: code, YouTube link), so a link added on GitHub shows up without a rebuild */
  function ytButton() { const m = location.pathname.match(/\/p\/([a-z0-9]{8})\//); const lead = document.querySelector('header .lead'); if (!m || !lead || document.querySelector('.ytb')) return;
    fetch('../../links.csv', { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').then(t => {
      for (const ln of t.split(/\r?\n/)) { const [c, u] = ln.split(','); if (c === m[1] && /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test((u || '').trim())) {
        const a = document.createElement('a'); a.className = 'ytb'; a.href = u.trim(); a.target = '_blank'; a.rel = 'noopener'; a.textContent = '▶ ইউটিউবে ভিডিও দেখো'; lead.after(a); break; } } }).catch(() => {}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ytButton); else setTimeout(ytButton, 0);

  /* ---------- guided tour: gives lab pages the same explain bar + step dock as every other page ----------
     steps = [{m:'html', do(){...set the lab...}, el:'#selector to scroll to'}] (each step sets its own state) */
  const DOCK = '<div class="dock"><div class="in"><button class="pv" aria-label="আগের ধাপ">◀</button><button class="nx">পরের ধাপ ▶</button><button class="au" aria-pressed="false"><span>▶ অটো</span><i class="tm"></i></button><div class="spd" role="group" aria-label="গতি"><span>গতি</span><button data-s="0.55">🐢 ধীরে</button><button data-s="1" class="sel">স্বাভাবিক</button><button data-s="1.8">🐇 দ্রুত</button></div><div class="bar"><i></i></div><div class="cnt"></div></div></div>';
  function focusEl(sel) { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (!el) return; const ex = document.querySelector('.explain');
    const off = (ex ? ex.getBoundingClientRect().height : 0) + 14, r = el.getBoundingClientRect(), dockH = (document.querySelector('.dock') || { offsetHeight: 0 }).offsetHeight;
    if (r.top < off || r.bottom > innerHeight - dockH - 10) window.scrollTo({ top: Math.max(0, r.top + scrollY - off), behavior: reduce() ? 'auto' : 'smooth' });
    try { el.animate([{ boxShadow: '0 0 0 0 rgba(245,166,35,0)' }, { boxShadow: '0 0 0 4px rgba(245,166,35,.85)', offset: .3 }, { boxShadow: '0 0 0 0 rgba(245,166,35,0)' }], { duration: 1300 }); } catch (e) {} }
  function tour(steps, o) { o = o || {};
    if (!document.querySelector('.explain')) { const ex = document.createElement('div'); ex.className = 'explain'; ex.setAttribute('aria-live', 'polite'); ex.innerHTML = '<span class="tag" id="extag">শুরু</span><p id="extx"></p>';
      const h = document.querySelector('header'); h ? h.after(ex) : document.body.prepend(ex); }
    if (!document.querySelector('.dock')) document.body.insertAdjacentHTML('beforeend', DOCK);
    document.body.classList.add('kit'); let started = false;
    const p = player({ count: () => steps.length, interval: o.interval || 3400, swipe: o.swipe,
      show(k) { const s = steps[k]; try { s.do && s.do(); } catch (e) { console.error(e); } if (started && s.el) setTimeout(() => focusEl(s.el), 60); started = true; say(`ধাপ ${bn(k + 1)} / ${bn(steps.length)}`, s.m); } });
    p.reset(); return p; }
  /* helpers for tour steps */
  const T = {
    tab(k, within) { const r = within ? (typeof within === 'string' ? document.querySelector(within) : within) : document; const b = r.querySelector(`.tab[data-k="${k}"]`); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); },
    sw(svg, id, v) { const g = document.querySelector(`${svg} .sw[data-i="${id}"]`); if (g && g.classList.contains('on') !== !!v) g.dispatchEvent(new MouseEvent('click', { bubbles: true })); },
    tog(cont, key, v) { const b = document.querySelector(`${cont} .toggle[data-k="${key}"]`); if (b && (b.getAttribute('aria-pressed') === 'true') !== !!v) b.click(); },
    click(sel, n) { const b = document.querySelector(sel); for (let i = 0; i < (n || 1); i++) if (b && !b.disabled) b.click(); },
    val(sel, v) { const e = document.querySelector(sel); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } }
  };

  /* ---------- motion helpers (Ch6+) ---------- */
  function rel(root, el) { const m = root.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - m.left, y: r.top - m.top, w: r.width, h: r.height }; }
  function fly(root, from, to, html, o) { o = o || {}; const f = document.createElement('div'); f.className = 'flyer' + (o.cls ? ' ' + o.cls : ''); f.innerHTML = html; root.appendChild(f);
    const a = rel(root, from), b = rel(root, to), fw = f.offsetWidth, fh = f.offsetHeight;
    const ax = a.x + a.w / 2 - fw / 2, ay = a.y + a.h / 2 - fh / 2, bx = b.x + b.w / 2 - fw / 2, by = b.y + b.h / 2 - fh / 2, lift = o.lift === undefined ? 40 : o.lift;
    if (reduce()) { f.remove(); o.done && o.done(); return; }
    if (fresh(4000)) sfx('whoosh');
    f.animate([{ transform: `translate(${ax}px,${ay}px) scale(.85)`, opacity: .3 }, { transform: `translate(${ax}px,${ay - 6}px) scale(1.15)`, opacity: 1, offset: .15 },
      { transform: `translate(${(ax + bx) / 2}px,${Math.min(ay, by) - lift}px) scale(1.2)`, offset: .55 }, { transform: `translate(${bx}px,${by}px) scale(1)` }],
      { duration: o.dur || 1000, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => { f.remove(); o.done && o.done(); };
    return f; }

  /* ---------- compare table + quick quiz (Ch6+) ---------- */
  function compare(box, head, rows) { const n = head.length;
    box.classList.add('cmpx'); box.style.gridTemplateColumns = `minmax(70px,.8fr) repeat(${n - 1},1fr)`;
    box.innerHTML = head.map(h => `<div class="h">${h}</div>`).join('') + rows.map((r, i) => r.slice(0, n).map((c, j) => `<div class="c${j ? '' : ' q'}" data-i="${i}" style="animation-delay:${i * 0.08}s">${c}</div>`).join('')).join('');
    box.querySelectorAll('.c').forEach(c => c.onclick = () => { const i = +c.dataset.i; box.querySelectorAll('.c').forEach(x => x.classList.toggle('on', +x.dataset.i === i)); say(rows[i][0].replace(/<[^>]+>/g, ''), rows[i][n], true); }); }
  function mcq(box, items) { box.classList.add('mcq');
    box.innerHTML = items.map((it, i) => `<div class="mq" data-i="${i}"><p><b>${bn(i + 1)}.</b> ${it.q}</p><div class="mo">${it.o.map((o, j) => `<button data-j="${j}">${'কখগঘ'[j]}) ${o}</button>`).join('')}</div></div>`).join('') + '<p class="mscore" aria-live="polite"></p>';
    let right = 0, done = 0;
    box.querySelectorAll('.mq').forEach(q => { const it = items[+q.dataset.i];
      q.querySelectorAll('button').forEach(b => b.onclick = () => { if (q.dataset.done) return; const j = +b.dataset.j, ok = j === it.a; q.dataset.done = 1; done++; if (ok) right++;
        sfx(ok ? 'ok' : 'no'); b.classList.add(ok ? 'ok' : 'no'); if (!ok) q.querySelector(`[data-j="${it.a}"]`).classList.add('ok');
        say(ok ? 'সঠিক ✓' : 'ভুল ✗', (ok ? '' : `সঠিক উত্তর: <b>${it.o[it.a]}</b>। `) + it.w, true);
        if (!$('extx')) q.insertAdjacentHTML('beforeend', `<p class="mw ${ok ? 'ok' : 'no'}">${ok ? '✓ ঠিক! ' : '✗ '}${it.w}</p>`);
        if (done === items.length) { if (right === items.length) setTimeout(() => sfx('done'), 700); } if (done === items.length) box.querySelector('.mscore').textContent = `তোমার স্কোর: ${bn(right)} / ${bn(items.length)} ${right === items.length ? '🎉' : ''}`; }); }); }

  /* ---------- scene helpers (Ch1/2) ---------- */
  let SPD = 1;
  function seq() { let g = 0; return { bump() { return ++g; }, later(ms, fn) { const c = g; setTimeout(() => { if (c === g) fn(); }, ms / SPD); }, guard(fn) { const c = g; return (...a) => { if (c === g) fn(...a); }; }, get g() { return g; } }; }
  function emit(svg, pts, txt, o) { o = o || {}; const NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pk ' + (o.cls || ''));
    if (!o.quiet && fresh(1500)) sfx((o.dur || 1000) >= 700 ? 'whoosh' : 'pop'); g.innerHTML = o.raw || `<circle r="${o.r || 11}" class="pkc"/><text text-anchor="middle" dominant-baseline="central" font-size="${o.fs || 12}">${txt}</text>`; svg.appendChild(g);
    moveAlong(g, pts, (o.dur || 1000) / SPD, () => { const live = g.isConnected; if (!o.keep) g.remove(); if (live) o.done && o.done(g); }); return g; }
  function mark(root, sel, ids, cls) { cls = cls || 'on'; ids = [].concat(ids); root.querySelectorAll(sel).forEach(e => e.classList.toggle(cls, ids.includes(e.dataset.k || e.id))); }
  return { DOCK, tour, T, focusEl, sfx, mark, $, parse, ev, show, rows, envOf, toggles, tt, circuit, tabs, quiz01, rnd, FN, bn, reduce, say, player, codeView, tapx, moveAlong, esc, cHL, hHL, rel, fly, compare, mcq, seq, emit, setSpd(v){ SPD = v; } };
})();
