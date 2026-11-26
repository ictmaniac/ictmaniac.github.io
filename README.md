# ICT Maniac: অ্যানিমেশন আর মডেল টেস্ট

HSC ICT বইয়ের প্রতিটা টপিকের অ্যানিমেশন পেজ আর মডেল টেস্ট। সব লিংক `https://ictmaniac.github.io/p/<কোড>/` এই রকম।

> **নিয়ম:** বইয়ে যে লিংক ছাপা হয়েছে, তার কোড কখনো বদলাবে না। পেজের ভিতরের জিনিস বদলানো যায়, লিংক একই থাকে।

## ইউটিউব লিংক কীভাবে বসাবেন (কম্পিউটার বা ফোনের ব্রাউজারে)

1. এই রিপোজিটরিতে [`links.csv`](links.csv) ফাইলটা খুলুন। এটাই সব লিংকের **মূল তালিকা**।
2. উপরে ডানে ✏️ (Edit) চাপুন।
3. যে টপিকের লাইন, তার **প্রথম কমার পরে** ইউটিউব লিংকটা বসান। যেমন:
   `ehqwxpk4,https://youtu.be/xxxx,৩,অ্যানিমেশন,...`
4. নিচে সবুজ **Commit changes** চাপুন।

২–৫ মিনিট পরে ওই অ্যানিমেশন পেজের উপরে লাল "▶ ইউটিউবে ভিডিও দেখো" বোতাম নিজে থেকেই চলে আসবে। বইয়ের লিংক বদলাতে হবে না।

## ফোল্ডার কোথায় কী

| ফোল্ডার / ফাইল | কী আছে |
|---|---|
| `links.csv` | সব পেজের মূল তালিকা: কোড, ইউটিউব লিংক, অধ্যায়, টপিক, পেজের লিংক। |
| `src/ch1/` … `src/ch6/` | অধ্যায়ভিত্তিক অ্যানিমেশনের মূল ফাইল। ফাইলের নাম = পেজের কোড। |
| `src/tests/` | ৩০টা মডেল টেস্টের প্রশ্ন (প্রতিটা টেস্ট একটা ফাইল)। |
| `p/<কোড>/` | লাইভ পেজ। নিজে নিজে তৈরি হয়, হাতে বদলাবেন না। |
| `a/` | সব পেজের কমন ডিজাইন, বোতাম, সাউন্ড, 3D। |
| `tools/` | পেজ বানানোর স্ক্রিপ্ট (Claude চালায়)। |

ভিডিও ফাইল (MP4) এখানে রাখা হয় না, কারণ এই রিপোজিটরি পাবলিক। ভিডিও আলাদা প্রাইভেট জায়গায় থাকে।

<details><summary>টেকনিক্যাল নোট (Claude এর জন্য)</summary>

- এডিট: `src/chN/<কোড>.html`, তারপর `python3 tools/build.py [chN|কোড]`। টেস্ট: `python3 tools/build_tests.py`। তারপর `main` এ পুশ।
- `a/im.css`, `a/im.js`, `a/im3d.js`, `a/imstory.js` বদলালে `tools/build.py` এর `V` এক বাড়াও।
- build চালালে এই README আর `links.csv` নতুন করে লেখা হয়; `links.csv` এর ইউটিউব কলাম রেখে দেওয়া হয়।
- নতুন পেজ: `src/chN/` এ ৮ অক্ষরের এলোমেলো কোড দিয়ে ফাইল।
</details>

## সব পেজের তালিকা

**সব মডেল টেস্ট এক জায়গায় (হাব):** https://ictmaniac.github.io/p/67gsxrfm/

## অধ্যায় ১

### অ্যানিমেশন (`src/ch1/`)

