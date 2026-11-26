/* ICT Maniac 3D kit (needs a/three.min.js and a/im.js)
   const W = IM3.world(box)         -> null when the phone has no WebGL (then show the 2D version)
   W.track(obj) / W.set(t, pos, scale, opacity)   objects ease toward their targets, so every step can set the whole scene
   W.poses = {name:[camPos, lookAt]}; W.fly(name)  camera flies between poses; 🔭 button holds the 'all' pose
   W.tag(key, text, cls, () => point); W.tags([keys])  HTML labels pinned to 3D points
   W.pick(obj, {t, d})              tap the object to explain it
   W.later(ms, fn)                  timers that are cleared when the step changes, and follow the speed buttons
   W.tick(fn(dt, now))              per-frame work
   IM3.steps(W, STEPS, {flow})      STEPS = [{m, f, go(){}}] -> uses the page's dock and explain bar */
window.IM3 = (() => {
  const T = window.THREE;
  const spd = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spd')) || 1;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const V = (x, y, z) => new T.Vector3(x || 0, y || 0, z || 0);
  const C = { blue: 0x2F6FEB, blueL: 0x9CC0FF, sky: 0xCFE2FF, white: 0xFFFFFF, green: 0x1FA463, greenL: 0x8FE0B5, yel: 0xF5B800, yelL: 0xFFE27A, red: 0xE5533D, grey: 0xB9C4D8, ink: 0x14213D, skin: 0xF2C9A0, purple: 0x8E5CC4 };
  const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .5, metalness: .05 }, o || {}));
  function flow(el, k) { if (!el) return; el.querySelectorAll('.st').forEach(s => { const i = +s.dataset.k; s.classList.toggle('cur', i === k); s.classList.toggle('done', i < k); }); }

  function world(box, o) {
    o = o || {}; let R;
    if (!T) return null;
    try { R = new T.WebGLRenderer({ antialias: true, alpha: true }); if (!R.getContext()) return null; } catch (e) { return null; }
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); box.classList.add('cam3'); box.prepend(R.domElement);
    box.insertAdjacentHTML('beforeend', '<button class="ovb" aria-pressed="false">🔭 পুরো ছবি</button><span class="hint3">👆 টেনে ঘোরাও · ছুঁয়ে দেখো</span>');
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(45, 1, .05, 400);
    scene.add(new T.HemisphereLight(0xffffff, 0xcfe0ff, .95));
    const sun = new T.DirectionalLight(0xffffff, .7); sun.position.set(5, 10, 8); scene.add(sun);
    const W = { T, scene, cam, R, V, C, mat, spd, RM, box, poses: {} };
    /* soft ground shadows: W.shadows(range) after the scene is built (skips glowing / see-through parts) */
    W.sun = sun;
    W.shadows = (rng, at) => { R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; sun.castShadow = true; const sc = sun.shadow.camera;
      sc.left = sc.bottom = -rng; sc.right = sc.top = rng; sc.near = .5; sc.far = rng * 6; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
      if (at) { sun.target.position.copy(at); scene.add(sun.target); sun.position.copy(at).add(V(rng * .5, rng * 1.6, rng * .8)); } else sun.position.set(rng * .5, rng * 1.6, rng * .8);
      scene.traverse(m => { if (m.isMesh && m.material && m.material.isMeshStandardMaterial && !(m.material.transparent && m.material.opacity < .9)) { m.castShadow = true; m.receiveShadow = true; } }); };

    /* tracked objects */
    const objs = [];
    W.track = (ob, extra) => { const t = Object.assign({ o: ob, p: ob.position.clone(), s: ob.scale.x, a: 1, mats: [] }, extra || {});
      ob.traverse(m => { if (m.material && !m.userData.own) { [].concat(m.material).forEach(mm => { mm.transparent = true; t.mats.push([mm, mm.opacity]); }); } }); objs.push(t); return t; };
    W.set = (t, p, s, a) => { if (p) t.p.copy(p); if (s !== undefined && s !== null) t.s = s; if (a !== undefined) t.a = a; return t; };
    W.snap = () => objs.forEach(t => { t.o.position.copy(t.p); t.o.scale.setScalar(t.s); t.cur = t.a; });

    /* timers */
    let timers = []; const resets = [];
    W.later = (ms, fn) => { timers.push(setTimeout(fn, ms / spd())); };
    W.onReset = fn => resets.push(fn);
    W.reset = () => { timers.forEach(clearTimeout); timers = []; resets.forEach(f => f()); };

    /* labels */
    const TAGS = {};
    W.tag = (k, text, cls, at, vis) => { const d = document.createElement('span'); d.className = 'tag3 ' + (cls || ''); d.innerHTML = text; box.appendChild(d); TAGS[k] = { d, at, vis }; };
    W.note = html => { let n = box.querySelector('.note3'); if (!n) { n = document.createElement('div'); n.className = 'note3'; box.appendChild(n); } n.innerHTML = html || ''; n.classList.toggle('show', !!html); };
    W.onReset(() => W.note(''));
    W.tags = list => { for (const k in TAGS) TAGS[k].d.classList.toggle('show', list.includes(k)); };
    W.tagText = (k, html) => { if (TAGS[k]) TAGS[k].d.innerHTML = html; };

    /* camera */
    let camFrom = null, camTo = null, camT = 1, camDur = 1, yaw = 0, pitch = 0, hold = false, curPose = null, zoom = 1;
    const camPos = V(0, 0, 10), camLook = V();
    W.fly = (k, quiet, dur) => { curPose = k; W.follow = null; const to = (hold && W.poses.all) ? W.poses.all : W.poses[k]; if (!to) return;
      if (!camTo) { camPos.copy(to[0]); camLook.copy(to[1]); camTo = to; return; }
      if (!quiet) { const d0 = camPos.distanceTo(camLook), d1 = to[0].distanceTo(to[1]); if (d1 < d0 * .8) IM.sfx('zin'); else if (d1 > d0 * 1.25) IM.sfx('zout'); }
      camFrom = [camPos.clone(), camLook.clone()]; camTo = to; camT = 0; camDur = RM ? .01 : (dur || 1600) / 1000 / spd(); yaw *= .3; pitch *= .3; zoom = 1; };
    const ovb = box.querySelector('.ovb');
    if (!o.noOverview) ovb.onclick = () => { hold = !hold; ovb.setAttribute('aria-pressed', hold); if (curPose) W.fly(curPose); };
    else ovb.remove();

    /* drag to look around, pinch / wheel to zoom, tap to explain */
    const picks = []; let drag = null, moved = 0; const ptrs = new Map(); let pinch0 = 0, zoom0 = 1;
    W.pick = (ob, info) => { ob.traverse(m => { if (m.isMesh) { m.userData.info = info; picks.push(m); } }); };
    const el = R.domElement;
    el.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = zoom; drag = null; }
      else drag = [e.clientX, e.clientY, yaw, pitch]; });
    window.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2 && pinch0) { const [a, b] = [...ptrs.values()]; zoom = Math.max(.45, Math.min(2.2, zoom0 * pinch0 / Math.max(10, Math.hypot(a[0] - b[0], a[1] - b[1])))); moved = 99; return; }
      if (!drag) return; const dx = e.clientX - drag[0], dy = e.clientY - drag[1]; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      yaw = drag[2] - dx / 110; pitch = Math.max(-1.1, Math.min(1.1, drag[3] + dy / 150)); });
    const up = e => { if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0;
      if (drag && moved < 8 && e.type === 'pointerup') tap(e); if (!ptrs.size) drag = null; };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.45, Math.min(2.2, zoom * (e.deltaY > 0 ? 1.08 : .93))); }, { passive: false });
    const ray = new T.Raycaster(), ndc = new T.Vector2();
    function tap(e) { const r = el.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      ray.setFromCamera(ndc, cam); const hit = ray.intersectObjects(picks.filter(m => { let v = true; m.traverseAncestors(a => { if (!a.visible) v = false; }); return v && m.visible; }), false)[0];
      if (hit && hit.object.userData.info) { const i = hit.object.userData.info; IM.sfx('hl'); IM.say(i.t, i.d, true); } }

    /* packets: a small ball (and an emoji) travelling along a 3D path */
    const pks = [];
    W.send = (pts, o) => { o = o || {}; const m = new T.Mesh(new T.SphereGeometry(o.r || .12, 14, 10), new T.MeshBasicMaterial({ color: o.color === undefined ? C.yel : o.color }));
      if (o.parent) o.parent.add(m); else scene.add(m); let sp = null;
      if (o.emoji) { sp = document.createElement('span'); sp.className = 'pk3'; sp.textContent = o.emoji; box.appendChild(sp); }
      if (o.sound !== false) IM.sfx((o.dur || 1000) >= 700 ? 'whoosh' : 'pop');
      const p = { m, sp, curve: new T.CatmullRomCurve3(pts), t: 0, dur: (o.dur || 1000) / 1000, done: o.done }; pks.push(p); return p; };
    const dropPk = p => { p.m.parent && p.m.parent.remove(p.m); p.m.geometry.dispose(); p.sp && p.sp.remove(); };
    W.onReset(() => { pks.splice(0).forEach(dropPk); });
    const pv = V();
    function movePk(dt) { const w = box.clientWidth, h = box.clientHeight;
      for (let i = pks.length - 1; i >= 0; i--) { const p = pks[i]; p.t += dt * spd() / p.dur; const u = Math.min(1, p.t);
        p.m.position.copy(p.curve.getPointAt(u));
        if (p.sp) { p.m.getWorldPosition(pv); pv.project(cam); p.sp.style.transform = `translate(${((pv.x * .5 + .5) * w).toFixed(1)}px,${((-pv.y * .5 + .5) * h).toFixed(1)}px) translate(-50%,-110%)`; }
        if (u >= 1) { pks.splice(i, 1); dropPk(p); p.done && p.done(); } } }

    /* frame loop */
    const ticks = []; W.tick = fn => ticks.push(fn);
    function size() { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; R.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h < .9 ? 50 : 40; cam.updateProjectionMatrix(); }
    window.addEventListener('resize', size); size();
    let last = performance.now(), visible = true;
    if (window.IntersectionObserver) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(box);
    const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, tmp = V(), off = V();
    function frame(now) { requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; if (!visible || document.hidden) return;
      const k = RM ? 1 : 1 - Math.exp(-dt * 3.2 * spd());
      objs.forEach(t => { t.o.position.lerp(t.p, k); t.o.scale.setScalar(t.o.scale.x + (t.s - t.o.scale.x) * k);
        t.cur = t.cur === undefined ? t.a : t.cur + (t.a - t.cur) * k; t.mats.forEach(([m, b]) => m.opacity = b * t.cur); t.o.visible = t.cur > .02; });
      ticks.forEach(f => f(dt, now, k));
      movePk(RM ? 1e3 : dt);
      if (W.follow && camT >= 1) { const fp = W.follow(); camPos.lerp(fp[0], k); camLook.lerp(fp[1], k); }
      if (camT < 1) { camT = Math.min(1, camT + dt / camDur); const e = ease(camT); camPos.lerpVectors(camFrom[0], camTo[0], e); camLook.lerpVectors(camFrom[1], camTo[1], e); }
      if (!drag && !RM) { yaw *= .996; pitch *= .996; }
      off.copy(camPos).sub(camLook); const r = off.length() * zoom, th = Math.atan2(off.x, off.z) + yaw + (RM ? 0 : Math.sin(now / 5000) * .05);
      const ph = Math.max(.12, Math.min(Math.PI - .12, Math.acos(Math.max(-1, Math.min(1, off.y / off.length()))) - pitch));
      cam.position.set(camLook.x + r * Math.sin(ph) * Math.sin(th), camLook.y + r * Math.cos(ph), camLook.z + r * Math.sin(ph) * Math.cos(th)); cam.lookAt(camLook);
      R.render(scene, cam);
      const w = box.clientWidth, h = box.clientHeight;
      for (const key in TAGS) { const t = TAGS[key]; if (!t.d.classList.contains('show')) continue; tmp.copy(t.at()).project(cam);
        t.d.style.transform = `translate(${((tmp.x * .5 + .5) * w).toFixed(1)}px,${((-tmp.y * .5 + .5) * h).toFixed(1)}px) translate(-50%,-120%)`; t.d.style.visibility = (tmp.z < 1 && (!t.vis || t.vis())) ? '' : 'hidden'; } }
    requestAnimationFrame(frame);
    return W;
  }

  /* steps on the page's dock + explain bar (pages built with kit: 1) */
  function steps(W, S, o) { o = o || {}; const fl = o.flow ? document.querySelector(o.flow) : null; let started = false;
    const p = IM.player({ count: () => S.length, interval: o.interval || 5200,
      show(k) { const s = S[k]; W.reset(); try { s.go(k); } catch (e) { console.error(e); } flow(fl, s.f || 0); IM.say(`ধাপ ${IM.bn(k + 1)} / ${IM.bn(S.length)}`, s.m);
        if (started) setTimeout(() => IM.focusEl(W.box.closest('.v3') || W.box), 60); started = true; } });
    p.reset(); return p; }

  /* shared shapes */
  function helix(x0, x1, strandC, rungC, o) { o = o || {}; const g = new T.Group(), r = o.r || .75, P = o.pitch || 3.2, tube = o.tube || .13;
    [0, Math.PI].forEach(ph => { const pts = []; for (let x = x0; x <= x1 + 1e-6; x += .1) { const a = x / P * 2 * Math.PI + ph; pts.push(V(x, r * Math.cos(a), r * Math.sin(a))); }
      g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), Math.max(8, Math.round((x1 - x0) * 12)), tube, 8), mat(strandC))); });
    for (let x = x0 + .2, i = 0; x < x1; x += .4, i++) { const a = x / P * 2 * Math.PI, p1 = V(x, r * Math.cos(a), r * Math.sin(a)), p2 = V(x, -r * Math.cos(a), -r * Math.sin(a));
      const cy = new T.Mesh(new T.CylinderGeometry(tube * .55, tube * .55, 2 * r, 6), mat(rungC[i % rungC.length]));
      cy.position.copy(p1).add(p2).multiplyScalar(.5); cy.quaternion.setFromUnitVectors(V(0, 1, 0), p2.clone().sub(p1).normalize()); g.add(cy); }
    return g; }
  function person(shirt, o) { o = o || {}; const g = new T.Group();
    const body = new T.Mesh(new T.CylinderGeometry(.32, .38, 1.1, 16), mat(shirt)); body.position.y = .95; g.add(body);
    const head = new T.Group(); head.position.y = 1.78; g.add(head);
    head.add(new T.Mesh(new T.SphereGeometry(.3, 24, 18), mat(C.skin)));
    const hair = new T.Mesh(new T.SphereGeometry(.31, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), mat(0x3B2A20)); head.add(hair);
    [-.13, .13].forEach(x => { const l = new T.Mesh(new T.CylinderGeometry(.11, .11, .45, 10), mat(0x34495E)); l.position.set(x, .22, 0); g.add(l); });
    g.userData.head = head; return g; }
  function label(text, o) { o = o || {}; const c = document.createElement('canvas'), x = c.getContext('2d'), fs = o.fs || 64;
    x.font = `700 ${fs}px "Hind Siliguri","Noto Sans Bengali",sans-serif`; const w = Math.ceil(x.measureText(text).width) + fs; c.width = w; c.height = fs * 1.6;
    x.font = `700 ${fs}px "Hind Siliguri","Noto Sans Bengali",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = o.color || '#14213D'; x.fillText(text, w / 2, c.height / 2);
    const tx = new T.CanvasTexture(c); const s = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); const h = o.h || .5; s.scale.set(h * w / c.height, h, 1); return s; }
  /* Earth: light-blue sea, green land (180x90 land map, Natural Earth via world-atlas, public domain) */
  const LAND = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAAAAAAAAAAAAAAAAAf//////+AA/YP/gY/AAAAAAAAAAAAD3///////AAf+AEQCB/wAAAAAAAAAAD////////8AA/gAA+AL/4APKAAAAAAAf///gn///wAAQAAfwP//gB/wAAAAAAB////gH//8AAAAAHg/////j+AAAwP/g/////4P//wYAH8Afn///////4xDD////////w//+AAD/////////////8P///////9/x/8PgAP/////////////w/////////+H/B/AB//////////////CN////////wPwDwg//////////////8BP/////8H/AeAACT//////////////AA//f///wf+AYAAPP/////////////QAMfAf///5/8AAAA8P//////////4HwAAPoAf/////8AAAPw///////////wf4A/gAB//////4AAA/v///////////B4LDgAAD//////gAAD////////////8HAMAAAAD//////AAAB////////////4wAAAAAAH/////8AAAH////H///////OAAAAAAAf////+AAAAH///8///////vwAAAAAAB/////YAAAH//+3h//////98AAAAAAAH////wAAAAf6///D//////HAAAAAAAAP///4AAA4B/r//8f/////4YAAAAAAAA////gAAAQH/+//w//////7gAAAAAAAB///+AAAAAP/Rz///////n+AAAAAAAAH///wQAAAR//OH//////+fwAAAAAAAAH//8AAAAAH//////////8wAAAAAAAAAv/9wAAAAP///////////yAAAAAAAAAA/8DwAAAA///////////+YEAAAAAAAAB/wHgAAAA///////////+AAAAAAGAAAD/B/AAAAH//////H///+gAAAAAAeAAAD8/+AAAAf/////8P///jAAAAAAAYAAAn/n/gAAB//////gP8/8MAIAAAAAAAAAP/EvAABn/////+A/B/hwAgAAAAAAAAAH+AEAAGf/////gD4H+HgCAAAAAAAAAAD4cYAAB/////7AHgv4eAIAAAAAAAAAADj/AAAH/////wA8CXh8AABAAAAAAAAAH/+AAAH/////AC4JsNwQAAAAAAAAAAAH/8AAAf////4ABgnA/EBEMAAAAAAAAAH/+AAAfv///gAiB8vsAAEgAAMAAAAAA//4AAAAP//8ACAH/88AAAgAAQAAAACH//wAAAB///gAAAPv/gAACAAAAAAAAMf//wAAAD//8AAAAf//8YBkAIAAAAAAB///4AAAP//gAAAB////4AADgIAAAAAH///4AAAf/8BAAABz+P/wAAgAAAAAAAf///gCAA//wAAgAD8vf9wBCYABgAAAA///+AAAD//AAAAAB/897gEAACCAAAAD///wAAAP//AAAAAgee33wAWAAAAAAAH///AAAA///wAAAAAH7ABCCIAEAAAAAf//4AAQH//vAAAAAA/uAGAIADcAAAAAf//gABAf//8AAAAAH/8AYwtAAUAAAAA//+AAAB//jiAAAAB//4QjCgIAgAAAAD//wAAAD/8eYAAAA///gOQAAAAAAAAAP//AAAAH/xwAAAAD///AQAAAAAQAAAA//gAAAAf/HAAAAAP//+AAAAAAAAEAAD/8AAAAB/4AAAAAA///4AAAAAAAAAAAP/wAAAAH/gAAAAAB///gAAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAAAj/wAAAAA/gAAAAAAf7/4AAAAAAAAAAAf/AAAAAB4AAAAAABwH/ADAgAAAAAAAB/wAAAAAAAAAAAAAAAP8APCAAAAAAAAH/AAAAAAAAAAAAAAAAPgA8AAAAAAAAA/gAAAAAAAAAAAAAAAAeAHgQAAAAAAAD+AAAAAAAAAAAAAAAAA4A8BAAAAAAAAPwAAAAAAAAAAAAAAAAAAHAAAAAAAAAA/AAAAAAAAIEAAAAAAAAAcAAAAAAAAAD8AAAAAAAAAADAAAAAAAAAAAAAAAAAAPHAAAAAAAAAAAAAAAAAAMAAAAAAAAAA+YAQAAAAAAAAIAAAAAAAIAAAAAAAAAB+ADgAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAA4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAADAAAjGAAAAAAAAAAAAAAAfAAAAAAAAD/+D/////wGAAAAAAAAAAP8AAAAABgP//7///////gAAAAAAADwB/wAAAf//////////////8AAAAAP4f///gAAX///////////////wAAAP//////8AAP///////////////4AAA///////+AMP////////////////4AAf//////+9j5/////////////////AAA////////+//////////////////wAD/////////////////////////////A//////////////////////////////D/////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  function earth(r) { const W0 = 180, H0 = 90, bits = atob(LAND), c = document.createElement('canvas'); c.width = W0; c.height = H0; const x = c.getContext('2d'), im = x.createImageData(W0, H0);
    for (let i = 0; i < W0 * H0; i++) { const col = i % W0, on = (bits.charCodeAt(((i / W0) | 0) * 23 + (col >> 3)) >> (7 - (col & 7))) & 1, p = i * 4; im.data[p] = im.data[p + 1] = im.data[p + 2] = 255; im.data[p + 3] = on ? 255 : 0; }
    x.putImageData(im, 0, 0); const BW = 1024, BH = 512, mk = (w, h) => { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; };
    /* land mask (smoothed), land colours by latitude, sea gradient, darker coast rim */
    const mask = mk(BW, BH), mx = mask.getContext('2d'); mx.imageSmoothingEnabled = true; mx.drawImage(c, 0, 0, BW, BH);
    const land = mk(BW, BH), lx = land.getContext('2d'), lg = lx.createLinearGradient(0, 0, 0, BH);
    [[0, '#F7FAFF'], [.12, '#EEF5F0'], [.2, '#A9D6A4'], [.32, '#7CC88C'], [.42, '#C9D98F'], [.5, '#4FB56E'], [.58, '#62BC7A'], [.7, '#B8D78E'], [.82, '#9CCF9A'], [.9, '#EEF5F0'], [1, '#F7FAFF']].forEach(([o, k]) => lg.addColorStop(o, k));
    lx.fillStyle = lg; lx.fillRect(0, 0, BW, BH); lx.globalCompositeOperation = 'destination-in'; lx.drawImage(mask, 0, 0);
    const big = mk(BW, BH), bx = big.getContext('2d'), sg = bx.createLinearGradient(0, 0, 0, BH);
    [[0, '#D6E8FF'], [.25, '#8DBDF5'], [.5, '#5E9DEB'], [.75, '#8DBDF5'], [1, '#D6E8FF']].forEach(([o, k]) => sg.addColorStop(o, k));
    bx.fillStyle = sg; bx.fillRect(0, 0, BW, BH);
    bx.save(); bx.shadowColor = 'rgba(255,255,255,.9)'; bx.shadowBlur = 10; bx.globalAlpha = .55; bx.drawImage(mask, 0, 0); bx.restore();
    bx.save(); bx.filter = 'brightness(.62)'; bx.drawImage(land, 0, 1); bx.restore(); bx.drawImage(land, 0, -1);
    const tex = new T.CanvasTexture(big); const g = new T.Group();
    g.add(new T.Mesh(new T.SphereGeometry(r, 64, 48), new T.MeshStandardMaterial({ map: tex, roughness: .62, metalness: .04 })));
    const atm = new T.Mesh(new T.SphereGeometry(r * 1.05, 48, 32), new T.MeshBasicMaterial({ color: 0x9CC4FF, transparent: true, opacity: .22, side: T.BackSide, depthWrite: false })); atm.userData.own = 1; g.add(atm);
    return g; }
  /* lat/lon -> point on the sphere (matches the texture above) */
  function ll(lat, lon, r) { const th = (90 - lat) * Math.PI / 180, ph = (lon + 180) * Math.PI / 180; return V(-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th)); }
  /* arc between two surface points, lifted above the ground */
  function arc(a, b, r, lift, n) { n = n || 48; const pts = [], ua = a.clone().normalize(), ub = b.clone().normalize(), ang = ua.angleTo(ub);
    for (let i = 0; i <= n; i++) { const t = i / n, s = Math.sin(ang); const v = s < 1e-4 ? ua.clone() : ua.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(ub.clone().multiplyScalar(Math.sin(t * ang) / s));
      pts.push(v.normalize().multiplyScalar(r * (1 + (lift === undefined ? .12 + ang * .1 : lift) * Math.sin(Math.PI * t)))); } return pts; }
  return { world, steps, flow, helix, person, label, earth, ll, arc, V, C, mat, spd };
})();
