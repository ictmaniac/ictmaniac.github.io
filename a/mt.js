/* ICT Maniac model test kit. Page sets window.MT = {code, minutes, qs:[{s, st, t, o, a, e, c, code, b}]} */
(function () {
  'use strict';
  var D = window.MT, $ = function (s, r) { return (r || document).querySelector(s); };
  var BN = '০১২৩৪৫৬৭৮৯', L = ['ক', 'খ', 'গ', 'ঘ'], R = ['i', 'ii', 'iii'];
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BN[d]; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) { return esc(s).replace(/⦃([^⦄]*)⦄/g, '<sub>$1</sub>').replace(/⦅([^⦆]*)⦆/g, '<sup>$1</sup>'); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var KEY = 'im-mt-' + D.code, N = D.qs.length, TOTAL = D.minutes * 60;
  var ans = [], left = TOTAL, tick = null, started = 0, running = false, sound = true;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  sound = store('im-mt-sound') !== '0';

  /* soft marimba tones */
  var ac = null;
  function tone(f, t0, dur, vol) {
    if (!sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var t = ac.currentTime + (t0 || 0), o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.35));
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + (dur || 0.35) + 0.05);
    } catch (e) {}
  }
  function chime(up) { (up ? [523, 659, 784, 1047] : [523, 494, 440]).forEach(function (f, i) { tone(f, i * 0.12, 0.5, 0.1); }); }

  function tableHTML(spec) {
    return '<div style="overflow-x:auto"><table>' + spec.split(' ; ').map(function (r) {
      return '<tr>' + r.split(' , ').map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</table></div>';
  }
  function stimHTML(c, from, to) {
    var m = c.match(/^(.*?)\s*\[TBL:(.*)\]\s*$/), txt = m ? m[1] : c;
    var out = '', code = [];
    function flush() { if (code.length) { out += '<div class="code">' + esc(code.join('\n')) + '</div>'; code = []; } }
    txt.split(' ¦ ').forEach(function (line) {
      if (!/[ঀ-৿]/.test(line)) code.push(line); else { flush(); out += '<p>' + fmt(line) + '</p>'; }
    });
    flush();
    return '<b>' + (from === to ? bn(from) + ' নং প্রশ্নের' : bn(from) + (to - from > 1 ? '–' : ' ও ') + bn(to) + ' নং প্রশ্নের') + ' জন্য উদ্দীপক</b>' +
      out + (m ? tableHTML(m[2]) : '');
  }

  /* build question cards once */
  var list = $('#qs'), cards = [];
  D.qs.forEach(function (q, i) {
    if (q.c && (i === 0 || D.qs[i - 1].c !== q.c)) {
      var to = i; while (to + 1 < N && D.qs[to + 1].c === q.c) to++;
      list.appendChild(el('div', 'stim', stimHTML(q.c, i + 1, to + 1)));
    }
    var card = el('div', 'card q'); card.id = 'q' + (i + 1);
    var h = (q.tp ? '<p class="tp">' + esc(q.tp) + '</p>' : '') + '<div class="qh"><span class="qn">' + bn(i + 1) + '</span><div class="qt">' + fmt(q.s) + (q.b ? '<span class="board">বোর্ড</span>' : '');
    if (q.code) h += '<div class="code">' + esc(q.code) + '</div>';
    if (q.st && q.st.length) h += '<ul class="st">' + q.st.map(function (s, k) { return '<li><span>' + R[k] + '.</span><span>' + fmt(s) + '</span></li>'; }).join('') + '</ul>';
    if (q.t) h += '<p class="tail">' + fmt(q.t) + '</p>';
    h += '</div></div>';
    var short = q.o.every(function (o) { return o.length <= 18; });
    h += '<div class="opts' + (short ? ' short' : '') + '" role="radiogroup" aria-label="প্রশ্ন ' + bn(i + 1) + ' এর উত্তর">' + q.o.map(function (o, k) {
      return '<button type="button" class="op" role="radio" aria-checked="false" data-k="' + k + '"><span class="bub">' + L[k] + '</span><span class="tx">' + fmt(o) + '</span></button>';
    }).join('') + '</div><div class="fb" hidden></div>';
    card.innerHTML = h;
    card.querySelectorAll('.op').forEach(function (b) {
      b.addEventListener('click', function () { pick(i, +b.dataset.k); });
    });
    list.appendChild(card); cards.push(card);
  });

  function pick(i, k) {
    if (!running) return;
    ans[i] = ans[i] === k ? undefined : k;
    cards[i].querySelectorAll('.op').forEach(function (b, j) { b.classList.toggle('sel', ans[i] === j); b.setAttribute('aria-checked', ans[i] === j); });
    tone(ans[i] === undefined ? 392 : [523, 587, 659, 698][k], 0, 0.3, 0.1);
    progress(); $('#confirm').hidden = true;
  }
  function count() { var n = 0; for (var i = 0; i < N; i++) if (ans[i] !== undefined) n++; return n; }
  function progress() {
    var n = count();
    $('#done').textContent = 'উত্তর দিয়েছ ' + bn(n) + '/' + bn(N);
    $('#prog').style.width = (n / N * 100) + '%';
  }
  function clock(s) { return bn(Math.floor(s / 60)) + ':' + bn(('0' + (s % 60)).slice(-2)); }
  function showTime() {
    var t = $('#timer'); t.textContent = '⏱ ' + clock(left);
    t.classList.toggle('warn', left <= 300 && left > 60); t.classList.toggle('late', left <= 60);
  }

  function start() {
    ans = []; left = TOTAL; running = true; started = Date.now();
    cards.forEach(function (c) {
      c.classList.remove('locked'); c.hidden = false; $('.fb', c).hidden = true; $('.fb', c).innerHTML = '';
      c.querySelectorAll('.op').forEach(function (b) { b.className = 'op'; b.disabled = false; b.setAttribute('aria-checked', 'false'); var l = $('.lab', b); if (l) l.remove(); });
    });
    document.querySelectorAll('.stim').forEach(function (s) { s.hidden = false; });
    $('#intro').hidden = true; $('#result').hidden = true; $('#filter').hidden = true;
    $('#bar').hidden = false; $('#qs').hidden = false; $('#dock').hidden = false; $('#confirm').hidden = true; $('#after').hidden = true;
    progress(); showTime(); window.scrollTo(0, 0);
    clearInterval(tick);
    tick = setInterval(function () {
      left = Math.max(0, TOTAL - Math.round((Date.now() - started) / 1000)); showTime();
      if (left === 60) tone(880, 0, 0.4, 0.1);
      if (left <= 0) submit(true);
    }, 500);
    tone(659, 0, 0.3, 0.1); tone(784, 0.12, 0.4, 0.1);
  }

  function trySubmit() {
    var miss = N - count();
    if (miss > 0 && $('#confirm').hidden) {
      $('#cmsg').textContent = bn(miss) + 'টি প্রশ্নের উত্তর বাকি। তবুও জমা দেবে?';
      $('#confirm').hidden = false; return;
    }
    submit(false);
  }

  function submit(timeUp) {
    if (!running) return;
    running = false; clearInterval(tick);
    var used = Math.min(TOTAL, Math.round((Date.now() - started) / 1000));
    var ok = 0, bad = 0, skip = 0;
    D.qs.forEach(function (q, i) {
      var c = cards[i], a = ans[i], fb = $('.fb', c);
      c.classList.add('locked');
      c.querySelectorAll('.op').forEach(function (b, j) {
        b.disabled = true; b.classList.remove('sel');
        if (j === q.a) { b.classList.add('right'); b.insertAdjacentHTML('beforeend', '<span class="lab">সঠিক উত্তর</span>'); }
        else if (j === a) { b.classList.add('wrong'); b.insertAdjacentHTML('beforeend', '<span class="lab">তোমার উত্তর</span>'); }
      });
      var st, cls;
      if (a === q.a) { ok++; st = '✓ সঠিক হয়েছে'; cls = 'ok'; c.dataset.r = 'ok'; }
      else if (a === undefined) { skip++; st = '○ উত্তর দাওনি। সঠিক উত্তর (' + L[q.a] + ')'; cls = 'skip'; c.dataset.r = 'skip'; }
      else { bad++; st = '✗ ভুল হয়েছে। সঠিক উত্তর (' + L[q.a] + ')'; cls = 'no'; c.dataset.r = 'bad'; }
      var exHTML = '<div class="ex"><b>ব্যাখ্যা: </b>' + fmt(q.e || '') + '</div>';
      fb.innerHTML = '<p class="status ' + cls + '">' + st + '</p>' + (cls === 'ok' ? '<button type="button" class="exbtn">ব্যাখ্যা দেখো ▾</button><div hidden>' + exHTML + '</div>' : exHTML);
      var eb = $('.exbtn', fb); if (eb) eb.addEventListener('click', function () { eb.nextSibling.hidden = !eb.nextSibling.hidden; eb.textContent = eb.nextSibling.hidden ? 'ব্যাখ্যা দেখো ▾' : 'ব্যাখ্যা লুকাও ▴'; });
      fb.hidden = false;
    });
    var pct = Math.round(ok / N * 100);
    var best = +(store(KEY) || -1);
    if (ok > best) store(KEY, ok);
    $('#score').textContent = bn(ok); $('#outof').textContent = bn(N) + ' এর মধ্যে';
    $('#ring').style.setProperty('--p', 0);
    requestAnimationFrame(function () { setTimeout(function () { $('#ring').style.setProperty('--p', pct); }, 50); });
    $('#cheer').textContent = pct >= 90 ? 'অসাধারণ! 🌟' : pct >= 80 ? 'খুব ভালো! A+ এর পথে 👏' : pct >= 60 ? 'ভালো হয়েছে! আরেকটু চেষ্টা 💪' : pct >= 40 ? 'চলবে, ভুলগুলো আবার পড়ো 📘' : 'ঘাবড়াবে না, ব্যাখ্যা পড়ে আবার দাও 🙂';
    $('#sa').textContent = bn(ok); $('#sb').textContent = bn(bad); $('#sc').textContent = bn(skip);
    $('#took').textContent = (timeUp ? 'সময় শেষ! ' : '') + 'সময় লেগেছে ' + clock(used) + ' মিনিট' + (best >= 0 ? ' · আগের সেরা: ' + bn(Math.max(best, ok)) + '/' + bn(N) : '');
    $('#bar').hidden = true; $('#dock').hidden = true; $('#result').hidden = false; $('#filter').hidden = false; $('#after').hidden = false;
    $('#result').classList.remove('fade'); void $('#result').offsetWidth; $('#result').classList.add('fade');
    filter(bad + skip > 0 ? 'miss' : 'all');
    window.scrollTo(0, 0);
    chime(pct >= 60);
  }

  function filter(f) {
    document.querySelectorAll('#filter button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.f === f); });
    cards.forEach(function (c) { c.hidden = f === 'miss' && c.dataset.r === 'ok'; });
    document.querySelectorAll('.stim').forEach(function (s) {
      var n = s.nextElementSibling; s.hidden = f === 'miss' && n && n.dataset.r === 'ok' && (!n.nextElementSibling || n.nextElementSibling.hidden);
    });
    $('#nomiss').hidden = !(f === 'miss' && cards.every(function (c) { return c.hidden; }));
  }

  /* wiring */
  var best0 = store(KEY);
  if (best0 !== null) { $('#best').hidden = false; $('#best').textContent = '⭐ তোমার আগের সেরা নম্বর: ' + bn(best0) + '/' + bn(N); }
  $('#start').addEventListener('click', start);
  $('#submit').addEventListener('click', trySubmit);
  $('#yes').addEventListener('click', function () { submit(false); });
  $('#no').addEventListener('click', function () {
    $('#confirm').hidden = true;
    for (var i = 0; i < N; i++) if (ans[i] === undefined) { cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
  });
  $('#again').addEventListener('click', start);
  document.querySelectorAll('#filter button').forEach(function (b) { b.addEventListener('click', function () { filter(b.dataset.f); }); });
  function snd() { $('#snd').textContent = sound ? '🔊' : '🔇'; $('#snd').setAttribute('aria-label', sound ? 'শব্দ বন্ধ করো' : 'শব্দ চালু করো'); }
  $('#snd').addEventListener('click', function () { sound = !sound; store('im-mt-sound', sound ? '1' : '0'); snd(); });
  snd();
  window.addEventListener('beforeunload', function (e) { if (running && count() > 0) { e.preventDefault(); e.returnValue = ''; } });
})();
