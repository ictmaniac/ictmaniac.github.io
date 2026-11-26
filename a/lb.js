/* ICT Maniac leaderboard: name + mobile before the test, send result after, show rank + top list.
   Off when window.IM_LB_URL is empty. Server: tools/leaderboard/Code.gs */
(function () {
  'use strict';
  var URL = window.IM_LB_URL, D = window.MT, PAGE = window.IM_LB_PAGE || 'j7fmpkps';
  if (!URL || !D) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var BN = '০১২৩৪৫৬৭৮৯';
  function bn(n) { return String(n).replace(/\d/g, function (d) { return BN[d]; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function clock(s) { return bn(Math.floor(s / 60)) + ':' + bn(('0' + (s % 60)).slice(-2)); }
  function cleanPhone(p) {
    p = String(p || '').replace(/[০-৯]/g, function (d) { return BN.indexOf(d); }).replace(/[\s\-()]/g, '').replace(/^\+?88/, '');
    return /^01[3-9]\d{8}$/.test(p) ? p : '';
  }
  var series = D.series || 'book', lbHref = '../' + PAGE + '/?s=' + encodeURIComponent(series);

  /* 1. form in the intro card */
  var box = $('#lbform');
  if (!box) return;
  box.className = 'lbform';
  box.innerHTML =
    '<p class="lbh">🏆 লিডারবোর্ডে নাম তুলতে নিচের দুটো ঘর পূরণ করো</p>' +
    '<label>তোমার নাম<input id="lbName" maxlength="20" autocomplete="name" placeholder="যেমন: রাফি"></label>' +
    '<label>মোবাইল নম্বর<input id="lbPhone" type="tel" inputmode="numeric" maxlength="14" autocomplete="tel" placeholder="01XXXXXXXXX"></label>' +
    '<input id="lbHp" tabindex="-1" autocomplete="off" aria-hidden="true" class="hp">' +
    '<p class="lberr" id="lbErr" role="alert"></p>' +
    '<p class="lbnote">🔒 পুরো মোবাইল নম্বর কেউ দেখবে না। লিডারবোর্ডে নামের পাশে শুধু শেষের ৩টা সংখ্যা থাকবে। <a href="' + lbHref + '">লিডারবোর্ড দেখো ›</a></p>';
  $('#lbName').value = store('im-lb-name') || '';
  $('#lbPhone').value = store('im-lb-phone') || '';

  function check() {
    var n = $('#lbName').value.replace(/\s+/g, ' ').trim(), p = cleanPhone($('#lbPhone').value), e = '', bad = null;
    $('#lbName').classList.remove('bad'); $('#lbPhone').classList.remove('bad');
    if (n.length < 2) { e = 'তোমার নাম লেখো (কমপক্ষে ২ অক্ষর)।'; bad = $('#lbName'); }
    else if (!p) { e = 'মোবাইল নম্বরটা ঠিক নেই। ১১ সংখ্যার হবে, যেমন 01712345678'; bad = $('#lbPhone'); }
    $('#lbErr').textContent = e;
    if (bad) { bad.classList.add('bad'); bad.focus(); return false; }
    store('im-lb-name', n); store('im-lb-phone', p); $('#lbPhone').value = p;
    return true;
  }

  /* 2. after submit */
  var MSG = {
    wait: 'একটু আগেই একবার জমা দিয়েছ। ১ মিনিট পরে আবার পরীক্ষা দিলে নম্বর জমা হবে।',
    many: 'অল্প সময়ে অনেকবার জমা দিয়েছ। কয়েক ঘণ্টা পরে আবার চেষ্টা করো।',
    fast: 'খুব তাড়াতাড়ি জমা দিয়েছ, তাই এই নম্বর লিডারবোর্ডে যায়নি। প্রশ্ন পড়ে উত্তর দাও।',
    phone: 'মোবাইল নম্বরটা ঠিক নেই।', name: 'এই নামটা নেওয়া যাচ্ছে না। অন্য নাম দাও।',
    blocked: 'এই নম্বর থেকে লিডারবোর্ডে জমা বন্ধ আছে।', busy: 'এখন অনেকে একসাথে জমা দিচ্ছে। একটু পরে আবার চেষ্টা করো।',
    time: 'সময়ের হিসাবে গোলমাল হয়েছে, তাই নম্বর জমা হয়নি।', test: 'এই টেস্টটা লিডারবোর্ডে নেই।', bad: 'নম্বর জমা হয়নি।'
  };
  var res = $('#lbres');
  function table(top, me) {
    if (!top || !top.length) return '';
    return '<table class="lbt"><thead><tr><th>ক্রম</th><th>নাম</th><th class="r">নম্বর</th><th class="r">সময়</th></tr></thead><tbody>' +
      top.slice(0, 10).map(function (x, i) {
        var mine = me && x.t === me.t && x.n === me.n;
        return '<tr' + (mine ? ' class="me"' : '') + '><td class="k">' + (['🥇', '🥈', '🥉'][i] || bn(i + 1)) + '</td><td>' + esc(x.n) + ' <span class="tl">…' + bn(x.t) + '</span>' + (mine ? ' <b class="you">(তুমি)</b>' : '') +
          '</td><td class="r s">' + bn(x.s) + '</td><td class="r d">' + clock(x.d) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  function show(html) { res.hidden = false; res.innerHTML = '<h2>🏆 লিডারবোর্ড</h2>' + html + '<a class="btn lbgo" href="' + lbHref + '&t=' + D.code + '">পুরো লিডারবোর্ড দেখো ›</a>'; }

  function send(item, cb) {
    fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(item) })
      .then(function (r) { return r.json(); })
      .then(function (j) { cb(null, j); }, function (e) { cb(e || 1); });
  }
  function done(ans, secs) {
    var name = store('im-lb-name'), phone = store('im-lb-phone');
    if (!name || !phone) return;
    var item = { test: D.code, name: name, phone: phone, ans: ans, secs: secs, hp: ($('#lbHp') || {}).value || '' };
    show('<p class="lbwait"><span class="spin"></span> তোমার নম্বর লিডারবোর্ডে জমা হচ্ছে…</p>');
    send(item, function (err, j) {
      if (err) {
        var q = []; try { q = JSON.parse(store('im-lb-q') || '[]'); } catch (e) {}
        q.push(item); store('im-lb-q', JSON.stringify(q.slice(-5)));
        show('<p class="lbmsg">📶 ইন্টারনেট পাওয়া যায়নি। চিন্তা নেই, পরে যেকোনো টেস্ট পেজ খুললে নম্বর নিজে থেকে জমা হবে।</p>'); return;
      }
      if (!j.ok) { show('<p class="lbmsg">' + (MSG[j.err] || MSG.bad) + '</p>'); return; }
      var me = { n: name, t: phone.slice(-3) }, h = '';
      if (j.test) h += '<p class="lbrank">এই টেস্টে তুমি <b>' + bn(j.test.rank) + '</b> নম্বরে <span>(' + bn(j.test.of) + ' জনের মধ্যে)</span></p>';
      if (j.all) h += '<p class="lbrank2">সব টেস্ট মিলিয়ে তুমি <b>' + bn(j.all.rank) + '</b> নম্বরে · মোট নম্বর ' + bn(j.all.s) + ' (' + bn(j.all.k) + 'টি টেস্ট)</p>';
      if (!j.improved) h += '<p class="lbnote">লিডারবোর্ডে তোমার আগের সেরা নম্বরটাই রাখা হয়েছে।</p>';
      show(h + table(j.top, me));
    });
  }

  /* 3. results that could not be sent earlier (no internet) */
  (function flush() {
    var q = []; try { q = JSON.parse(store('im-lb-q') || '[]'); } catch (e) {}
    if (!q.length) return;
    var item = q.shift();
    send(item, function (err) { if (!err) store('im-lb-q', q.length ? JSON.stringify(q) : null); });
  })();

  window.IMLB = { check: check, done: done };
})();
