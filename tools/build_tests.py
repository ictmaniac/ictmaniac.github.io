#!/usr/bin/env python3
"""ICT Maniac model test builder.

    python3 tools/build_tests.py          # build every test
    python3 tools/build_tests.py 823ortup # build one test

src/tests/<code>.json  ->  p/<code>/index.html   (the live link never changes)

A test file holds: title, eyebrow, lead, minutes, and qs (each question: s = question,
st = i/ii/iii statements, t = "নিচের কোনটি সঠিক?" line, o = 4 options, a = right option 0-3,
e = explanation, c = stimulus text shared by questions that sit together, b = 1 for board questions).
Shared look and logic: a/mt.css, a/mt.js. Leaderboard: a/lb.js + a/lb-config.js (web app address),
server script tools/leaderboard/Code.gs (lives in the Google Sheet).

EXAM SERIES (each has its own leaderboard "সব টেস্ট মিলিয়ে"):
  book  = src/tests/            (the 30 book model tests, hub 67gsxrfm)
  other = src/exams/<series>/   one folder per series, e.g. src/exams/free/
          _series.json: {"title": "ফ্রি পরীক্ষা", "hub": "<8-char code or omit>"}
          <code>.json : same shape as a book test, plus optional "order": 1, 2, ...
Adding a test or a whole series = add the files and run this script. The script also writes
a/lb-tests.json (list of every test + answer keys) which the Google script reads by itself,
so nothing has to change in the Google Sheet.
"""
import sys, os, json, glob, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, 'src', 'tests'), os.path.join(ROOT, 'p')
V = '3'  # bump after changing a/mt.css, a/mt.js or a/lb.js
LB = 'j7fmpkps'  # leaderboard page code (never change)
LB_SETUP = '7cgxvz62'  # one-time Google Sheet setup guide for mira
EXAMS = os.path.join(ROOT, 'src', 'exams')
BN = str.maketrans('0123456789', '০১২৩৪৫৬৭৮৯')

PAGE = '''<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#F2F7FF">
<title>{title} · ICT Maniac</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap">
<link rel="stylesheet" href="../../a/mt.css?v={v}">
</head>
<body>
<div class="bar" id="bar" hidden><div class="in">
  <span class="timer" id="timer" aria-live="off">⏱</span>
  <div class="done"><span id="done"></span><div class="prog"><i id="prog"></i></div></div>
  <button type="button" id="snd" class="btn" style="flex:none;min-height:40px;padding:4px 10px;border-width:1px">🔊</button>
</div></div>
<div class="wrap">
  <header>
    <span class="brand"><i>IM</i>ICT Maniac</span>
    <span class="eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
  </header>

  <section class="card" id="intro">
    <p>{lead}</p>
    <div class="chips"><span class="chip">📝 {n}টি প্রশ্ন</span><span class="chip y">⏱ {minutes} মিনিট</span><span class="chip g">পূর্ণমান {n}</span></div>
    <ul class="rules">
      <li>প্রতিটি প্রশ্নের মান ১। ভুল উত্তরে নম্বর কাটা যাবে না।</li>
      <li>সঠিক উত্তরে চাপ দাও। মত বদলালে অন্য উত্তরে চাপ দিলেই হবে।</li>
      <li>সময় শেষ হলে পরীক্ষা নিজে থেকেই জমা হয়ে যাবে।</li>
      <li>জমা দেওয়ার পর নম্বর, সঠিক উত্তর আর প্রতিটি ভুলের ব্যাখ্যা দেখবে।</li>
    </ul>
    <p class="best" id="best" hidden></p>
    <div id="lbform"></div>
    <div class="btns"><button type="button" class="btn primary" id="start">▶ পরীক্ষা শুরু করো</button></div>
  </section>

  <section class="card res" id="result" hidden>
    <div class="ring" id="ring"><div><strong id="score"></strong><span id="outof"></span></div></div>
    <p class="cheer" id="cheer"></p>
    <div class="stats"><div class="a"><strong id="sa"></strong>সঠিক</div><div class="b"><strong id="sb"></strong>ভুল</div><div class="c"><strong id="sc"></strong>উত্তর দাওনি</div></div>
    <p class="eyebrow" id="took"></p>
  </section>
  <section class="card lbres" id="lbres" hidden></section>
  <div class="filter" id="filter" hidden role="group" aria-label="কোন প্রশ্ন দেখবে">
    <button type="button" data-f="miss" aria-pressed="true">ভুল ও বাদ পড়া</button><button type="button" data-f="all" aria-pressed="false">সব প্রশ্ন</button>
  </div>
  <p class="card" id="nomiss" hidden>🎉 একটাও ভুল নেই! সব প্রশ্ন দেখতে উপরে "সব প্রশ্ন" চাপো।</p>

  <div id="qs" hidden style="display:flex;flex-direction:column;gap:14px"></div>

  <div class="btns" id="after" hidden>
    <button type="button" class="btn primary" id="again">↻ আবার পরীক্ষা দাও</button>{nextbtn}
  </div>
  <footer><a href="../{hub}/" style="color:inherit">📚 সব টেস্ট</a> · <a href="../{lb}/?s={series}" style="color:inherit">🏆 লিডারবোর্ড</a> · © ICT Maniac</footer>
</div>
<div class="dock" id="dock" hidden><div class="in">
  <div id="confirm" hidden><p class="msg" id="cmsg"></p><div class="btns" style="margin-top:6px"><button type="button" class="btn" id="no">ফিরে যাও</button><button type="button" class="btn green" id="yes">হ্যাঁ, জমা দাও</button></div></div>
  <button type="button" class="btn green" id="submit">✓ জমা দাও</button>
</div></div>
<script>window.MT={data};</script>
<script src="../../a/lb-config.js?v={v}"></script>
<script src="../../a/mt.js?v={v}"></script>
<script src="../../a/lb.js?v={v}"></script>
</body>
</html>
'''


