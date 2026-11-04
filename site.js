/* Lexica Koreanicarum — 中期・近世朝鮮語の静的検索（データは data/ の JSON） */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VNAME = { LMK15: '15 世紀', LMK16: '16 世紀', OLD: '옛말', EMK17: '17 世紀', EMK18: '18 世紀', EMK19: '19 世紀' };
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
    if (kind === 'yale' || kind === 'ja') {
      if (![...stages].some(c => st.has(+c))) return 0;
      if (kind === 'yale') {
        for (const y of yale.split('|')) { if (!y) continue; if (y === q) s = Math.max(s, 4); else if (y.startsWith(q)) s = Math.max(s, 3); else if (y.includes(q)) s = Math.max(s, 1.5); }
      } else if (ja.includes(q)) s = ja.startsWith(q) ? 3 : 2;
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
  let lastQ = null;
  function search(raw) {
    const q0 = (raw || '').trim();
    lastQ = null;
    if (!q0) { $('#results').innerHTML = ''; $('#info').textContent = `${INDEX.length.toLocaleString()} 項目`; return; }
    let kind = 'hangul', q;
    if (/^[a-zA-Z.\- ]+$/.test(q0)) { kind = 'yale'; q = q0.toLowerCase().replace(/\s+/g, ' '); }
    else if (/[぀-ヿ㐀-鿿]/.test(q0) && !/[ᄀ-ᇿ가-힣㄰-㆏]/.test(q0)) { kind = 'ja'; q = q0; }
    else q = normalize(q0);
    const st = sel(), Q = kind === 'hangul' ? (lastQ = queryKeys(q)) : null;
    const hits = [];
    for (const row of INDEX) {
      const s = score(row, q, kind, st, Q);
      if (s) hits.push([s, row]);
    }
    hits.sort((a, b) => b[0] - a[0] || a[1][1].length - b[1][1].length || a[1][2] - b[1][2]);
    const how = { yale: 'Yale で', ja: '日本語訳で', hangul: { era: '形（時代ごとの綴りの揺れを吸収）と見出しで', syl: '形（音節の組み方を吸収）と見出しで', exact: '形（表記どおり）と見出しで' }[mode()] }[kind];
    $('#info').textContent = hits.length ? `${hits.length.toLocaleString()} 項目${hits.length > 300 ? '（上位 300）' : ''}　${how}探しました` : '見つかりません．綴りを短くするか，時代の絞り込みや照合のしかたを変えてください．';
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
    if (!e || current !== id) return;
    const order = Object.keys(VNAME);
    const forms = e.f.slice().sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]) || (a[5] || 0) - (b[5] || 0));
    let h = `<div class="entry"><div class="entry-hw">${esc(e.hw)}${e.sn ? `<small>「${e.sn}」</small>` : ''}</div>
      <div>${[e.pos, e.wt].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${e.ja.length ? `<div class="entry-ja">${e.ja.map(esc).join('　／　')}</div>` : ''}
      ${e.gl ? `<div class="entry-gl">${esc(e.gl)}</div>` : ''}`;
    if (forms.length) h += `<h3>時代ごとの形<span class="n">${forms.length}</span></h3><table><thead><tr><th>時代</th><th>形</th><th>Yale（参考）</th><th>声調</th></tr></thead><tbody>` +
      forms.map(f => `<tr${hitForm(f) ? ' class="hit"' : ''}><td>${vtag(f[0])}</td><td class="hangul">${esc(f[1])}</td><td class="ipa">${esc(f[2])}</td><td class="faint">${esc(f[4])}</td></tr>`).join('') + '</tbody></table>';
    if (e.c.length) h += `<h3>用例<span class="n">${e.c.length}</span></h3><table><thead><tr><th>時代</th><th>年</th><th>出典</th><th>用例</th></tr></thead><tbody>` +
      e.c.map(c => `<tr><td>${vtag(c[0])}</td><td class="num">${esc(c[2] ?? '')}</td><td class="num">${esc(c[3])}</td><td class="ctx">${ctx(c[4]) || `<span class="hangul">${esc(c[1])}</span>`}</td></tr>`).join('') + '</tbody></table>';
    h += `<p class="faint" style="font-size:12px;margin-top:18px">出典：우리말샘（国立国語院）の歴史情報${e.ja.length ? '，日本語訳は 한국어기초사전' : ''}．CC BY-SA 2.0 KR．<a href="https://opendict.korean.go.kr/search/searchResult?query=${encodeURIComponent(e.hw)}" rel="noopener" target="_blank">우리말샘 で開く</a></p></div>`;
    $('#detail').innerHTML = h;
    $('#detail').scrollTop = 0;
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
  const jaShard = n => (JA[n] ??= fetch(`data/ja/${String(n).padStart(2, '0')}.json`).then(r => r.json()).catch(() => ({})));
  async function jaLookup(cands) {
    const shards = [...new Set(cands.map(c => c.codePointAt(0) % (META.ja_shards || 32)))];
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
      tbtn = Object.assign(document.createElement('button'), { type: 'button', className: 'tr-btn', textContent: '訳' });
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
    tpop = document.createElement('div'); tpop.className = 'tr-pop'; tpop.setAttribute('role', 'dialog'); tpop.setAttribute('aria-label', '日本語訳');
    tpop.style.left = Math.max(scrollX + 8, Math.min(at.x, scrollX + innerWidth - 432)) + 'px'; tpop.style.top = at.y + 'px';
    tpop.innerHTML = `<form class="tr-head"><input value="${esc(word)}" aria-label="引く語"><button type="submit">引く</button></form><div class="tr-body"></div><div class="tr-foot"></div>`;
    document.body.appendChild(tpop);
    const inp = tpop.querySelector('input');
    tpop.querySelector('form').addEventListener('submit', e => { e.preventDefault(); runTr(compose(inp.value).normalize('NFC')); });
    runTr(word);
  }
  async function runTr(word) {
    const body = tpop.querySelector('.tr-body'), foot = tpop.querySelector('.tr-foot');
    body.innerHTML = '<div class="loading">引いています…</div>';
    const old = oldForms(word), cands = candidates(word), ja = cands.length ? await jaLookup(cands) : [];
    let h = '';
    if (old.rows.length) {
      h += `<div class="tr-sec">中期・近世の形 <span class="hangul">${esc(old.form)}</span> として</div>` + old.rows.map(r =>
        `<div class="tr-hit"><a href="#" class="tr-hw" data-open="${r[0]}">${esc(r[1])}</a>${r[2] ? `<span class="faint">「${r[2]}」</span>` : ''}${r[3] ? `<div class="tr-ja">${esc(r[3])}</div>` : ''}<div class="tr-ko">${esc(r[7] || '')}</div></div>`).join('');
    }
    if (ja.length) {
      h += `<div class="tr-sec">現代語として（한국어기초사전）</div>` + ja.map(([hw, pos, sn, jl, jd, ko]) =>
        `<div class="tr-hit"><span class="tr-hw">${esc(hw)}</span> <span class="tag">${esc(pos || '')}</span>${sn ? `<span class="faint">「${sn}」</span>` : ''}<div class="tr-ja">${esc(jl)}</div>${jd ? `<div class="tr-def">${esc(jd)}</div>` : ''}<div class="tr-ko">${esc(ko || '')}</div></div>`).join('');
    }
    body.innerHTML = h || `<div class="tr-hit tr-def">見つかりませんでした．語尾を外した形に直して「引く」を押してください．</div>`;
    const key = old.form || cands[0] || word;
    foot.innerHTML = `<a href="#q=${encodeURIComponent(key)}">この語で検索</a><a href="https://ja.dict.naver.com/#/search?query=${encodeURIComponent(cands[0] || word)}" target="_blank" rel="noopener">NAVER 韓日辞典で開く</a>`;
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
  const lab = () => { $('#theme').textContent = isDark() ? '明るい表示にする' : '暗い表示にする'; };
  lab();
  $('#theme').onclick = () => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; try { localStorage.setItem('lexica.theme', document.documentElement.dataset.theme); } catch (_) { /* なし */ } lab(); };
  const top = $('.top'); const setTop = () => document.documentElement.style.setProperty('--top-h', top.offsetHeight + 'px');
  setTop(); new ResizeObserver(setTop).observe(top);

  Promise.all([fetch('data/meta.json').then(r => r.json()), fetch('data/index.json').then(r => r.json()), fetch('data/jamo.json').then(r => r.json())]).then(([m, idx, jamo]) => {
    META = m; INDEX = idx; HKey.init(jamo);
    $('#meta').textContent = `${m.entries.toLocaleString()} 項目・${m.forms.toLocaleString()} 形・${m.citations.toLocaleString()} 用例（${m.built} 作成）`;
    fromHash();
  }).catch(() => { $('#info').textContent = 'データを読み込めませんでした．ページをウェブサーバー経由で開いてください（file:// では読めません）．'; });
})();
