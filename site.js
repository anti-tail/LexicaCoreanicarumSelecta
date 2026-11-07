/* Lexica Koreanicarum — 中期・近世朝鮮語の静的検索（データは data/ の JSON） */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 表示の言語：<html lang="en"> の英語版（export_site.py --lang en）では英語の表示と英語訳（data/en/）
  const LANG = (document.documentElement.lang || 'ja').startsWith('en') ? 'en' : 'ja';
  const TX = {
    ja: {
      vname: { LMK15: '15 世紀', LMK16: '16 世紀', OLD: '옛말', EMK17: '17 世紀', EMK18: '18 世紀', EMK19: '19 世紀' },
      nItems: n => `${n} 項目`, top300: '（上位 300）', searched: how => `　${how}探しました`,
      how: { yale: 'Yale で', tr: '日本語訳で', both: 'Yale と英語訳で', era: '形（時代ごとの綴りの揺れを吸収）と見出しで', syl: '形（音節の組み方を吸収）と見出しで', exact: '形（表記どおり）と見出しで' },
      none: '見つかりません．綴りを短くするか，時代の絞り込みや照合のしかたを変えてください．',
      forms: '時代ごとの形', thForms: ['時代', '形', 'Yale（参考）', '声調'], cites: '用例', thCites: ['時代', '年', '出典', '用例'],
      source: tr => `出典：우리말샘（国立国語院）の歴史情報${tr ? '，日本語訳は 한국어기초사전' : ''}．CC BY-SA 2.0 KR．`, openOD: '우리말샘 で開く',
      mapAria: '方言形の分布', outside: '（地図の外）', dial: '方言形', dialN: (g, r) => `${g} 形・${r} 地域`,
      dialNote: '우리말샘 で同じ現代語に結ばれた方言項目の形．地域は 우리말샘 の地域区分（道単位）で，点はその代表地点．凡例を選ぶとその形だけを強調します．地図：Natural Earth を簡略化．',
      sep: '，', trBtn: '訳', trAria: '日本語訳', look: '引く', looking: '引いています…', asOld: f => `中期・近世の形 <span class="hangul">${f}</span> として`,
      asModern: '現代語として（한국어기초사전）', trNone: '見つかりませんでした．語尾を外した形に直して「引く」を押してください．', searchThis: 'この語で検索',
      naver: q => `<a href="https://ja.dict.naver.com/#/search?query=${encodeURIComponent(q)}" target="_blank" rel="noopener">NAVER 韓日辞典で開く</a>`,
      meta: (m) => `${m.entries.toLocaleString()} 項目・${m.forms.toLocaleString()} 形・${m.citations.toLocaleString()} 用例（${m.built} 作成）`,
      loadErr: 'データを読み込めませんでした．ページをウェブサーバー経由で開いてください（file:// では読めません）．',
      light: '明るい表示にする', dark: '暗い表示にする',
    },
    en: {
      vname: { LMK15: '15th c.', LMK16: '16th c.', OLD: 'Old (undated)', EMK17: '17th c.', EMK18: '18th c.', EMK19: '19th c.' },
      nItems: n => `${n} entr${n === '1' ? 'y' : 'ies'}`, top300: ' (top 300)', searched: how => ` — matched ${how}`,
      how: { yale: 'by Yale', tr: 'by English translation', both: 'by English translation and Yale', era: 'by form (allowing each century’s spelling variation) and headword', syl: 'by form (ignoring syllable division) and headword', exact: 'by form (exact spelling) and headword' },
      none: 'Nothing found. Try a shorter spelling, more centuries, or another matching mode.',
      forms: 'Forms by period', thForms: ['Period', 'Form', 'Yale (ref.)', 'Tone'], cites: 'Citations', thCites: ['Period', 'Year', 'Source', 'Citation'],
      source: tr => `Sources: historical data of 우리말샘 (National Institute of Korean Language)${tr ? '; English from 한국어기초사전' : ''}. CC BY-SA 2.0 KR. `, openOD: 'Open in 우리말샘',
      mapAria: 'Distribution of dialect forms', outside: ' (off the map)', dial: 'Dialect forms', dialN: (g, r) => `${g} forms · ${r} regions`,
      dialNote: 'Forms of dialect entries linked to the same modern word in 우리말샘. Regions follow 우리말샘 (provinces); each dot is a representative point. Select a legend item to highlight that form. Map: simplified Natural Earth.',
      sep: ', ', trBtn: 'EN', trAria: 'English translation', look: 'Look up', looking: 'Looking up…', asOld: f => `As the Middle/Early Modern form <span class="hangul">${f}</span>`,
      asModern: 'As modern Korean (한국어기초사전)', trNone: 'Nothing found. Remove the ending and press “Look up”.', searchThis: 'Search this word',
      naver: q => `<a href="https://en.dict.naver.com/#/search?query=${encodeURIComponent(q)}" target="_blank" rel="noopener">Open in NAVER Korean–English Dictionary</a>`,
      meta: (m) => `${m.entries.toLocaleString()} entries · ${m.forms.toLocaleString()} forms · ${m.citations.toLocaleString()} citations (built ${m.built})`,
      loadErr: 'Could not load the data. Open the page through a web server (file:// does not work).',
      light: 'Light theme', dark: 'Dark theme',
    },
  }[LANG];
  const VNAME = TX.vname;
  const VCLS = { LMK15: 'L', LMK16: 'L', OLD: 'O', EMK17: 'E', EMK18: 'E', EMK19: 'E' };
  const vtag = v => `<span class="tag v-${VCLS[v] || ''}">${esc(VNAME[v] || v)}</span>`;
  const HIST = ['LMK15', 'LMK16', 'OLD', 'EMK17', 'EMK18', 'EMK19'];              // data の世紀番号（0–5）
  const ERA = [15, 16, 0, 17, 18, 19];                                             // 世紀番号 → 照合規則（0 = OLD：全世紀で試す）
  let INDEX = [], META = {}, SHARDS = {}, current = null;

  // ---------- 表記の正規化：NFD，傍点を除く，互換字母を結合字母に（ㅁㆍㅿㆍㅁ → ᄆᆞᅀᆞᆷ）
  const CHO = { 'ㄱ': 0x1100, 'ㄲ': 0x1101, 'ㄴ': 0x1102, 'ㄷ': 0x1103, 'ㄸ': 0x1104, 'ㄹ': 0x1105, 'ㅁ': 0x1106, 'ㅂ': 0x1107, 'ㅃ': 0x1108, 'ㅅ': 0x1109, 'ㅆ': 0x110A, 'ㅇ': 0x110B, 'ㅈ': 0x110C, 'ㅉ': 0x110D, 'ㅊ': 0x110E, 'ㅋ': 0x110F, 'ㅌ': 0x1110, 'ㅍ': 0x1111, 'ㅎ': 0x1112,
    'ㅿ': 0x1140, 'ㆁ': 0x114C, 'ㅸ': 0x112B, 'ㆆ': 0x1159, 'ㅄ': 0x1121, 'ㅴ': 0x1122, 'ㅵ': 0x1123, 'ㅳ': 0x1120, 'ㅶ': 0x1127, 'ㅷ': 0x1129, 'ㅺ': 0x112D, 'ㅻ': 0x112E, 'ㅼ': 0x112F, 'ㅽ': 0x1132, 'ㅾ': 0x1136, 'ㆀ': 0x1147, 'ㆅ': 0x1158, 'ㅹ': 0x112C };
  const JONG = { 'ㄱ': 0x11A8, 'ㄲ': 0x11A9, 'ㄳ': 0x11AA, 'ㄴ': 0x11AB, 'ㄵ': 0x11AC, 'ㄶ': 0x11AD, 'ㄷ': 0x11AE, 'ㄹ': 0x11AF, 'ㄺ': 0x11B0, 'ㄻ': 0x11B1, 'ㄼ': 0x11B2, 'ㄽ': 0x11B3, 'ㄾ': 0x11B4, 'ㄿ': 0x11B5, 'ㅀ': 0x11B6, 'ㅁ': 0x11B7, 'ㅂ': 0x11B8, 'ㅄ': 0x11B9, 'ㅅ': 0x11BA, 'ㅆ': 0x11BB, 'ㅇ': 0x11BC, 'ㅈ': 0x11BD, 'ㅊ': 0x11BE, 'ㅋ': 0x11BF, 'ㅌ': 0x11C0, 'ㅍ': 0x11C1, 'ㅎ': 0x11C2,
    'ㅿ': 0x11EB, 'ㆁ': 0x11F0, 'ㅸ': 0x11E6, 'ㆆ': 0x11F9 };
  const VOW = { 'ㆍ': 0x119E, 'ㆎ': 0x11A1 };
  'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('').forEach((c, i) => { VOW[c] = 0x1161 + i; });
  const J2C = {}; Object.keys(JONG).forEach(k => { if (CHO[k] !== undefined) J2C[String.fromCharCode(JONG[k])] = CHO[k]; });
  const isVowel = ch => ch && (VOW[ch] !== undefined || (ch >= 'ᅠ' && ch <= 'ᆧ') || (ch >= 'ힰ' && ch <= 'ퟆ'));
  const isLeadOrVowelEnd = ch => ch && ((ch >= 'ᅠ' && ch <= 'ᇿ') || (ch >= 'ힰ' && ch <= '퟿') || VOW[ch] !== undefined);
  function normalize(s) { return compose((s || '').replace(/[\u302E\u302F\u00B7]/g, '').replace(/\s+/g, '')); }
  function compose(s) {
    const a = [...(s || '').normalize('NFD')];
    let out = '';
    for (let i = 0; i < a.length; i++) {
      const ch = a[i], next = a[i + 1], prev = out.slice(-1);
      if (VOW[ch] !== undefined || (ch >= '\u1160' && ch <= '\u11A7')) {
        // 母音の前の終声は次の音節の初声に移す（ᄆᆞᇫ + ㆍ → ᄆᆞᅀᆞ）
        if (J2C[prev] !== undefined) out = out.slice(0, -1) + String.fromCharCode(J2C[prev]);
        out += VOW[ch] !== undefined ? String.fromCharCode(VOW[ch]) : ch;
      }
      else if (CHO[ch] !== undefined || JONG[ch] !== undefined) {
        if (isVowel(next) && CHO[ch] !== undefined) out += String.fromCharCode(CHO[ch]);
        else if (isLeadOrVowelEnd(prev) && JONG[ch] !== undefined) out += String.fromCharCode(JONG[ch]);
        else out += String.fromCharCode(CHO[ch] ?? JONG[ch]);
      } else out += ch;
    }
    return out;
  }

  // ---------- 検索
  // 形の照合は 3 通り（#mode）：
  //   era   時代ごと：形の世紀の規則で問いと形を揃える（hkey.js．音節の組み方と，その世紀に合流した字母・綴りを吸収）
  //   syl   音節の組み方だけ：連綴・分綴・重綴と零の ㅇ だけを吸収
  //   exact 表記どおり：傍点だけを除いた字母列の部分一致
  const sel = () => new Set($$('.stages input:checked').map(i => +i.value));
  const mode = () => $('#mode').value;
  const SYLKEY = new Map();
  const sylKey = f => { let k = SYLKEY.get(f); if (k === undefined) SYLKEY.set(f, k = HKey.key(f, 0)); return k; };
  // index の行の形を [世紀番号, 字母列, 照合キー（OLD は 5 つ）] に（初回だけ）
  function rowForms(row) {
    if (row._f) return row._f;
    const ks = (row[8] || '').split('|');
    return (row._f = (row[4] ? row[4].split('|') : []).map((x, i) => [+x[0], x.slice(1), (ks[i] || '').split(',')]));
  }
  function queryKeys(q) {
    return { q, k0: HKey.key(q, 0), era: Object.fromEntries(HKey.ERAS.map(e => [e, HKey.key(q, e)])) };
  }
  const cmp = (f, q, a, b, c) => !q ? 0 : f === q ? a : f.startsWith(q) ? b : f.includes(q) ? c : 0;
  // 形と問いのキーの組（照合のしかたと形の世紀による．OLD は 15–19 世紀の 5 組）
  function pairs([vi, f, ks], Q, m) {
    if (m === 'exact') return [[f, Q.q]];
    if (m === 'syl') return [[sylKey(f), Q.k0]];
    return ERA[vi] ? [[ks[0], Q.era[ERA[vi]]]] : HKey.ERAS.map((e, i) => [ks[i], Q.era[e]]);
  }
  // 問いが「形＋助詞・語尾」のとき（사ᄅᆞᄆᆞᆯ → 사ᄅᆞᆷ）：形のキーが問いのキーの頭に一致する長さ（3 分節以上）
  function stemLen(f, Q, m) {
    let L = 0;
    for (const [fk, qk] of pairs(f, Q, m)) if (fk && qk && fk.length < qk.length && fk.length >= 3 && qk.startsWith(fk)) L = Math.max(L, fk.length / qk.length);
    return L;
  }
  // 1 つの形と問いの一致度（0 は不一致）
  function formScore(f, Q, m) {
    let s = cmp(f[1], Q.q, 6, 4, 2.2);                 // 表記どおりの一致は常に上位
    for (const [fk, qk] of pairs(f, Q, m)) s = Math.max(s, cmp(fk, qk, 5, 3.5, 2));
    const L = stemLen(f, Q, m);
    return L ? Math.max(s, 2.5 + L) : s;
  }
  function score(row, q, kind, st, Q) {
    const [, hw, , ja, , yale, stages, gl] = row;
    let s = 0;
    if (kind === 'yale' || kind === 'tr' || kind === 'both') {
      if (![...stages].some(c => st.has(+c))) return 0;
      if (kind !== 'tr') {
        for (const y of yale.split('|')) { if (!y) continue; if (y === q) s = Math.max(s, 4); else if (y.startsWith(q)) s = Math.max(s, 3); else if (y.includes(q)) s = Math.max(s, 1.5); }
      }
      if (kind === 'tr' && ja.includes(q)) s = ja.startsWith(q) ? 3 : 2;
      if (kind === 'both' && ja) s = Math.max(s, enScore(ja, q));
      return s;
    }
    const m = mode();
    for (const f of rowForms(row)) if (st.has(f[0])) s = Math.max(s, formScore(f, Q, m));
    if (![...stages].some(c => st.has(+c))) return s;
    const h = hw.normalize('NFD');
    if (h === q) s = Math.max(s, 4.5); else if (h.startsWith(q)) s = Math.max(s, 2.5); else if (h.includes(q)) s = Math.max(s, 1.2);
    if (!s && gl && gl.normalize('NFD').includes(q)) s = 0.5;
    return s;
  }
  // 英語訳の一致度：訳語のどれかと完全一致（to を除いて）> 語の単位で一致 > 前方一致．訳語は '; ' 区切り
  const EN_RE = new Map();
  function enScore(tr, q) {
    let re = EN_RE.get(q);
    if (!re) { re = new RegExp(`(^|[^a-z])${q.replace(/^(to|a|an|the) /, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`); EN_RE.set(q, re); }
    const t = tr.toLowerCase(), qc = q.replace(/^(to|a|an|the) /, '');
    let s = 0;
    for (const item of t.split(/\s*[;,]\s*/)) {
      const w = item.replace(/^(to|a|an|the) /, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
      if (w === qc || item === q) return 4.2;
      if (re.test(item)) s = Math.max(s, item.split(' ').length <= 3 ? 3.2 : 2.4);
      else if (w.startsWith(q)) s = Math.max(s, 1.6);
    }
    return s;
  }
  let lastQ = null;
  function search(raw) {
    const q0 = (raw || '').trim();
    lastQ = null;
    if (!q0) { $('#results').innerHTML = ''; $('#info').textContent = TX.nItems(INDEX.length.toLocaleString()); return; }
    let kind = 'hangul', q;
    // 英語版：ラテン文字は Yale と英語訳の両方で引く（mozom も heart も）
    if (/^[a-zA-Z.\-' ]+$/.test(q0)) { kind = LANG === 'en' ? 'both' : 'yale'; q = q0.toLowerCase().replace(/\s+/g, ' '); }
    else if (LANG === 'ja' && /[぀-ヿ㐀-鿿]/.test(q0) && !/[ᄀ-ᇿ가-힣㄰-㆏]/.test(q0)) { kind = 'tr'; q = q0; }
    else q = normalize(q0);
    const st = sel(), Q = kind === 'hangul' ? (lastQ = queryKeys(q)) : null;
    const hits = [];
    for (const row of INDEX) {
      const s = score(row, q, kind, st, Q);
      if (s) hits.push([s, row]);
    }
    hits.sort((a, b) => b[0] - a[0] || a[1][1].length - b[1][1].length || a[1][2] - b[1][2]);
    const how = kind === 'hangul' ? TX.how[mode()] : TX.how[kind];
    $('#info').textContent = hits.length ? `${TX.nItems(hits.length.toLocaleString())}${hits.length > 300 ? TX.top300 : ''}${TX.searched(how)}` : TX.none;
    $('#results').innerHTML = hits.slice(0, 300).map(([, r]) => {
      const fs = rowForms(r), m = Q && fs.filter(f => st.has(f[0]) && formScore(f, Q, mode()) > 0);
      const shown = [...new Set((m && m.length ? m : fs.filter(f => st.has(f[0]))).concat(fs).map(f => f[1].normalize('NFC')))].slice(0, 4);
      return `<li class="item" data-id="${r[0]}" tabindex="0" aria-selected="${r[0] === current}">
        <div class="item-head"><span class="item-hw">${esc(r[1])}</span>${r[2] ? `<span class="faint">「${r[2]}」</span>` : ''}<span class="item-old">${shown.map(esc).join('　')}</span></div>
        ${r[3] ? `<div class="item-ja">${esc(r[3])}</div>` : ''}${r[7] ? `<div class="item-gl">${esc(r[7])}</div>` : ''}</li>`;
    }).join('');
    $$('#results .item').forEach(li => { li.onclick = () => open(+li.dataset.id); li.onkeydown = e => { if (e.key === 'Enter') open(+li.dataset.id); }; });
    if (hits.length && !current) open(hits[0][1][0], true);
    else if (current) open(current, true);
  }

  // ---------- 項目
  async function shard(n) {
    if (!SHARDS[n]) SHARDS[n] = fetch(`data/e/${String(n).padStart(2, '0')}.json`).then(r => r.json());
    return SHARDS[n];
  }
  // 項目の形が今の問いに当たるか（当たった形の行に印を付ける）
  function hitForm(f) {
    if (!lastQ) return false;
    const vi = HIST.indexOf(f[0]), plain = f[1].normalize('NFD').replace(/[\u302E\u302F]/g, '');
    const ks = ERA[vi] ? [HKey.key(plain, ERA[vi])] : HKey.ERAS.map(e => HKey.key(plain, e));
    return formScore([vi, plain, ks], lastQ, mode()) > 0;
  }
  const ctx = s => esc(s).replace(/\{([^}]*)\}/g, '<mark>$1</mark>');
  async function open(id, keepHash) {
    current = id;
    $$('#results .item').forEach(li => li.setAttribute('aria-selected', +li.dataset.id === id));
    if (!keepHash) setHash();
    const e = (await shard(id % (META.shards || 64)))[id];
    if (e) e.ja = e[LANG] || e.ja || [];
    if (e && e.d && !MAP) await loadMap();
    if (!e || current !== id) return;
    const order = Object.keys(VNAME);
    const forms = e.f.slice().sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]) || (a[5] || 0) - (b[5] || 0));
    let h = `<div class="entry"><div class="entry-hw">${esc(e.hw)}${e.sn ? `<small>「${e.sn}」</small>` : ''}</div>
      <div>${[e.pos, e.wt].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${e.ja.length ? `<div class="entry-ja">${e.ja.map(esc).join(LANG === 'en' ? ' / ' : '　／　')}</div>` : ''}
      ${e.gl ? `<div class="entry-gl">${esc(e.gl)}</div>` : ''}`;
    const th = a => `<thead><tr>${a.map(x => `<th>${x}</th>`).join('')}</tr></thead>`;
    if (forms.length) h += `<h3>${TX.forms}<span class="n">${forms.length}</span></h3><table>${th(TX.thForms)}<tbody>` +
      forms.map(f => `<tr${hitForm(f) ? ' class="hit"' : ''}><td>${vtag(f[0])}</td><td class="hangul">${esc(f[1])}</td><td class="ipa">${esc(f[2])}</td><td class="faint">${esc(f[4])}</td></tr>`).join('') + '</tbody></table>';
    if (e.d && e.d.length && MAP) h += dialectMap(e.d);
    if (e.c.length) h += `<h3>${TX.cites}<span class="n">${e.c.length}</span></h3><table>${th(TX.thCites)}<tbody>` +
      e.c.map(c => `<tr><td>${vtag(c[0])}</td><td class="num">${esc(c[2] ?? '')}</td><td class="num">${esc(c[3])}</td><td class="ctx">${ctx(c[4]) || `<span class="hangul">${esc(c[1])}</span>`}</td></tr>`).join('') + '</tbody></table>';
    h += `<p class="faint" style="font-size:12px;margin-top:18px">${TX.source(e.ja.length)}<a href="https://opendict.korean.go.kr/search/searchResult?query=${encodeURIComponent(e.hw)}" rel="noopener" target="_blank">${TX.openOD}</a></p></div>`;
    $('#detail').innerHTML = h;
    $('#detail').scrollTop = 0;
    $$('#detail .dleg li').forEach(li => { li.onclick = () => focusGroup(li); li.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); focusGroup(li); } }; });
  }


  // ---------- 方言地図：우리말샘 の方言形（項目と意味の錨が同じ方言項目の形）を，地域ごとに記号で示す小さな SVG 地図
  let MAP = null;
  const loadMap = () => (MAP ? Promise.resolve(MAP) : fetch('data/map.json').then(r => r.json()).then(m => (MAP = m)).catch(() => null));
  const PAL = ['#2B4C8C', '#B2452F', '#3F7A63', '#B8862B', '#7A4A8C', '#2F7F8F', '#8A5A3B', '#B4577A'];
  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'tri-down', 'hexagon', 'star', 'cross'];
  const TOP = 8;
  function mark(i, x, y, size) {
    // 形 i の記号（中心 x, y）．TOP 以降は灰色の小さな点
    if (i >= TOP) return `<circle cx="${x}" cy="${y}" r="2.6" class="dm-other"/>`;
    const h = size / 2, c = PAL[i], f = (a, b) => `${(x - h + a).toFixed(1)},${(y - h + b).toFixed(1)}`;
    const P = {
      circle: `<circle cx="${x}" cy="${y}" r="${h - 1}"/>`,
      square: `<rect x="${x - h + 1.5}" y="${y - h + 1.5}" width="${size - 3}" height="${size - 3}"/>`,
      triangle: `<polygon points="${f(h, 0.5)} ${f(size - 0.5, size - 1)} ${f(0.5, size - 1)}"/>`,
      'tri-down': `<polygon points="${f(0.5, 1)} ${f(size - 0.5, 1)} ${f(h, size - 0.5)}"/>`,
      diamond: `<polygon points="${f(h, 0)} ${f(size, h)} ${f(h, size)} ${f(0, h)}"/>`,
      hexagon: `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => f(h + (h - 0.8) * Math.cos(Math.PI / 3 * k), h + (h - 0.8) * Math.sin(Math.PI / 3 * k))).join(' ')}"/>`,
      star: `<polygon points="${[...Array(10)].map((_, k) => { const r = k % 2 ? h * 0.45 : h; const a = Math.PI / 5 * k - Math.PI / 2; return f(h + r * Math.cos(a), h + r * Math.sin(a)); }).join(' ')}"/>`,
      cross: `<path d="M${f(h - 2, 0)}h4v${h - 2}h${h - 2}v4h-${h - 2}v${h - 2}h-4v-${h - 2}h-${h - 2}v-4h${h - 2}z"/>`,
    };
    return `<g fill="${c}" stroke="var(--surface)" stroke-width="1">${P[SHAPES[i]]}</g>`;
  }
  const legendMark = i => `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${mark(i, 7, 7, 13)}</svg>`;
  function dialectMap(d) {
    const R = MAP.regions, rname = c => (R[c] ? R[c][0] : c);
    const byForm = new Map();
    d.forEach(([code, form]) => { const k = form.normalize('NFC'); if (!byForm.has(k)) byForm.set(k, []); byForm.get(k).push(code); });
    const ord = Object.keys(R), byOrd = (a, b) => (ord.indexOf(a) + 1 || 99) - (ord.indexOf(b) + 1 || 99);
    byForm.forEach(v => v.sort(byOrd));
    const groups = [...byForm.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    // 地域 → その地域に出る形（番号）
    const at = {};
    groups.forEach(([, codes], gi) => codes.forEach(c => (at[c] ??= []).push(gi)));
    const lit = new Set();
    Object.keys(at).forEach(c => { lit.add(c); Object.entries(R).forEach(([k, r]) => { if (r[1] === c) lit.add(k); }); });
    let svg = `<svg class="dmap-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" role="img" aria-label="${TX.mapAria}">
      <rect width="${MAP.w}" height="${MAP.h}" class="dm-sea"/>`;
    MAP.shapes.forEach(([kind, code, path]) => { svg += `<path d="${path}" class="${kind === 'land' ? 'dm-land' : lit.has(code) ? 'dm-prov dm-lit' : 'dm-prov'}"/>`; });
    const outside = [];
    Object.entries(at).forEach(([code, gis]) => {
      const r = R[code];
      if (!r || r[2] == null) { outside.push(code); return; }
      const n = gis.length, cols = Math.min(n, 4), step = 11;
      gis.forEach((gi, k) => {
        const row = Math.floor(k / cols), col = k % cols, inRow = Math.min(cols, n - row * cols);
        const x = r[2] + (col - (inRow - 1) / 2) * step, y = r[3] + (row - (Math.ceil(n / cols) - 1) / 2) * step;
        svg += `<g class="dm-mark" data-g="${gi}"><title>${esc(groups[gi][0])}　${esc(rname(code))}</title>${mark(gi, +x.toFixed(1), +y.toFixed(1), 11)}</g>`;
      });
    });
    svg += '</svg>';
    const leg = groups.map(([form, codes], gi) => `<li data-g="${gi}" tabindex="0"><span class="dl-sym">${gi < TOP ? legendMark(gi) : '<svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="2.6" class="dm-other"/></svg>'}</span><span class="hangul dl-form">${esc(form)}</span><span class="dl-reg">${codes.map(c => esc(rname(c).replace(/ 방언$/, ''))).join(TX.sep)}${codes.some(c => outside.includes(c)) ? `<span class="faint">${TX.outside}</span>` : ''}</span></li>`).join('');
    return `<h3>${TX.dial}<span class="n">${TX.dialN(groups.length, Object.keys(at).length)}</span></h3>
      <div class="dmap">${svg}<ul class="dleg">${leg}</ul></div>
      <p class="faint dmap-note">${TX.dialNote}</p>`;
  }
  function focusGroup(li) {
    const box = li.closest('.dmap'), g = li.dataset.g, on = li.getAttribute('aria-pressed') !== 'true';
    box.querySelectorAll('.dleg li').forEach(x => x.setAttribute('aria-pressed', on && x === li ? 'true' : 'false'));
    box.querySelectorAll('.dm-mark').forEach(m => m.classList.toggle('dim', on && m.dataset.g !== g));
  }

  // ---------- 訳：ページ上の語を選ぶと「訳」ボタン．中期・近世の形としての項目と，現代語としての日本語訳（한국어기초사전）を引く
  const SB = 0xAC00, JONGS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const split = ch => { const o = ch.codePointAt(0) - SB; return o >= 0 && o < 11172 ? [Math.floor(o / 588), Math.floor((o % 588) / 28), o % 28] : null; };
  const join = (l, v, t) => String.fromCharCode(SB + (l * 21 + v) * 28 + t);
  const withJong = (ch, j) => { const p = split(ch); return p ? join(p[0], p[1], JONGS.indexOf(j)) : ch; };
  const PART = ' 이라는 이라고 이라도 이라면 에서는 에게서 으로서 으로써 으로는 에서도 에게는 까지는 부터는 처럼 보다 에서 에게 한테 께서 으로 까지 부터 마저 조차 이나 이며 이고 이랑 하고 이 가 은 는 을 를 의 에 와 과 도 만 로 나 며 고 랑 께 서'.trim().split(' ').sort((a, b) => b.length - a.length);
  const ENDS = '었었다 았었다 겠다 었다 았다 였다 습니다 는다 어서 아서 여서 으면 으며 으니 으나 으려 거나 지만 도록 는데 은데 던 고 며 면 니 게 지 기 음 은 는 을 어 아 여 다'.split(' ').sort((a, b) => b.length - a.length);
  function sylRules(x) {
    const p = x ? split(x.slice(-1)) : null; if (!p) return [];
    const [l, v, t] = p, base = join(l, v, 0), jong = JONGS[t], out = [], pre = x.slice(0, -1);
    if (['ㄴ', 'ㄹ', 'ㅁ', 'ㅂ'].includes(jong)) out.push(pre + base, pre + withJong(base, 'ㄹ'));
    if (jong === 'ㅆ') out.push(pre + base);
    if (base === '해' && (jong === '' || jong === 'ㅆ')) out.push(pre + '하');
    if (base === '하' && jong === 'ㄴ') out.push(pre + '하');
    if ((base === '워' || base === '우') && x.length > 1 && ['', 'ㄴ', 'ㄹ', 'ㅁ'].includes(jong)) out.push(x.slice(0, -2) + withJong(x.slice(-2, -1), 'ㅂ'));
    if (base === '와' && x.length > 1) out.push(pre + '오');
    return out;
  }
  function candidates(text) {
    const m = (text || '').normalize('NFC').match(/[가-힣]+/g); if (!m) return [];
    const w = m.sort((a, b) => b.length - a.length)[0];
    let out = [w];
    const nouns = PART.filter(p => w.endsWith(p) && w.length > p.length).map(p => w.slice(0, -p.length));
    ['이었다', '이다', '인', '임', '이며', '이고', '이나', '이어서', '였다', '이므로'].forEach(c => { if (w.endsWith(c) && w.length > c.length) nouns.push(w.slice(0, -c.length)); });
    let stems = ENDS.filter(e => w.endsWith(e) && w.length > e.length).map(e => w.slice(0, -e.length));
    [w, ...stems].forEach(x => { stems = stems.concat(sylRules(x)); });
    out = [w, ...stems.map(x => x + '다'), ...nouns, ...stems];
    return [...new Set(out.filter(Boolean))].slice(0, 24);
  }
  const JA = {};
  const jaShard = n => (JA[n] ??= fetch(`data/${LANG}/${String(n).padStart(2, '0')}.json`).then(r => r.json()).catch(() => ({})));
  async function jaLookup(cands) {
    const shards = [...new Set(cands.map(c => c.codePointAt(0) % (META.tr_shards || META.ja_shards || 32)))];
    const loaded = await Promise.all(shards.map(jaShard));
    const dict = Object.assign({}, ...loaded), hits = [];
    cands.forEach(c => (dict[c] || []).forEach(x => hits.push([c, ...x])));
    return hits.slice(0, 12);
  }
  function oldForms(word) {
    // 用例の語は助詞・語尾が付いていることがあるので，形のキーが語のキーの頭に一致するもの（いちばん長いもの）を探す
    const w = (word.split(/[\s,.;:!?()「」（）]+/).find(t => /[ᄀ-ᇿ가-힣ꥠ-꥿ힰ-퟿ㄱ-ㆎ]/.test(t)) || '');
    const q = normalize(w), Q = queryKeys(q);
    let best = 0, form = '';
    const rows = [];
    for (const r of INDEX) {
      let L = 0, hit = '';
      for (const f of rowForms(r)) {
        const l = pairs(f, Q, 'era').some(([fk, qk]) => fk && fk === qk) || f[1] === q ? 1 : stemLen(f, Q, 'era');
        if (l > L) { L = l; hit = f[1]; }
      }
      if (!L || L < best) continue;
      if (L > best) { best = L; rows.length = 0; form = hit; }
      rows.push(r);
    }
    return { form: form.normalize('NFC'), rows: rows.slice(0, 6) };
  }
  let tbtn = null, tpop = null;
  const dropBtn = () => { tbtn?.remove(); tbtn = null; }, dropPop = () => { tpop?.remove(); tpop = null; };
  document.addEventListener('pointerup', e => {
    if (e.target.closest?.('.tr-pop, .tr-btn, input, button, .palette')) return;
    setTimeout(() => {
      const sel = getSelection(), t = sel ? sel.toString().trim() : '';
      dropBtn();
      if (!t || t.length > 30 || !/[ᄀ-ᇿ가-힣ꥠ-꥿ힰ-퟿]/.test(t) || !sel.rangeCount) return;
      const r = sel.getRangeAt(0).getBoundingClientRect();
      tbtn = Object.assign(document.createElement('button'), { type: 'button', className: 'tr-btn', textContent: TX.trBtn });
      tbtn.style.left = Math.min(scrollX + r.right + 6, scrollX + innerWidth - 60) + 'px';
      tbtn.style.top = (scrollY + r.top - 4) + 'px';
      tbtn.addEventListener('mousedown', ev => ev.preventDefault());
      tbtn.addEventListener('click', () => { const at = { x: scrollX + r.left, y: scrollY + r.bottom + 8 }; dropBtn(); openPop(t, at); });
      document.body.appendChild(tbtn);
    }, 0);
  });
  document.addEventListener('mousedown', e => { if (tpop && !e.target.closest?.('.tr-pop')) dropPop(); if (tbtn && !e.target.closest?.('.tr-btn')) dropBtn(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { dropBtn(); dropPop(); } });
  function openPop(word, at) {
    dropPop();
    tpop = document.createElement('div'); tpop.className = 'tr-pop'; tpop.setAttribute('role', 'dialog'); tpop.setAttribute('aria-label', TX.trAria);
    tpop.style.left = Math.max(scrollX + 8, Math.min(at.x, scrollX + innerWidth - 432)) + 'px'; tpop.style.top = at.y + 'px';
    tpop.innerHTML = `<form class="tr-head"><input value="${esc(word)}" aria-label="${TX.look}"><button type="submit">${TX.look}</button></form><div class="tr-body"></div><div class="tr-foot"></div>`;
    document.body.appendChild(tpop);
    const inp = tpop.querySelector('input');
    tpop.querySelector('form').addEventListener('submit', e => { e.preventDefault(); runTr(compose(inp.value).normalize('NFC')); });
    runTr(word);
  }
  async function runTr(word) {
    const body = tpop.querySelector('.tr-body'), foot = tpop.querySelector('.tr-foot');
    body.innerHTML = `<div class="loading">${TX.looking}</div>`;
    const old = oldForms(word), cands = candidates(word), ja = cands.length ? await jaLookup(cands) : [];
    let h = '';
    if (old.rows.length) {
      h += `<div class="tr-sec">${TX.asOld(esc(old.form))}</div>` + old.rows.map(r =>
        `<div class="tr-hit"><a href="#" class="tr-hw" data-open="${r[0]}">${esc(r[1])}</a>${r[2] ? `<span class="faint">「${r[2]}」</span>` : ''}${r[3] ? `<div class="tr-ja">${esc(r[3])}</div>` : ''}<div class="tr-ko">${esc(r[7] || '')}</div></div>`).join('');
    }
    if (ja.length) {
      h += `<div class="tr-sec">${TX.asModern}</div>` + ja.map(([hw, pos, sn, jl, jd, ko]) =>
        `<div class="tr-hit"><span class="tr-hw">${esc(hw)}</span> <span class="tag">${esc(pos || '')}</span>${sn ? `<span class="faint">「${sn}」</span>` : ''}<div class="tr-ja">${esc(jl)}</div>${jd ? `<div class="tr-def">${esc(jd)}</div>` : ''}<div class="tr-ko">${esc(ko || '')}</div></div>`).join('');
    }
    body.innerHTML = h || `<div class="tr-hit tr-def">${TX.trNone}</div>`;
    const key = old.form || cands[0] || word;
    foot.innerHTML = `<a href="#q=${encodeURIComponent(key)}">${TX.searchThis}</a>${TX.naver(cands[0] || word)}`;
    body.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); dropPop(); open(+a.dataset.open); }));
  }

  // ---------- 状態（URL の # に検索語と項目を残す）
  function setHash() {
    const p = new URLSearchParams();
    if ($('#q').value.trim()) p.set('q', $('#q').value.trim());
    if (current) p.set('id', current);
    history.replaceState(null, '', '#' + p.toString());
  }
  function fromHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    current = +p.get('id') || null;
    if (p.has('q')) $('#q').value = p.get('q');
    search($('#q').value);
    if (current) open(current, true);
  }
  window.addEventListener('hashchange', () => { if (!location.hash.includes('id=') || !current) fromHash(); });
  $('#f').addEventListener('submit', e => { e.preventDefault(); current = null; search($('#q').value); setHash(); });
  $$('.stages input').forEach(i => i.addEventListener('change', () => search($('#q').value)));
  $('#mode').addEventListener('change', () => { try { localStorage.setItem('lexica.mode', mode()); } catch (_) { /* なし */ } search($('#q').value); });
  try { const m = localStorage.getItem('lexica.mode'); if (m && $(`#mode option[value="${m}"]`)) $('#mode').value = m; } catch (_) { /* なし */ }
  // 字母のボタン：入力欄のカーソル位置を覚えておき，そこに入れてから音節にまとめる
  const qi = $('#q');
  let caret = null;
  const remember = () => { caret = [qi.selectionStart, qi.selectionEnd]; };
  ['keyup', 'click', 'select', 'input', 'compositionend', 'blur'].forEach(ev => qi.addEventListener(ev, remember));
  function insertJamo(ch) {
    // ハングルキーボード（hangulkbd.js）があれば，その組み立て（겹모음・겹받침も）で入れる
    if (window.HKbd) { if (caret) qi.setSelectionRange(caret[0], caret[1]); window.HKbd.type(ch, qi); remember(); return; }
    const v = qi.value, [a, b] = caret || [v.length, v.length];
    const head = compose(v.slice(0, a) + ch).normalize('NFC'), tail = v.slice(b);
    qi.value = head + tail;
    caret = [head.length, head.length];
    qi.focus({ preventScroll: true });
    qi.setSelectionRange(head.length, head.length);
  }
  $$('.palette button').forEach(b => b.addEventListener('click', () => insertJamo(b.dataset.ins)));
  qi.addEventListener('blur', () => { const v = compose(qi.value).normalize('NFC'); if (v !== qi.value) qi.value = v; });

  // 表示
  try { const t = localStorage.getItem('lexica.theme'); if (t) document.documentElement.dataset.theme = t; } catch (_) { /* なし */ }
  const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const lab = () => { $('#theme').textContent = isDark() ? TX.light : TX.dark; };
  lab();
  $('#theme').onclick = () => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; try { localStorage.setItem('lexica.theme', document.documentElement.dataset.theme); } catch (_) { /* なし */ } lab(); };
  const top = $('.top'); const setTop = () => document.documentElement.style.setProperty('--top-h', top.offsetHeight + 'px');
  setTop(); new ResizeObserver(setTop).observe(top);

  Promise.all([fetch('data/meta.json').then(r => r.json()), fetch('data/index.json').then(r => r.json()), fetch('data/jamo.json').then(r => r.json())]).then(([m, idx, jamo]) => {
    META = m; INDEX = idx; HKey.init(jamo);
    $('#meta').textContent = TX.meta(m);
    fromHash();
  }).catch(() => { $('#info').textContent = TX.loadErr; });
})();