def build(path, series='book', hub=None):
    code = os.path.basename(path)[:-5]
    t = json.load(open(path, encoding='utf-8'))
    qs = t['qs']
    data = json.dumps({'code': code, 'series': series, 'minutes': t['minutes'], 'qs': qs}, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    nxt = t.get('next')
    nextbtn = f'<a class="btn" style="text-align:center;text-decoration:none;display:grid;place-items:center" href="../{nxt[0]}/">{html.escape(nxt[1])} ▶</a>' if nxt else ''
    page = PAGE.format(v=V, hub=hub or HUB, lb=LB, series=series, title=html.escape(t['title']), eyebrow=html.escape(t['eyebrow']), lead=html.escape(t['lead']),
                       n=str(len(qs)).translate(BN), minutes=str(t['minutes']).translate(BN), data=data, nextbtn=nextbtn)
    os.makedirs(os.path.join(OUT, code), exist_ok=True)
    open(os.path.join(OUT, code, 'index.html'), 'w', encoding='utf-8').write(page)


HUB = '67gsxrfm'
HUB_INTRO = 'প্রতিটি অধ্যায়ের টেস্ট আলাদা অংশ (সেগমেন্ট) থেকে। কোন টেস্টে কোন অংশ, নিচে লেখা আছে। প্রতিটি টেস্টে ২৫টি প্রশ্ন, ২৫ মিনিট। জমা দিলে ভুলের ব্যাখ্যা দেখবে।'


def build_hub():
    h = json.load(open(os.path.join(SRC, '_hub.json'), encoding='utf-8'))
    rows = []
    for ch, name in h['ch'].items():
        items = ''.join(
            f'<a class="ti" href="../{t["code"]}/"><b>মডেল টেস্ট {str(t["k"]).translate(BN)}</b><span>{html.escape(t["sec"])} · {html.escape(t["name"])}</span><i>▶</i></a>'
            for t in h['hub'] if t['ch'] == ch)
        rows.append(f'<section class="card"><h2>অধ্যায় {ch.translate(BN)} · {html.escape(name)}</h2>{items}</section>')
    items = ''.join(f'<a class="ti" href="../{t["code"]}/"><b>পূর্ণ সিলেবাস মডেল টেস্ট {str(t["k"]).translate(BN)}</b><span>অধ্যায় ১–৬ · ২৫টি প্রশ্ন</span><i>▶</i></a>'
                    for t in h['hub'] if t['ch'] == 'F')
    rows.append(f'<section class="card"><h2>📘 পুরো বই · পূর্ণ সিলেবাস</h2>{items}</section>')
    page = HUBPAGE.format(v=V, body=''.join(rows)).replace('HUBINTRO', HUB_INTRO).replace("LBHREF", f'../{LB}/?s=book')
    os.makedirs(os.path.join(OUT, HUB), exist_ok=True)
    open(os.path.join(OUT, HUB, 'index.html'), 'w', encoding='utf-8').write(page)


HUBPAGE = '''<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#F2F7FF">
<title>মডেল টেস্ট · ICT Maniac</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="../../a/mt.css?v={v}">
<style>
.card h2{{font-family:var(--f-display);font-size:1.1rem;margin:0 0 10px;color:var(--ink)}}
.ti{{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;text-decoration:none;color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-top:8px;background:#fff}}
.ti b{{font-weight:700;color:var(--blue)}} .ti span{{grid-column:1;font-size:.86rem;color:var(--muted)}} .ti i{{grid-row:1/3;grid-column:2;font-style:normal;color:var(--green);font-size:1.1rem}}
.ti:active{{background:var(--blue-soft)}}
.ti.lbl{{margin:0;background:var(--yellow-soft);border-color:var(--yellow)}} .ti.lbl b{{color:#8A6500}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="brand"><i>IM</i>ICT Maniac</span>
    <span class="eyebrow">HSC ICT · অনলাইন পরীক্ষা</span>
    <h1>মডেল টেস্ট</h1>
  </header>
  <p class="card">HUBINTRO</p>
  <a class="ti lbl" href="LBHREF"><b>🏆 লিডারবোর্ড</b><span>সেরা ২০ জন: প্রতিটি টেস্টে আর সব টেস্ট মিলিয়ে</span><i>▶</i></a>
  {body}
  <footer>© ICT Maniac · HSC ICT মডেল টেস্ট</footer>
</div>
</body>
</html>
'''


def all_series():
    """[(slug, info, [test json paths in order])]"""
    out = []
    h = json.load(open(os.path.join(SRC, '_hub.json'), encoding='utf-8'))
    out.append(('book', {'title': 'ICT Maniac মডেল টেস্ট', 'hub': HUB}, [os.path.join(SRC, t['code'] + '.json') for t in h['hub']]))
    for d in sorted(glob.glob(os.path.join(EXAMS, '*', '_series.json'))):
        slug = os.path.basename(os.path.dirname(d))
        info = json.load(open(d, encoding='utf-8'))
        fs = [f for f in glob.glob(os.path.join(os.path.dirname(d), '*.json')) if not os.path.basename(f).startswith('_')]
        fs.sort(key=lambda f: (json.load(open(f, encoding='utf-8')).get('order', 999), os.path.basename(f)))
        out.append((slug, info, fs))
    return out


def write_registry(series):
    reg = {'lb': LB, 'series': {}}
    for slug, info, fs in series:
        tests = []
        for f in fs:
            t = json.load(open(f, encoding='utf-8'))
            tests.append({'code': os.path.basename(f)[:-5], 'title': t['title'], 'min': t['minutes'],
                          'key': ''.join(str(q['a']) for q in t['qs'])})
        reg['series'][slug] = {'title': info['title'], 'hub': info.get('hub', ''), 'tests': tests}
    open(os.path.join(ROOT, 'a', 'lb-tests.json'), 'w', encoding='utf-8').write(json.dumps(reg, ensure_ascii=False, separators=(',', ':')))


def build_series_hub(slug, info, fs):
    items = ''
    for f in fs:
        t = json.load(open(f, encoding='utf-8'))
        items += f'<a class="ti" href="../{os.path.basename(f)[:-5]}/"><b>{html.escape(t["title"])}</b><span>{html.escape(t.get("eyebrow", ""))}</span><i>▶</i></a>'
    body = f'<section class="card"><h2>{html.escape(info["title"])}</h2>{items}</section>'
    page = HUBPAGE.format(v=V, body=body).replace('HUBINTRO', HUB_INTRO).replace('<h1>মডেল টেস্ট</h1>', f'<h1>{html.escape(info["title"])}</h1>')
    page = page.replace(HUB_INTRO, html.escape(info.get('lead', 'প্রতিটি পরীক্ষা শেষে নম্বর আর ভুলের ব্যাখ্যা দেখবে।')))
    page = page.replace("LBHREF", f'../{LB}/?s={slug}')
    os.makedirs(os.path.join(OUT, info['hub']), exist_ok=True)
    open(os.path.join(OUT, info['hub'], 'index.html'), 'w', encoding='utf-8').write(page)


def build_lb_page():
    src = open(os.path.join(ROOT, 'tools', 'leaderboard', 'page.html'), encoding='utf-8').read().replace('{v}', V)
    os.makedirs(os.path.join(OUT, LB), exist_ok=True)
    open(os.path.join(OUT, LB, 'index.html'), 'w', encoding='utf-8').write(src)
    gs = open(os.path.join(ROOT, 'tools', 'leaderboard', 'Code.gs'), encoding='utf-8').read()
    src = open(os.path.join(ROOT, 'tools', 'leaderboard', 'setup.html'), encoding='utf-8').read().replace('{v}', V).replace('{code}', html.escape(gs))
    os.makedirs(os.path.join(OUT, LB_SETUP), exist_ok=True)
    open(os.path.join(OUT, LB_SETUP, 'index.html'), 'w', encoding='utf-8').write(src)


def main():
    pick = sys.argv[1] if len(sys.argv) > 1 else ''
    n = 0
    series = all_series()
    for slug, info, fs in series:
        for f in fs:
            if pick and os.path.basename(f)[:-5] != pick:
                continue
            build(f, slug, info.get('hub')); n += 1
        if slug != 'book' and info.get('hub') and not pick:
            build_series_hub(slug, info, fs); n += 1
    if not pick or pick == HUB:
        build_hub(); n += 1
    write_registry(series)
    build_lb_page()
    print(f'built {n} page(s) + leaderboard + a/lb-tests.json')


if __name__ == '__main__':
    main()
