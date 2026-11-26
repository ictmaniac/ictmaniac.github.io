#!/usr/bin/env python3
"""ICT Maniac page builder.

    python3 tools/build.py          # build every chapter
    python3 tools/build.py ch2      # build one chapter
    python3 tools/build.py 8g1t74ck # build one page

src/chN/<code>.html  ->  p/<code>/index.html   (the live link never changes)

A source file starts with front-matter (ch, kit, three, title, eyebrow, h1, lead; three: 1 adds the 3D kit), then an
optional <style>, the page body, and the page <script>. A file without front-matter is a
complete page and is copied as it is.
"""
import sys, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, 'src'), os.path.join(ROOT, 'p')
V = '14'  # bump after changing a/im.css or a/im.js so phones load the new kit

FONTS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap">'''
TOP = '''<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>{title} · ICT Maniac</title>
''' + FONTS + '''
<link rel="stylesheet" href="../../a/im.css?v={v}">
{style}</head>
'''
HEADER = '''<div class="wrap">
  <header>
    <span class="brand"><i>IM</i>ICT Maniac</span>
    <span class="eyebrow">অধ্যায় {ch} · {eyebrow}</span>
    <h1>{h1}</h1>
    <p class="lead">{lead}</p>
  </header>
'''
FOOT = '  <footer>© ICT Maniac · HSC ICT ইন্টারঅ্যাক্টিভ ল্যাব</footer>\n</div>\n'
EXPL = '  <div class="explain" id="ex" aria-live="polite"><span class="tag" id="extag">শুরু</span><p id="extx"></p></div>\n'
DOCK = '<div class="dock"><div class="in"><button class="pv" aria-label="আগের ধাপ">◀</button><button class="nx">পরের ধাপ ▶</button><button class="au" aria-pressed="false"><span>▶ অটো</span><i class="tm"></i></button><div class="spd" role="group" aria-label="গতি"><span>গতি</span><button data-s="0.55">🐢 ধীরে</button><button data-s="1" class="sel">স্বাভাবিক</button><button data-s="1.8">🐇 দ্রুত</button></div><div class="bar"><i></i></div><div class="cnt"></div></div></div>\n'


def page(txt):
    m = re.match(r'---\n(.*?)\n---\n', txt, re.S)
    if not m:  # complete page: only refresh the kit version
        return re.sub(r'(a/im(?:\.css|\.js|story\.js|3d\.js))\?v=\d+', r'\1?v=' + V, txt)
    meta = dict(l.split(': ', 1) for l in m.group(1).splitlines())
    rest = txt[m.end():]
    style = ''
    sm = re.search(r'<style>.*?</style>\n?', rest, re.S)
    if sm:
        style, rest = sm.group(0), rest.replace(sm.group(0), '')
    i = rest.find('<script>')
    body, script = (rest[:i], rest[i:]) if i >= 0 else (rest, '')
    kit = meta.get('kit') == '1'
    return (TOP.format(v=V, title=meta['title'], style=style)
            + ('<body class="kit">\n' if kit else '<body>\n')
            + HEADER.format(ch=meta.get('ch', '৩'), eyebrow=meta['eyebrow'], h1=meta['h1'], lead=meta['lead'])
            + (EXPL if kit else '') + body.rstrip() + '\n' + FOOT
            + (DOCK if kit else '') + f'<script src="../../a/im.js?v={V}"></script>\n'
            + (f'<script src="../../a/three.min.js"></script>\n<script src="../../a/im3d.js?v={V}"></script>\n' if meta.get('three') == '1' else '')
            + (f'<script src="../../a/imstory.js?v={V}"></script>\n' if meta.get('story') == '1' else '')
            + script.strip() + '\n</body>\n</html>\n')


def main():
    pick = sys.argv[1] if len(sys.argv) > 1 else ''
    files = sorted(glob.glob(os.path.join(SRC, 'ch*', '*.html')))
    n = 0
    for f in files:
        ch, code = os.path.basename(os.path.dirname(f)), os.path.basename(f)[:-5]
        if pick and pick not in (ch, code):
            continue
        os.makedirs(os.path.join(OUT, code), exist_ok=True)
        open(os.path.join(OUT, code, 'index.html'), 'w', encoding='utf-8').write(page(open(f, encoding='utf-8').read()))
        n += 1
    print(f'built {n} page(s)')
    # hub pages (complete html in src/hub/<code>.html, copied as is)
    for f in glob.glob(os.path.join(SRC, 'hub', '*.html')):
        code = os.path.basename(f)[:-5]; os.makedirs(os.path.join(OUT, code), exist_ok=True)
        open(os.path.join(OUT, code, 'index.html'), 'w', encoding='utf-8').write(open(f, encoding='utf-8').read())
    readme()


