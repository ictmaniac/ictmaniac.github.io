/**
 * ICT Maniac leaderboard (Google Apps Script web app).
 * Paste this whole file into Extensions > Apps Script of the leaderboard Google Sheet,
 * then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * Nothing else to set: it reads the list of tests (and answer keys) from the website itself,
 * so new tests and new exam series work automatically.
 *
 * Sheets it makes by itself:
 *   best    one row per (mobile, test): the best score. The leaderboard is made from this.
 *   log     every accepted submission (for your records).
 *   blocked optional: put a mobile number in column A to hide and block it.
 */
var REG_URL = 'https://ictmaniac.github.io/a/lb-tests.json';
var TOP = 20;
var GAP_SEC = 45;        // same mobile cannot submit again within 45 seconds
var MAX_PER_6H = 40;     // max submissions per mobile in 6 hours
var MAX_PER_MIN = 400;   // max submissions for the whole site per minute
var BEST_HEAD = ['key', 'series', 'test', 'phone', 'name', 'score', 'total', 'secs', 'attempts', 'updated'];
var LOG_HEAD = ['time', 'series', 'test', 'phone', 'name', 'score', 'total', 'secs'];

/* ---------- pure helpers (no Google services; tested offline) ---------- */
var BAD = ['fuck', 'shit', 'bitch', 'চোদ', 'মাগি', 'খানকি', 'বাল ', 'শালা', 'হারামি'];
function cleanPhone(p) {
  p = String(p || '').replace(/[০-৯]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.indexOf(d); }).replace(/[\s\-()]/g, '').replace(/^\+?88/, '');
  return /^01[3-9]\d{8}$/.test(p) ? p : '';
}
function cleanName(n) {
  n = String(n || '').replace(/[<>"'`\\{}\[\]=]/g, '').replace(/[\u0000-\u001f​-‏]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  if (n.length < 2) return '';
  var low = (n + ' ').toLowerCase();
  for (var i = 0; i < BAD.length; i++) if (low.indexOf(BAD[i]) >= 0) return '';
  if (/https?:|www\.|\.com/i.test(n)) return '';
  return n;
}
function tail(phone) { return String(phone).slice(-3); }

/* check one submission against the registry; returns {err} or {series, test, score, total, secs, phone, name} */
function checkSubmit(b, reg) {
  if (!b || typeof b !== 'object') return { err: 'bad' };
  if (b.hp) return { err: 'bad' };                                   // hidden trap field filled = robot
  var phone = cleanPhone(b.phone); if (!phone) return { err: 'phone' };
  var name = cleanName(b.name); if (!name) return { err: 'name' };
  var found = null, series = null;
  for (var s in reg.series) {
    var ts = reg.series[s].tests;
    for (var i = 0; i < ts.length; i++) if (ts[i].code === b.test) { found = ts[i]; series = s; }
  }
  if (!found) return { err: 'test' };
  var key = found.key, ans = b.ans;
  if (!ans || ans.length !== key.length) return { err: 'bad' };
  var score = 0;
  for (var k = 0; k < key.length; k++) if (String(ans.charAt ? ans.charAt(k) : ans[k]) === key.charAt(k)) score++;
  var secs = Math.round(+b.secs || 0), maxS = found.min * 60 + 30;
  if (!(secs > 0) || secs > maxS) return { err: 'time' };
  if (score > 0 && secs < Math.max(20, key.length * 2)) return { err: 'fast' }; // faster than 2 sec per question: not a person
  return { series: series, test: found.code, total: key.length, score: score, secs: secs, phone: phone, name: name };
}

/* rows = values of the 'best' sheet without header */
function rankTest(rows, test, blocked) {
  var l = [];
  rows.forEach(function (r) { if (r[2] === test && !blocked[r[3]]) l.push({ phone: String(r[3]), name: r[4], score: +r[5], total: +r[6], secs: +r[7], when: +new Date(r[9]) }); });
  l.sort(function (a, b) { return b.score - a.score || a.secs - b.secs || a.when - b.when; });
  return l;
}
function rankSeries(rows, series, blocked) {
  var m = {};
  rows.forEach(function (r) {
    if (r[1] !== series || blocked[r[3]]) return;
    var p = String(r[3]), w = +new Date(r[9]), x = m[p] || (m[p] = { phone: p, name: r[4], score: 0, secs: 0, tests: 0, when: w, last: 0 });
    x.score += +r[5]; x.secs += +r[7]; x.tests++;
    if (w >= x.last) { x.last = w; x.name = r[4]; }
  });
  var l = Object.keys(m).map(function (k) { return m[k]; });
  l.sort(function (a, b) { return b.score - a.score || a.secs - b.secs || a.when - b.when; });
  return l;
}
function pub(l) {
  return l.slice(0, TOP).map(function (x) { return { n: x.name, t: tail(x.phone), s: x.score, d: x.secs, k: x.tests || undefined }; });
}
function rankOf(l, phone) {
  for (var i = 0; i < l.length; i++) if (l[i].phone === phone) return { rank: i + 1, of: l.length, s: l[i].score, d: l[i].secs, k: l[i].tests || undefined };
  return null;
}

/* ---------- Google side ---------- */
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name, head) {
  var sh = ss().getSheetByName(name);
  if (!sh) {
    sh = ss().insertSheet(name);
    if (head) { sh.appendRow(head); sh.setFrozenRows(1); sh.getRange('A:Z').setNumberFormat('@'); sh.getRange(1, 1, 1, head.length).setFontWeight('bold'); }
  }
  return sh;
}
function registry() {
  var c = CacheService.getScriptCache(), r = c.get('reg');
  if (r) return JSON.parse(r);
  var txt = UrlFetchApp.fetch(REG_URL + '?t=' + Date.now(), { muteHttpExceptions: true }).getContentText();
  var j = JSON.parse(txt);
  try { c.put('reg', txt, 600); } catch (e) {}
  return j;
}
function bestRows() {
  var sh = sheet('best', BEST_HEAD), n = sh.getLastRow();
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, BEST_HEAD.length).getValues();
}
function blockedSet() {
  var sh = ss().getSheetByName('blocked'), s = {};
  if (sh && sh.getLastRow() > 0) sh.getRange(1, 1, sh.getLastRow(), 1).getValues().forEach(function (r) { var v = String(r[0]).trim(); if (/^1[3-9]\d{8}$/.test(v)) v = '0' + v; var p = cleanPhone(v); if (p) s[p] = 1; });
  return s;
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.ping) return out({ ok: true, v: 1 });
  var series = String(p.series || 'book'), test = String(p.test || ''), me = cleanPhone(p.me);
  var c = CacheService.getScriptCache(), ck = 'lb|' + series + '|' + test;
  var top = c.get(ck), rows = null, blocked = null, l = null;
  if (!top || me) { rows = bestRows(); blocked = blockedSet(); l = test ? rankTest(rows, test, blocked) : rankSeries(rows, series, blocked); }
  if (!top) { top = JSON.stringify({ top: pub(l), count: l.length }); try { c.put(ck, top, 60); } catch (x) {} }
  var o = JSON.parse(top); o.ok = true;
  if (me && l) o.me = rankOf(l, me);
  return out(o);
}