| টপিক | পেজের নাম | লিংক | ভিডিও |
|---|---|---|---|
| ১.১ বিশ্বগ্রামের ধারণা (Global Village) | পৃথিবী যখন একটা গ্রাম | [`72smqlhw`](https://ictmaniac.github.io/p/72smqlhw/) | – |
| ১.৫ চিকিৎসা: টেলিমেডিসিন (Telemedicine) | গ্রামে বসেই শহরের ডাক্তার | [`a3ehriwo`](https://ictmaniac.github.io/p/a3ehriwo/) | – |
| ১.১৩ ভার্চুয়াল রিয়েলিটি (Virtual Reality) | চশমার ভিতরের জগৎ | [`3rp8l45m`](https://ictmaniac.github.io/p/3rp8l45m/) | – |
| ১.১৪.২ রোবটিকস (Robotics) | রোবট কীভাবে কাজ করে | [`gmspei8o`](https://ictmaniac.github.io/p/gmspei8o/) | – |
| ১.১৪.৩ ক্রায়োসার্জারি (Cryosurgery) | বরফ দিয়ে টিউমার ধ্বংস | [`oyllzd9d`](https://ictmaniac.github.io/p/oyllzd9d/) | – |
| ১.১৪.৭ বায়োমেট্রিক্স (Biometrics) | আঙুলের ছাপই চাবি | [`rchirvfg`](https://ictmaniac.github.io/p/rchirvfg/) | – |
| ১.১৪.৯ জেনেটিক ইঞ্জিনিয়ারিং (Genetic Engineering) | ব্যাকটেরিয়া দিয়ে ইনসুলিন বানানো | [`lt7c6wi0`](https://ictmaniac.github.io/p/lt7c6wi0/) | – |
| ১.১৪.১০ ন্যানোটেকনোলজি (Nanotechnology) | ১ ন্যানোমিটার কত ছোট? | [`8o2dm42p`](https://ictmaniac.github.io/p/8o2dm42p/) | – |

### মডেল টেস্ট (`src/tests/`)

| টেস্ট | কোন অংশ | লিংক |
|---|---|---|
| অধ্যায় ১ · মডেল টেস্ট ১ | ১.০–১.১২ · ICT ধারণা, বিশ্বগ্রাম ও দৈনন্দিন জীবনে আইসিটি | [`823ortup`](https://ictmaniac.github.io/p/823ortup/) |
| অধ্যায় ১ · মডেল টেস্ট ২ | ১.১৩–১.১৪.৬ · ভার্চুয়াল রিয়েলিটি, কৃত্রিম বুদ্ধিমত্তা, রোবটিকস, ক্রায়োসার্জারি ও মহাকাশ | [`wjt8a1zu`](https://ictmaniac.github.io/p/wjt8a1zu/) |
| অধ্যায় ১ · মডেল টেস্ট ৩ | ১.১৪.৭–১.১৭ · বায়োমেট্রিক্স, বায়োইনফরমেটিক্স, জেনেটিক ইঞ্জিনিয়ারিং, ন্যানো ও নৈতিকতা | [`274707ms`](https://ictmaniac.github.io/p/274707ms/) |

## অধ্যায় ২

### অ্যানিমেশন (`src/ch2/`)

| টপিক | পেজের নাম | লিংক | ভিডিও |
|---|---|---|---|
| ২.১.২ ডেটা কমিউনিকেশনের উপাদান | একটা মেসেজের যাত্রা | [`0h900q43`](https://ictmaniac.github.io/p/0h900q43/) | – |
| ২.১.৩ ব্যান্ডউইডথ: ডেটা ট্রান্সমিশন স্পিড | পাইপ যত মোটা, ডেটা তত দ্রুত | [`rfjr4eut`](https://ictmaniac.github.io/p/rfjr4eut/) | – |
| ২.১.৪ ডেটা ট্রান্সমিশন মেথড | এসিনক্রোনাস, সিনক্রোনাস, আইসোক্রোনাস | [`y80jih3j`](https://ictmaniac.github.io/p/y80jih3j/) | – |
| ২.১.৫ ডেটা ট্রান্সমিশন মোড | ডেটা কোন দিকে, কার কাছে যায় | [`b9z9xdq4`](https://ictmaniac.github.io/p/b9z9xdq4/) | – |
| ২.২ ডেটা কমিউনিকেশনের মাধ্যম: ক্যাবল | তারের ভিতরে কী আছে | [`axdjefc3`](https://ictmaniac.github.io/p/axdjefc3/) | – |
| ২.৩ মাইক্রোওয়েভ: টেরেস্ট্রিয়াল ও স্যাটেলাইট | সোজা পথে চলা তরঙ্গ | [`8g1t74ck`](https://ictmaniac.github.io/p/8g1t74ck/) | – |
| ২.৪ ওয়্যারলেস: হটস্পট, ব্লুটুথ, ওয়াই-ফাই, ওয়াইম্যাক্স | কার সিগন্যাল কতদূর যায় | [`1jrswzbj`](https://ictmaniac.github.io/p/1jrswzbj/) | – |
| ২.৫ মোবাইল যোগাযোগ: সেলুলার নেটওয়ার্ক | চলতে চলতে কথা বলা যায় কীভাবে | [`izd7dwp8`](https://ictmaniac.github.io/p/izd7dwp8/) | – |
| ২.৬.২ নেটওয়ার্কের প্রকারভেদ | PAN থেকে WAN: ছোট থেকে বিশাল | [`8cjqvnhj`](https://ictmaniac.github.io/p/8cjqvnhj/) | – |
| ২.৬.৩ নেটওয়ার্ক ডিভাইস | হাব, সুইচ, রাউটার: কে কী করে | [`mb35jwye`](https://ictmaniac.github.io/p/mb35jwye/) | – |
| ২.৬.৫ নেটওয়ার্ক টপোলজি | কম্পিউটার সাজানোর নকশা | [`j318lqnb`](https://ictmaniac.github.io/p/j318lqnb/) | – |
| ২.৭ ক্লাউড কম্পিউটিং (Cloud Computing) | যতটুকু লাগে, ততটুকু ভাড়া | [`j82ikcz9`](https://ictmaniac.github.io/p/j82ikcz9/) | – |

### মডেল টেস্ট (`src/tests/`)

| টেস্ট | কোন অংশ | লিংক |
|---|---|---|
| অধ্যায় ২ · মডেল টেস্ট ১ | ২.১ · ডেটা কমিউনিকেশন, ব্যান্ডউইডথ, ট্রান্সমিশন পদ্ধতি ও মোড | [`pocp0dgr`](https://ictmaniac.github.io/p/pocp0dgr/) |
| অধ্যায় ২ · মডেল টেস্ট ২ | ২.২–২.৩ · তার ও তারবিহীন মাধ্যম | [`wwznpf3x`](https://ictmaniac.github.io/p/wwznpf3x/) |
| অধ্যায় ২ · মডেল টেস্ট ৩ | ২.৪–২.৫ · ওয়্যারলেস ও মোবাইল যোগাযোগ | [`qrvnd0su`](https://ictmaniac.github.io/p/qrvnd0su/) |
| অধ্যায় ২ · মডেল টেস্ট ৪ | ২.৬–২.৮ · কম্পিউটার নেটওয়ার্ক, নেটওয়ার্ক ডিভাইস, টপোলজি ও ক্লাউড | [`ycj6wn84`](https://ictmaniac.github.io/p/ycj6wn84/) |

## অধ্যায় ৩

### অ্যানিমেশন (`src/ch3/`)

| টপিক | পেজের নাম | লিংক | ভিডিও |
|---|---|---|---|
| ৩.১.১ সংখ্যা পদ্ধতি ও স্থানীয় মান | অঙ্কের দাম, ঘরের দাম | [`ehqwxpk4`](https://ictmaniac.github.io/p/ehqwxpk4/) | – |
| ৩.১.২ সংখ্যা পদ্ধতির রূপান্তর | সংখ্যা রূপান্তর, ধাপে ধাপে | [`jzg0wp17`](https://ictmaniac.github.io/p/jzg0wp17/) | – |
| ৩.১.৩ বাইনারি গাণিতিক প্রক্রিয়া | বাইনারি যোগ-বিয়োগ, ঘর ধরে ধরে | [`amqwajgi`](https://ictmaniac.github.io/p/amqwajgi/) | – |
| ৩.১.৪–৩.১.৫ চিহ্নযুক্ত সংখ্যা ও পরিপূরক | চিহ্নযুক্ত সংখ্যা ও 2's complement | [`lczqizl0`](https://ictmaniac.github.io/p/lczqizl0/) | – |
| ৩.১.৬–৩.১.১১ কোড: BCD, ASCII, EBCDIC, ইউনিকোড | কম্পিউটার অক্ষর চেনে কীভাবে? | [`ftuvgakh`](https://ictmaniac.github.io/p/ftuvgakh/) | – |
| ৩.২ ও ৩.২.১ বুলিয়ান অ্যালজেবরা, স্বতঃসিদ্ধ ও উপপাদ্য | বুলিয়ান অ্যালজেবরার নিয়ম | [`0i7uvter`](https://ictmaniac.github.io/p/0i7uvter/) | – |
| ৩.২.২ সত্যক সারণি | সত্যক সারণি বানাও, ধাপে ধাপে | [`94wcz54n`](https://ictmaniac.github.io/p/94wcz54n/) | – |
| ৩.২.৩ ডি-মরগানের উপপাদ্য | ডি-মরগানের উপপাদ্য | [`xmahblk0`](https://ictmaniac.github.io/p/xmahblk0/) | – |
| ৩.২.৪ বুলিয়ান রাশির সরলীকরণ | বুলিয়ান রাশি সরল করো, ধাপে ধাপে | [`8cslsbdt`](https://ictmaniac.github.io/p/8cslsbdt/) | – |
| ৩.২.৫ মৌলিক গেট | AND গেট | [`bmaf3tcy`](https://ictmaniac.github.io/p/bmaf3tcy/) | – |
| ৩.২.৬ সার্বজনীন গেট NAND ও NOR | NAND ও NOR: সার্বজনীন গেট | [`szv3slwp`](https://ictmaniac.github.io/p/szv3slwp/) | – |
| ৩.২.৭ XOR ও XNOR গেট | XOR ও XNOR গেট | [`0emg2168`](https://ictmaniac.github.io/p/0emg2168/) | – |
| ৩.২.৮–৩.২.৯ এনকোডার ও ডিকোডার | এনকোডার ও ডিকোডার | [`0vf4rsem`](https://ictmaniac.github.io/p/0vf4rsem/) | – |
| ৩.২.১০ হাফ অ্যাডার ও ফুল অ্যাডার | যোগ করার সার্কিট: অ্যাডার | [`xvf9e8cy`](https://ictmaniac.github.io/p/xvf9e8cy/) | – |
| ৩.২.১১ ফ্লিপ-ফ্লপ ও রেজিস্টার | ফ্লিপ-ফ্লপ: যে সার্কিট মনে রাখে | [`94movvai`](https://ictmaniac.github.io/p/94movvai/) | – |
| ৩.২.১২ কাউন্টার | কাউন্টার: ক্লক গোনার সার্কিট | [`uigdckd2`](https://ictmaniac.github.io/p/uigdckd2/) | – |

### মডেল টেস্ট (`src/tests/`)

| টেস্ট | কোন অংশ | লিংক |
|---|---|---|
| অধ্যায় ৩ · মডেল টেস্ট ১ | ৩.১.১–৩.১.২ · সংখ্যা পদ্ধতি ও রূপান্তর | [`nvck83mo`](https://ictmaniac.github.io/p/nvck83mo/) |
| অধ্যায় ৩ · মডেল টেস্ট ২ | ৩.১.৩–৩.১.১১ · বাইনারি গণিত, ২ এর পরিপূরক ও কোড | [`ui4nvy0b`](https://ictmaniac.github.io/p/ui4nvy0b/) |
| অধ্যায় ৩ · মডেল টেস্ট ৩ | ৩.২.১–৩.২.৭ · বুলিয়ান অ্যালজেবরা ও লজিক গেইট | [`p6banjlg`](https://ictmaniac.github.io/p/p6banjlg/) |
| অধ্যায় ৩ · মডেল টেস্ট ৪ | ৩.২.৮–৩.২.১২ · এনকোডার, ডিকোডার, অ্যাডার, ফ্লিপ-ফ্লপ ও কাউন্টার | [`6rg4l0g3`](https://ictmaniac.github.io/p/6rg4l0g3/) |

## অধ্যায় ৪

### অ্যানিমেশন (`src/ch4/`)

| টপিক | পেজের নাম | লিংক | ভিডিও |
|---|---|---|---|
| ৪.১ ওয়েব ডিজাইনের ধারণা | URL লিখলে কী হয়? | [`ylsyitae`](https://ictmaniac.github.io/p/ylsyitae/) | – |
| ৪.১.১ ওয়েবসাইটের কাঠামো | ৪ রকম ওয়েবসাইট কাঠামো | [`qrwvupve`](https://ictmaniac.github.io/p/qrwvupve/) | – |
| ৪.২ এইচটিএমএল এর মৌলিক বিষয় (৪.২.১–৪.২.৩) | HTML পেজের কাঠামো | [`44iolwu1`](https://ictmaniac.github.io/p/44iolwu1/) | – |
| ৪.২.৫ ফরম্যাটিং (Formatting) | লেখা সাজানোর ট্যাগ | [`yx4kplgr`](https://ictmaniac.github.io/p/yx4kplgr/) | – |
| ৪.২.৬ লিস্ট বা তালিকা (Lists) | লিস্ট বানাও | [`c25k6ogm`](https://ictmaniac.github.io/p/c25k6ogm/) | – |
| ৪.২.৭ হাইপারলিংক (Hyperlink) | লিংকে চাপ দিলে কী হয়? | [`7pj4qnta`](https://ictmaniac.github.io/p/7pj4qnta/) | – |
| ৪.২.৮ চিত্র যোগ করা (ব্যানারসহ) | ছবি যোগ করো | [`dq405i4k`](https://ictmaniac.github.io/p/dq405i4k/) | – |
| ৪.২.৯ টেবিল (Table) | টেবিল: rowspan ও colspan | [`chc68qo6`](https://ictmaniac.github.io/p/chc68qo6/) | – |
| ৪.৪ ওয়েবসাইট পাবলিশিং (Publishing Website) | ওয়েবসাইট অনলাইনে তোলা | [`btgvt6ja`](https://ictmaniac.github.io/p/btgvt6ja/) | – |

### মডেল টেস্ট (`src/tests/`)

| টেস্ট | কোন অংশ | লিংক |
|---|---|---|
| অধ্যায় ৪ · মডেল টেস্ট ১ | ৪.১–৪.১.১ · ওয়েব পেজ, আইপি, ডোমেইন, URL ও ওয়েবসাইটের কাঠামো | [`fga6rosc`](https://ictmaniac.github.io/p/fga6rosc/) |
| অধ্যায় ৪ · মডেল টেস্ট ২ | ৪.২–৪.২.৭ · HTML ট্যাগ, ফরম্যাটিং, লিস্ট ও হাইপারলিংক | [`273n8c92`](https://ictmaniac.github.io/p/273n8c92/) |
| অধ্যায় ৪ · মডেল টেস্ট ৩ | ৪.২.৮–৪.৪ · ছবি, টেবিল ও ওয়েবসাইট পাবলিশিং | [`514m8l8e`](https://ictmaniac.github.io/p/514m8l8e/) |

## অধ্যায় ৫

### অ্যানিমেশন (`src/ch5/`)

| টপিক | পেজের নাম | লিংক | ভিডিও |
|---|---|---|---|
| ৫.১.২ বিভিন্ন স্তরের প্রোগ্রামের ভাষা (৫.১.৩–৫.১.৭) | একই কাজ, তিন ভাষায় | [`mf644w9g`](https://ictmaniac.github.io/p/mf644w9g/) | – |
| ৫.১.৮ অনুবাদক সফটওয়্যার | কম্পাইলার বনাম ইন্টারপ্রেটার | [`8ktmtz8y`](https://ictmaniac.github.io/p/8ktmtz8y/) | – |
| ৫.১.১০ প্রোগ্রাম তৈরির ধাপসমূহ | ফ্লোচার্ট চলছে, দেখো! | [`r8tpxdlt`](https://ictmaniac.github.io/p/r8tpxdlt/) | – |
| ৫.২.৩ সি ভাষায় প্রোগ্রাম উন্নয়ন পরিবেশ | .c থেকে .exe | [`stdr3w8e`](https://ictmaniac.github.io/p/stdr3w8e/) | – |
| ৫.২.৭ চলক বা ভেরিয়েবল (৫.২.৫ ডেটা টাইপসহ) | চলক মেমোরিতে কোথায় বসে? | [`8gxeadbo`](https://ictmaniac.github.io/p/8gxeadbo/) | – |
| ৫.২.৮ অপারেটর, অপারেন্ড ও এক্সপ্রেশন | কোনটা আগে হিসাব হয়? | [`1y1yiipe`](https://ictmaniac.github.io/p/1y1yiipe/) | – |
| ৫.২.১০ ইনপুট ও আউটপুট স্টেটমেন্ট | printf আর scanf কীভাবে কাজ করে | [`uxrnymfd`](https://ictmaniac.github.io/p/uxrnymfd/) | – |
| ৫.২.১১ কন্ট্রোল স্টেটমেন্ট: শর্তযুক্ত | প্রোগ্রাম কোন পথে যাবে? | [`bhpgw0fs`](https://ictmaniac.github.io/p/bhpgw0fs/) | – |
| ৫.২.১২ লুপ কন্ট্রোল স্টেটমেন্ট | লুপ ঘুরছে, দেখো! | [`d4odkk9i`](https://ictmaniac.github.io/p/d4odkk9i/) | – |
| ৫.২.১৩ ফাংশন (Function) | ফাংশন ডাকলে কী হয়? | [`las6aqlo`](https://ictmaniac.github.io/p/las6aqlo/) | – |
| ৫.২.১৩ অ্যারে (Array) | অ্যারে: পাশাপাশি বাক্স | [`t2f6fxdt`](https://ictmaniac.github.io/p/t2f6fxdt/) | – |

### মডেল টেস্ট (`src/tests/`)

| টেস্ট | কোন অংশ | লিংক |
|---|---|---|
| অধ্যায় ৫ · মডেল টেস্ট ১ | ৫.১ · প্রোগ্রামিং ভাষা, অনুবাদক ও প্রোগ্রাম ডিজাইন | [`428l79x0`](https://ictmaniac.github.io/p/428l79x0/) |
| অধ্যায় ৫ · মডেল টেস্ট ২ | ৫.২–৫.২.১১ · সি পরিচিতি, ডেটা টাইপ, অপারেটর ও শর্ত | [`ff6nwtd1`](https://ictmaniac.github.io/p/ff6nwtd1/) |
| অধ্যায় ৫ · মডেল টেস্ট ৩ | ৫.২.১২–৫.২.১৩ · লুপ, অ্যারে ও ফাংশন | [`mqeb151o`](https://ictmaniac.github.io/p/mqeb151o/) |

## অধ্যায় ৬

### অ্যানিমেশন (`src/ch6/`)

| টপিক | পেজের নাম | লিংক | ভিডিও |
|---|---|---|---|
| ৬.১ ডেটাবেজের ধারণা | ডেটা থেকে ডেটাবেজ | [`49f7lcp3`](https://ictmaniac.github.io/p/49f7lcp3/) | – |
| ৬.৩ রিলেশনাল ডেটাবেজ মডেল | কোন ফিল্ড হবে "কী"? | [`qnp9kd0y`](https://ictmaniac.github.io/p/qnp9kd0y/) | – |
| ৬.৪ ডেটাবেজ তৈরি: ডেটা টাইপ | কোন ডেটা কোন বাক্সে? | [`057804v6`](https://ictmaniac.github.io/p/057804v6/) | – |
| ৬.৫ কোয়েরি ও SQL | কোয়েরি কীভাবে কাজ করে? | [`l8b1dalg`](https://ictmaniac.github.io/p/l8b1dalg/) | – |
| ৬.৬ ডেটা সর্টিং ও ইনডেক্স | সর্টিং বনাম ইনডেক্স | [`c87dmtrf`](https://ictmaniac.github.io/p/c87dmtrf/) | – |
| ৬.৭ রিলেশনশিপ (Relationship) | টেবিলের সাথে টেবিলের সম্পর্ক | [`uzdm76gm`](https://ictmaniac.github.io/p/uzdm76gm/) | – |
| ৬.১১ ডেটা এনক্রিপশন | গোপন বার্তা বানানো | [`zjzqaj61`](https://ictmaniac.github.io/p/zjzqaj61/) | – |

### মডেল টেস্ট (`src/tests/`)

| টেস্ট | কোন অংশ | লিংক |
|---|---|---|
| অধ্যায় ৬ · মডেল টেস্ট ১ | ৬.১–৬.৪ · ডেটাবেজ, DBMS, কী ও ডেটা টাইপ | [`zsefaoaj`](https://ictmaniac.github.io/p/zsefaoaj/) |
| অধ্যায় ৬ · মডেল টেস্ট ২ | ৬.৫–৬.৬ · কোয়েরি, SQL, সর্টিং ও ইনডেক্সিং | [`23tzu24h`](https://ictmaniac.github.io/p/23tzu24h/) |
| অধ্যায় ৬ · মডেল টেস্ট ৩ | ৬.৭–৬.১১ · রিলেশনশিপ, করপোরেট ডেটাবেজ, ডেটা নিরাপত্তা ও এনক্রিপশন | [`prcabjf6`](https://ictmaniac.github.io/p/prcabjf6/) |

## পূর্ণ সিলেবাস মডেল টেস্ট

| টেস্ট | লিংক |
|---|---|
| পূর্ণ সিলেবাস মডেল টেস্ট ১ | [`b7t3fkfc`](https://ictmaniac.github.io/p/b7t3fkfc/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ২ | [`a7cys7gz`](https://ictmaniac.github.io/p/a7cys7gz/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ৩ | [`hou44zpa`](https://ictmaniac.github.io/p/hou44zpa/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ৪ | [`syd3r5fp`](https://ictmaniac.github.io/p/syd3r5fp/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ৫ | [`2uwvizgq`](https://ictmaniac.github.io/p/2uwvizgq/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ৬ | [`4l0ur4l0`](https://ictmaniac.github.io/p/4l0ur4l0/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ৭ | [`mrc10mpw`](https://ictmaniac.github.io/p/mrc10mpw/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ৮ | [`a5ma7slu`](https://ictmaniac.github.io/p/a5ma7slu/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ৯ | [`u0qzm1tk`](https://ictmaniac.github.io/p/u0qzm1tk/) |
| পূর্ণ সিলেবাস মডেল টেস্ট ১০ | [`71xe6ll9`](https://ictmaniac.github.io/p/71xe6ll9/) |

মোট: অ্যানিমেশন ৬৩টি, মডেল টেস্ট ৩০টি