def readme():
    # README.md and links.csv are rebuilt every time, so the lists always match the pages.
    # links.csv keeps any YouTube link typed into it.
    import csv, json
    BN = '০১২৩৪৫৬৭৮৯'
    bn = lambda x: str(x).translate(str.maketrans('0123456789', BN))
    URL = 'https://ictmaniac.github.io/p/{}/'
    def key(x):  # sort by topic number like 2.1.10 after 2.1.9
        nums = re.findall(r'\d+', x[1].translate(str.maketrans(BN, '0123456789')).split(' ')[0])
        return [int(k) for k in nums] or [999]
    rows = {}
    for f in sorted(glob.glob(os.path.join(SRC, 'ch*', '*.html'))):
        ch, code = os.path.basename(os.path.dirname(f)), os.path.basename(f)[:-5]
        t = open(f, encoding='utf-8').read()
        m = re.match(r'---\n(.*?)\n---\n', t, re.S)
        if m:
            meta = dict(l.split(': ', 1) for l in m.group(1).splitlines()); topic, h1 = meta['eyebrow'], meta['h1']
        else:
            topic = re.sub(r'<[^>]+>', '', re.search(r'class="eyebrow"[^>]*>(.*?)<', t, re.S).group(1)).replace('অধ্যায় ৩ · ', '')
            h1 = re.sub(r'<[^>]+>', '', re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S).group(1))
        rows.setdefault(ch, []).append((code, topic.strip(), h1.strip()))
    # model tests (built by tools/build_tests.py)
    tests, hub = {}, None
    for f in sorted(glob.glob(os.path.join(SRC, 'tests', '*.json'))):
        code = os.path.basename(f)[:-5]
        try: d = json.load(open(f, encoding='utf-8'))
        except Exception: continue
        if code.startswith('_') or 'title' not in d: continue
        m = re.match(r'অধ্যায় ([১-৬])', d['title'])
        ch = 'ch' + str(BN.index(m.group(1))) if m else 'full'
        num = [int(k) for k in re.findall(r'\d+', d['title'].translate(str.maketrans(BN, '0123456789')))][-1:] or [0]
        tests.setdefault(ch, []).append((num, code, d['title'], d.get('eyebrow', '')))
    try:
        hub = re.search(r"HUB = '(\w+)'", open(os.path.join(ROOT, 'tools', 'build_tests.py'), encoding='utf-8').read()).group(1)
    except Exception: pass
    # master link list
    LP = os.path.join(ROOT, 'links.csv'); yt = {}
    if os.path.exists(LP):
        for r in csv.reader(open(LP, encoding='utf-8-sig')):
            if len(r) > 1 and re.fullmatch(r'[a-z0-9]{8}', r[0]): yt[r[0]] = r[1].strip()
    lines = [['কোড', 'ইউটিউব লিংক', 'অধ্যায়', 'ধরন', 'টপিক', 'পেজের নাম', 'পেজের লিংক']]
    out = [open(os.path.join(ROOT, 'tools', 'README.head.md'), encoding='utf-8').read().rstrip(), '']
    if hub: out += [f'**সব মডেল টেস্ট এক জায়গায় (হাব):** {URL.format(hub)}', '']
    total = 0
    for ch in sorted(rows, key=lambda c: int(c[2:])):
        n = bn(int(ch[2:]))
        out += [f'## অধ্যায় {n}', '', f'### অ্যানিমেশন (`src/{ch}/`)', '', '| টপিক | পেজের নাম | লিংক | ভিডিও |', '|---|---|---|---|']
        for code, topic, h1 in sorted(rows[ch], key=key):
            v = yt.get(code, '')
            out.append(f'| {topic} | {h1} | [`{code}`]({URL.format(code)}) | {"[▶ ইউটিউব](" + v + ")" if v else "–"} |'); total += 1
            lines.append([code, v, n, 'অ্যানিমেশন', topic, h1, URL.format(code)])
        if tests.get(ch):
            out += ['', '### মডেল টেস্ট (`src/tests/`)', '', '| টেস্ট | কোন অংশ | লিংক |', '|---|---|---|']
            for _, code, title, eb in sorted(tests[ch]):
                out.append(f'| {title} | {eb} | [`{code}`]({URL.format(code)}) |')
                lines.append([code, yt.get(code, ''), n, 'মডেল টেস্ট', eb, title, URL.format(code)])
        out.append('')
    if tests.get('full'):
        out += ['## পূর্ণ সিলেবাস মডেল টেস্ট', '', '| টেস্ট | লিংক |', '|---|---|']
        for _, code, title, eb in sorted(tests['full']):
            out.append(f'| {title} | [`{code}`]({URL.format(code)}) |')
            lines.append([code, yt.get(code, ''), 'পুরো বই', 'মডেল টেস্ট', eb, title, URL.format(code)])
        out.append('')
    nt = sum(len(v) for v in tests.values())
    out.append(f'মোট: অ্যানিমেশন {bn(total)}টি, মডেল টেস্ট {bn(nt)}টি')
    open(os.path.join(ROOT, 'README.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    with open(LP, 'w', encoding='utf-8', newline='') as fh: csv.writer(fh, lineterminator='\n').writerows(lines)


if __name__ == '__main__':
    main()