function doPost(e) {
  var b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, err: 'bad' }); }
  var reg; try { reg = registry(); } catch (x) { return out({ ok: false, err: 'busy' }); }
  var v = checkSubmit(b, reg);
  if (v.err) return out({ ok: false, err: v.err });
  var c = CacheService.getScriptCache();
  if (blockedSet()[v.phone]) return out({ ok: false, err: 'blocked' });
  if (c.get('gap|' + v.phone)) return out({ ok: false, err: 'wait' });
  var hk = 'n6|' + v.phone, hn = +(c.get(hk) || 0);
  if (hn >= MAX_PER_6H) return out({ ok: false, err: 'many' });
  var mk = 'min|' + Math.floor(Date.now() / 60000), mn = +(c.get(mk) || 0);
  if (mn >= MAX_PER_MIN) return out({ ok: false, err: 'busy' });

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (x) { return out({ ok: false, err: 'busy' }); }
  var improved = false, now = new Date();
  try {
    c.put('gap|' + v.phone, '1', GAP_SEC); c.put(hk, String(hn + 1), 21600); c.put(mk, String(mn + 1), 120);
    sheet('log', LOG_HEAD).appendRow([now.toISOString(), v.series, v.test, v.phone, v.name, v.score, v.total, v.secs]);
    var sh = sheet('best', BEST_HEAD), key = v.phone + '|' + v.test;
    var hit = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(key).matchEntireCell(true).findNext() : null;
    if (!hit) { sh.appendRow([key, v.series, v.test, v.phone, v.name, v.score, v.total, v.secs, 1, now.toISOString()]); improved = true; }
    else {
      var r = hit.getRow(), old = sh.getRange(r, 1, 1, BEST_HEAD.length).getValues()[0];
      improved = v.score > +old[5] || (v.score === +old[5] && v.secs < +old[7]);
      sh.getRange(r, 5).setValue(v.name);
      sh.getRange(r, 9).setValue(+old[8] + 1);
      if (improved) { sh.getRange(r, 6, 1, 3).setValues([[v.score, v.total, v.secs]]); sh.getRange(r, 10).setValue(now.toISOString()); }
    }
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  c.removeAll(['lb|' + v.series + '|' + v.test, 'lb|' + v.series + '|']);
  var rows = bestRows(), bl = blockedSet();
  var lt = rankTest(rows, v.test, bl), ls = rankSeries(rows, v.series, bl);
  return out({ ok: true, score: v.score, total: v.total, improved: improved, test: rankOf(lt, v.phone), all: rankOf(ls, v.phone), top: pub(lt), series: v.series });
}

/* Run once from the editor (▶ Run "setup") if you want the sheets made before the first student comes. */
function setup() { sheet('best', BEST_HEAD); sheet('log', LOG_HEAD); registry(); }
