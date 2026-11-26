/* ICT Maniac story stage: one idea per screen (needs a/im.js)
   IM.story(box, frames, o)  frames = [{m:'short text', h:'stage html', f: flow step}]
     Elements with data-id keep their place between frames and glide to their new spot;
     new elements pop in one after another (data-d = order); text changes flash.
   IM.cstory(box, cfg)       circuit story: lit wires, signal travel, camera zoom, truth table
   Helpers: S.dg(text, cls, id), S.col(digit, label, cls, id), S.row(...), S.eq(html, id) */
(() => {
  const spd = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spd')) || 1;
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function flow(el, k) { if (!el) return; el.querySelectorAll('.st').forEach(s => { const i = +s.dataset.k; s.classList.toggle('cur', i === k); s.classList.toggle('done', i < k); }); }
  function flowHTML(labels) { const c = '①②③④⑤⑥'; return '<div class="fmap">' + labels.map((t, i) => `<div class="st" data-k="${i + 1}"><b>${c[i]}</b>${t}</div>`).join('<span class="ar">›</span>') + '</div>'; }

  /* ---------- frames with magic move ---------- */
  function story(box, frames, o) { o = o || {};
    box.classList.add('sbox2');
    const fm = o.flow ? (box.insertAdjacentHTML('beforebegin', flowHTML(o.flow)), box.previousElementSibling) : null;
    const stage = document.createElement('div'); stage.className = 'sg'; box.appendChild(stage);
    let shown = false;
    function render(fr, animate) {
      const first = {}, txt = {};
      stage.querySelectorAll('[data-id]').forEach(e => { first[e.dataset.id] = e.getBoundingClientRect(); txt[e.dataset.id] = e.textContent; });
      stage.innerHTML = fr.h;
      if (!animate || RM()) return;
      let n = 0, moved = 0, chg = 0; const sp = spd();
      stage.querySelectorAll('[data-id]').forEach(e => {
        const id = e.dataset.id, a = first[id];
        if (a) { const b = e.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
          if (Math.abs(dx) + Math.abs(dy) > 2) { moved++; e.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 650 / sp, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
          if (txt[id] !== e.textContent && ++chg) e.animate([{ background: '#F5B800', color: '#1A1200' }, { background: 'transparent' }], { duration: 900 / sp, delay: 300 / sp }); }
        else { const d = (e.dataset.d !== undefined ? +e.dataset.d : n) * 260 / sp; n++;
          e.animate([{ opacity: 0, transform: 'translateY(10px) scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 420 / sp, delay: d, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'backwards' });
          if (n <= 4) { const j = n - 1; setTimeout(() => IM.sfx('pop', j), d + 60); } } });
      if (moved) IM.sfx('whoosh'); if (chg) setTimeout(() => IM.sfx('hl'), 320 / sp); }
    const P = IM.tour(frames.map((fr, i) => ({ m: fr.m, el: o.focus || box, do() { render(fr, shown); shown = true; flow(fm, fr.f || 0); fr.go && fr.go(stage); } })), { interval: o.interval || 4200 });
    return P; }

  /* tiny html helpers */
  const S = {
    dg: (t, c, id, d) => `<span class="dg ${c || ''}"${id ? ` data-id="${id}"` : ''}${d !== undefined ? ` data-d="${d}"` : ''}>${t}</span>`,
    col: (t, lab, c, id, d) => `<span class="cl"${id ? ` data-id="${id}"` : ''}${d !== undefined ? ` data-d="${d}"` : ''}><span class="dg ${c || ''}">${t}</span>${lab !== undefined ? `<small class="pvl">${lab}</small>` : ''}</span>`,
    row: (...x) => `<div class="rw2">${x.join('')}</div>`,
    eq: (h, id, c, d) => `<div class="eq2 ${c || ''}"${id ? ` data-id="${id}"` : ''}${d !== undefined ? ` data-d="${d}"` : ''}>${h}</div>`,
    cap: (h, id, d) => `<div class="cap2"${id ? ` data-id="${id}"` : ''}${d !== undefined ? ` data-d="${d}"` : ''}>${h}</div>`,
    ar: (t, id, d) => `<div class="ar2"${id ? ` data-id="${id}"` : ''}${d !== undefined ? ` data-d="${d}"` : ''}>${t || '↓'}</div>`,
    tag: (h, c, id, d) => `<span class="tg2 ${c || ''}"${id ? ` data-id="${id}"` : ''}${d !== undefined ? ` data-d="${d}"` : ''}>${h}</span>`
  };

  /* ---------- circuit story ----------
     cfg = { svg: '<svg ...>' (portrait viewBox), inputs:['A','B'], calc(v)->{A,B,S,C,...},
             table: {cols:['A','B','S','C'], rows:[[0,0],[0,1],...]}, flow:[labels],
             frames: [{m, v:{A:0,B:1}, cam:'full'|[x,y,w,h], f, row, fill:[rows], focus:'#gX', go(){}}] }
     svg parts: path.w[data-v][data-l] wires (data-l = how far from inputs), g.gate[data-v], g.lamp[data-v] (text.v shows value), g.sw[data-k] (text.v), circle.jn[data-v] */
  function cstory(box, cfg) {
    box.classList.add('csbox');
    const fm = cfg.flow ? (box.insertAdjacentHTML('beforebegin', flowHTML(cfg.flow)), box.previousElementSibling) : null;
    box.insertAdjacentHTML('beforeend', `<div class="ccam">${cfg.svg}<div class="cmini"><svg></svg></div><button class="covb" type="button" aria-pressed="false">🔭 পুরো ছবি</button><span class="clvl">পুরো সার্কিট</span></div>`);
    const sv = box.querySelector('.ccam > svg'), NS = 'http://www.w3.org/2000/svg';
    const vb = sv.viewBox.baseVal, Wd = vb.width, Ht = vb.height, FULL = [0, 0, Wd, Ht];
    const root = sv.querySelector('.root') || sv; if (!root.id) root.id = 'cr' + Math.random().toString(36).slice(2, 7);
    const mini = box.querySelector('.cmini svg'); mini.setAttribute('viewBox', `0 0 ${Wd} ${Ht}`); mini.innerHTML = '<g class="mroot"></g>'; const mroot = mini.firstChild;
    const syncMini = () => { mroot.innerHTML = root.innerHTML; mroot.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); };
    mini.insertAdjacentHTML('beforeend', `<rect class="vw" x="0" y="0" width="${Wd}" height="${Ht}" rx="8"/>`); const vwr = mini.querySelector('.vw');
    box.querySelector('.cmini').style.aspectRatio = `${Wd}/${Ht}`; sv.style.aspectRatio = `${Wd}/${Ht}`;
    let tb = null;
    if (cfg.table) { tb = document.createElement('table'); tb.className = 'tt2'; const c = cfg.table.cols, ni = cfg.inputs.length;
      tb.innerHTML = `<thead><tr>${c.map((h, i) => `<th${i === ni ? ' class="o"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${cfg.table.rows.map((r, i) => `<tr data-i="${i}">${c.map((h, j) => `<td${j === ni ? ' class="o"' : ''}>${j < ni ? r[j] : '·'}</td>`).join('')}</tr>`).join('')}</tbody>`;
      box.appendChild(tb); }
    /* lit overlay on every wire */
    const lay = document.createElementNS(NS, 'g'); const wires = [...sv.querySelectorAll('path.w')];
    wires[0] && wires[0].parentNode.insertBefore(lay, wires[wires.length - 1].nextSibling);
    const lit = wires.map(p => { const d = p.getAttribute('d'), g = document.createElementNS(NS, 'g');
      g.innerHTML = `<path class="wl" d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><path class="wf" d="${d}"/>`; lay.appendChild(g);
      return { v: p.dataset.v, l: +p.dataset.l || 0, a: g.firstChild, f: g.lastChild, on: false }; });
    let V = {}, tmr = [], view = FULL.slice(), want = FULL, hold = false;
    const later = (ms, fn) => tmr.push(setTimeout(fn, ms / spd()));
    function setWire(w, on, delay) { if (w.on === on) return; w.on = on; w.a.getAnimations().forEach(x => x.cancel());
      if (!on || RM()) { w.a.setAttribute('stroke-dashoffset', on ? 0 : 1); w.f.classList.toggle('on', on); return; }
      w.a.setAttribute('stroke-dashoffset', 1); w.f.classList.remove('on');
      w.a.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 460 / spd(), delay: delay / spd(), easing: 'ease-in', fill: 'forwards' }).onfinish = () => { if (w.on) { w.a.setAttribute('stroke-dashoffset', 0); w.f.classList.add('on'); } }; }
    function render(anim) { tmr.forEach(clearTimeout); tmr = []; const o = cfg.calc(Object.assign({}, V)); const maxL = Math.max(0, ...lit.map(w => w.l));
      sv.querySelectorAll('.sw').forEach(g => { const k = g.dataset.k; g.classList.toggle('on', !!o[k]); const t = g.querySelector('.v'); if (t) t.textContent = o[k] ? 1 : 0; });
      lit.forEach(w => setWire(w, !!o[w.v], anim ? w.l * 420 : 0));
      sv.querySelectorAll('.jn').forEach(j => j.classList.toggle('on', !!o[j.dataset.v]));
      sv.querySelectorAll('.gate').forEach(g => { const lv = +g.dataset.l || 1; const f = () => g.classList.toggle('on', !!o[g.dataset.v]); anim ? later(lv * 420 + 200, f) : f(); });
      sv.querySelectorAll('.lamp').forEach(l => { const f = () => { const was = l.classList.contains('on'); l.classList.toggle('on', !!o[l.dataset.v]); const t = l.querySelector('.v'); if (t) t.textContent = o[l.dataset.v] ? 1 : 0; if (anim && o[l.dataset.v] && !was) IM.sfx('pop'); };
        anim ? later(maxL * 420 + 500, f) : f(); });
      return o; }
    function fit(b) { if (b === 'full' || !b) return FULL; let [x, y, w, h] = b; const a = Wd / Ht;
      if (w / h > a) { const nh = w / a; y -= (nh - h) / 2; h = nh; } else { const nw = h * a; x -= (nw - w) / 2; w = nw; }
      return [Math.max(0, Math.min(x, Wd - w)), Math.max(0, Math.min(y, Ht - h)), Math.min(w, Wd), Math.min(h, Ht)]; }
    function camTo(box2, quiet) { want = box2; const b = hold ? FULL : box2, from = view.slice(), t0 = performance.now(), dur = RM() ? 1 : 750 / spd();
      if (!quiet) { if (b[2] < from[2] - 1) IM.sfx('zin'); else if (b[2] > from[2] + 1) IM.sfx('zout'); }
      cancelAnimationFrame(camTo.r);
      (function f(t) { let k = Math.min(1, (t - t0) / dur); k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; view = from.map((v, i) => v + (b[i] - v) * k);
        sv.setAttribute('viewBox', view.join(' ')); vwr.setAttribute('x', view[0]); vwr.setAttribute('y', view[1]); vwr.setAttribute('width', view[2]); vwr.setAttribute('height', view[3]);
        box.querySelector('.cmini').classList.toggle('show', view[2] < Wd - 2); if (k < 1) camTo.r = requestAnimationFrame(f); })(t0);
      setTimeout(syncMini, 1600 / spd());
      box.querySelector('.clvl').textContent = b[2] >= Wd - 1 ? 'পুরো সার্কিট' : '🔍 কাছ থেকে'; }
    box.querySelector('.covb').onclick = function () { hold = !hold; this.setAttribute('aria-pressed', hold); camTo(want, true); };
    function table(fill, cur) { if (!tb) return; const ni = cfg.inputs.length, c = cfg.table.cols;
      [...tb.tBodies[0].rows].forEach((tr, i) => { const f = (fill || []).includes(i), r = cfg.table.rows[i]; const was = tr.classList.contains('fill');
        tr.classList.toggle('fill', f); tr.classList.toggle('cur', i === cur);
        const v = {}; cfg.inputs.forEach((k, j) => v[k] = r[j]); const o = cfg.calc(v);
        c.slice(ni).forEach((k, j) => { const td = tr.cells[ni + j]; td.textContent = f ? (o[k] ? 1 : 0) : '·'; td.classList.toggle('one', f && !!o[k]); });
        if (f && !was) IM.sfx('hl'); }); }
    let started = false, curFr = null, fills = [];
    const P = IM.tour(cfg.frames.map(fr => ({ m: fr.m, el: cfg.focus || box.parentNode, do() {
      const nv = Object.assign({}, fr.v || V), ch = JSON.stringify(nv) !== JSON.stringify(V); V = nv; curFr = fr;
      render(started && ch); camTo(fit(fr.cam), !started); flow(fm, fr.f || 0); fills = fr.fill || []; table(fills, fr.row === undefined ? -1 : fr.row);
      sv.querySelectorAll('.gate').forEach(g => g.classList.toggle('focus', !!fr.focus && g.matches(fr.focus)));
      fr.go && fr.go(sv, V); started = true; } })), { interval: cfg.interval || 4400 });
    /* tap a switch to try */
    sv.addEventListener('click', e => { const s = e.target.closest('.sw'); if (s) { P.stop && P.stop(); V[s.dataset.k] = V[s.dataset.k] ? 0 : 1; const o = render(true); IM.sfx('tap');
        if (cfg.table) { const i = cfg.table.rows.findIndex(r => cfg.inputs.every((k, j) => r[j] === (V[k] ? 1 : 0))); if (i >= 0 && !fills.includes(i)) fills = fills.concat(i); table(fills, i); }
        camTo(FULL, true); cfg.onTry && IM.say('নিজে চেষ্টা', cfg.onTry(V, o), true); return; }
      const g = e.target.closest('[data-x]'); if (g && cfg.info && cfg.info[g.dataset.x]) IM.say(cfg.info[g.dataset.x].t, cfg.info[g.dataset.x].d, true); });
    return P; }

  /* circuit drawing helpers (gates point down: inputs on top, output at the bottom) */
  const CK = {
    sw: (k, x, y, lab) => `<g class="sw" data-k="${k}" data-x="sw"><rect x="${x - 28}" y="${y}" width="56" height="48" rx="12"/><text class="n" x="${x}" y="${y - 7}">${lab || k}</text><text class="v" x="${x}" y="${y + 32}">0</text></g>`,
    lamp: (v, x, y, lab) => `<g class="lamp" data-v="${v}" data-x="${v}"><circle class="halo" cx="${x}" cy="${y}" r="33"/><circle class="g" cx="${x}" cy="${y}" r="22"/><text class="v" x="${x}" y="${y + 7}">0</text>${lab ? `<text class="n" x="${x}" y="${y + 40}">${lab}</text>` : ''}</g>`,
    /* returns {s: svg, i: [[x,y],[x,y]], o: [x,y]} */
    gate(type, cx, y, v, l, o) { o = o || {}; const w = o.w || 64, h = w, x0 = cx - w / 2, x1 = cx + w / 2, base = type.replace(/^N(?=AND|OR)|N$/, '').replace('XNOR', 'XOR');
      const inv = /^(NAND|NOR|XNOR|NOT)$/.test(type); let d, out, ins;
      if (base === 'AND') { d = `M${x0} ${y} H${x1} V${y + h / 2} A${w / 2} ${w / 2} 0 0 1 ${x0} ${y + h / 2} Z`; out = y + h; ins = [[cx - w / 4, y], [cx + w / 4, y]]; }
      else if (base === 'OR' || base === 'XOR') { d = `M${x0} ${y} Q${cx} ${y + 16} ${x1} ${y} Q${x1} ${y + h * .62} ${cx} ${y + h + 4} Q${x0} ${y + h * .62} ${x0} ${y} Z`; out = y + h + 4; ins = [[cx - w / 4, y + 6], [cx + w / 4, y + 6]]; }
      else { d = `M${x0 + 6} ${y} H${x1 - 6} L${cx} ${y + h * .8} Z`; out = y + h * .8; ins = [[cx, y]]; }
      let sv = `<path class="b" d="${d}"/>`;
      if (base === 'XOR') sv += `<path class="b" d="M${x0} ${y - 9} Q${cx} ${y + 7} ${x1} ${y - 9}" style="fill:none"/>`;
      if (inv) { sv += `<circle class="bub" cx="${cx}" cy="${out + 6}" r="6"/>`; out += 12; }
      const ty = base === 'AND' ? y + h * .45 : base === 'NOT' ? y + h * .32 : y + h * .5;
      sv += `<text x="${cx}" y="${ty}" style="font-size:${type.length > 3 ? 12 : 14}px">${o.t || type}</text>`;
      if (base === 'XOR') ins = ins.map(([a, b]) => [a, b - 9]);
      return { s: `<g class="gate" data-v="${v}" data-l="${l || 1}" data-x="${o.x || type}"${o.id ? ` id="${o.id}"` : ''}>${sv}</g>`, i: ins, o: [cx, out] }; },
    w: (v, l, pts) => `<path class="w" data-v="${v}" data-l="${l || 0}" d="M${pts.map(p => p.join(' ')).join(' L')}"/>`,
    jn: (v, x, y) => `<circle class="jn" data-v="${v}" cx="${x}" cy="${y}" r="5.5"/>`
  };
  Object.assign(IM, { story, cstory, S, CK });
})();
