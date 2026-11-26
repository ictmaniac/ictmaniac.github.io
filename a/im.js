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
      const v = +b.dataset.a, ok = v === q.ans; total++; if (ok) right++;
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

  /* ---------- kit (Ch4+): explain bar, step player, code view, token mover ---------- */
  const bn = x => String(x).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  const reduce = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  function say(tag, html, tap) {
    const t = $('extag'), p = $('extx'); if (!t) return;
    t.textContent = (tap ? '👆 ' : '') + tag; t.className = 'tag' + (tap ? ' tap' : '');
    p.innerHTML = html; p.classList.remove('fade'); void p.offsetWidth; p.classList.add('fade');
  }
  /* player({count:()=>n, show:(k,prev)=>{}, swipe:el, label:'ধাপ', interval:1500}) — drives the bottom dock */
  function player(o) {
    const d = document.querySelector('.dock');
    const pv = d.querySelector('.pv'), nx = d.querySelector('.nx'), au = d.querySelector('.au'), sp = d.querySelector('.sp'), bar = d.querySelector('.bar i'), cnt = d.querySelector('.cnt');
    const nxT = nx.textContent; let k = 0, timer = null, spd = 1, si = 0; const SP = [1, 1.6, 0.6], SPL = ['১x', 'দ্রুত', 'ধীরে'];
    const n = () => o.count();
    function show(prev) { o.show(k, prev); pv.disabled = k === 0; const end = k >= n() - 1; nx.disabled = false; nx.classList.toggle('again', end); nx.textContent = end ? '🔄 আবার শুরু করো' : nxT; bar.style.width = (100 * (k + 1) / n()) + '%';
      cnt.textContent = k >= n() - 1 ? 'শেষ! আবার দেখতে "আবার শুরু করো" চাপো' : (o.hint || 'সোয়াইপ করেও ধাপ বদলানো যায়'); }
    function stop() { clearInterval(timer); timer = null; au.setAttribute('aria-pressed', 'false'); au.textContent = 'অটো'; o.onPlay && o.onPlay(false); }
    function next() { if (k < n() - 1) { const p = k; k++; show(p); } else stop(); }
    function prev() { if (k > 0) { k--; show(null); } }
    function play() { if (k >= n() - 1) { k = 0; show(null); } au.setAttribute('aria-pressed', 'true'); au.textContent = 'থামো'; o.onPlay && o.onPlay(true);
      timer = setInterval(() => { next(); if (k >= n() - 1) stop(); }, (o.interval || 1500) / spd); }
    nx.onclick = () => { stop(); if (k >= n() - 1) { k = 0; show(null); } else next(); }; pv.onclick = () => { stop(); prev(); };
    au.onclick = () => timer ? stop() : play();
    sp.onclick = () => { si = (si + 1) % 3; spd = SP[si]; sp.textContent = SPL[si]; if (timer) { stop(); play(); } };
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

  /* ---------- motion helpers (Ch6+) ---------- */
  function rel(root, el) { const m = root.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - m.left, y: r.top - m.top, w: r.width, h: r.height }; }
  function fly(root, from, to, html, o) { o = o || {}; const f = document.createElement('div'); f.className = 'flyer' + (o.cls ? ' ' + o.cls : ''); f.innerHTML = html; root.appendChild(f);
    const a = rel(root, from), b = rel(root, to), fw = f.offsetWidth, fh = f.offsetHeight;
    const ax = a.x + a.w / 2 - fw / 2, ay = a.y + a.h / 2 - fh / 2, bx = b.x + b.w / 2 - fw / 2, by = b.y + b.h / 2 - fh / 2, lift = o.lift === undefined ? 40 : o.lift;
    if (reduce()) { f.remove(); o.done && o.done(); return; }
    f.animate([{ transform: `translate(${ax}px,${ay}px) scale(.85)`, opacity: .3 }, { transform: `translate(${ax}px,${ay - 6}px) scale(1.15)`, opacity: 1, offset: .15 },
      { transform: `translate(${(ax + bx) / 2}px,${Math.min(ay, by) - lift}px) scale(1.2)`, offset: .55 }, { transform: `translate(${bx}px,${by}px) scale(1)` }],
      { duration: o.dur || 1000, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => { f.remove(); o.done && o.done(); };
    return f; }
  return { $, parse, ev, show, rows, envOf, toggles, tt, circuit, tabs, quiz01, rnd, FN, bn, reduce, say, player, codeView, tapx, moveAlong, esc, cHL, hHL, rel, fly };
})();
