/* Lexica Koreanicarum — 中期・近世朝鮮語の静的検索（データは data/ の JSON） */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VNAME = { LMK15: '15 世紀', LMK16: '16 世紀', OLD: '옛말', EMK17: '17 世紀', EMK18: '18 世紀', EMK19: '19 世紀' };
  const VCLS = { LMK15: 'L', LMK16: 'L', OLD: 'O', EMK17: 'E', EMK18: 'E', EMK19: 'E' };
  const vtag = v => `<span class="tag v-${VCLS[v] || ''}">${esc(VNAME[v] || v)}</span>`;
  let INDEX = [], META = {}, SHARDS = {}, current = null;

  // ---------- 表記の正規化：NFD，傍点を除く，互換字母を結合字母に（ㅁㆍㅿㆍㅁ → ᄆᆞᅀᆞᆷ）
  const CHO = { 'ㄱ': 0x1100, 'ㄲ': 0x1101, 'ㄴ': 0x1102, 'ㄷ': 0x1103, 'ㄸ': 0x1104, 'ㄹ': 0x1105, 'ㅁ': 0x1106, 'ㅂ': 0x1107, 'ㅃ': 0x1108, 'ㅅ': 0x1109, 'ㅆ': 0x110A, 'ㅇ': 0x110B, 'ㅈ': 0x110C, 'ㅉ': 0x110D, 'ㅊ': 0x110E, 'ㅋ': 0x110F, 'ㅌ': 0x1110, 'ㅍ': 0x1111, 'ㅎ': 0x1112,
    'ㅿ': 0x1140, 'ㆁ': 0x114C, 'ㅸ': 0x112B, 'ㆆ': 0x1159, 'ㅄ': 0x1121, 'ㅴ': 0x1122, 'ㅵ': 0x1123, 'ㅳ': 0x1120, 'ㅶ': 0x1127, 'ㅷ': 0x1129, 'ㅺ': 0x112D, 'ㅻ': 0x112E, 'ㅼ': 0x112F, 'ㅽ': 0x1132, 'ㅾ': 0x1136, 'ㆀ': 0x1147, 'ㆅ': 0x1158, 'ㅹ': 0x112C };
  const JONG = { 'ㄱ': 0x11A8, 'ㄲ': 0x11A9, 'ㄳ': 0x11AA, 'ㄴ': 0x11AB, 'ㄵ': 0x11AC, 'ㄶ': 0x11AD, 'ㄷ': 0x11AE, 'ㄹ': 0x11AF, 'ㄺ': 0x11B0, 'ㄻ': 0x11B1, 'ㄼ': 0x11B2, 'ㄽ': 0x11B3, 'ㄾ': 0x11B4, 'ㄿ': 0x11B5, 'ㅀ': 0x11B6, 'ㅁ': 0x11B7, 'ㅂ': 0x11B8, 'ㅄ': 0x11B9, 'ㅅ': 0x11BA, 'ㅆ': 0x11BB, 'ㅇ': 0x11BC, 'ㅈ': 0x11BD, 'ㅊ': 0x11BE, 'ㅋ': 0x11BF, 'ㅌ': 0x11C0, 'ㅍ': 0x11C1, 'ㅎ': 0x11C2,
    'ㅿ': 0x11EB, 'ㆁ': 0x11F0, 'ㅸ': 0x11E6, 'ㆆ': 0x11F9 };
  const VOW = { 'ㆍ': 0x119E, 'ㆎ': 0x11A1 };
  'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('').forEach((c, i) => { VOW[c] = 0x1161 + i; });
  const isVowel = ch => ch && (VOW[ch] !== undefined || (ch >= 'ᅠ' && ch <= 'ᆧ') || (ch >= 'ힰ' && ch <= 'ퟆ'));
  const isLeadOrVowelEnd = ch => ch && ((ch >= 'ᅠ' && ch <= 'ᇿ') || (ch >= 'ힰ' && ch <= '퟿') || VOW[ch] !== undefined);
  function normalize(s) {
    const a = [...(s || '').normalize('NFD').replace(/[〮〯·]/g, '').replace(/\s+/g, '')];
    let out = '';
    for (let i = 0; i < a.length; i++) {
      const ch = a[i], next = a[i + 1], prev = out.slice(-1);
      if (VOW[ch] !== undefined) out += String.fromCharCode(VOW[ch]);
      else if (CHO[ch] !== undefined || JONG[ch] !== undefined) {
        if (isVowel(next) && CHO[ch] !== undefined) out += String.fromCharCode(CHO[ch]);
        else if (isLeadOrVowelEnd(prev) && JONG[ch] !== undefined) out += String.fromCharCode(JONG[ch]);
        else out += String.fromCharCode(CHO[ch] ?? JONG[ch]);
      } else out += ch;
    }
    return out;
  }

  // ---------- 検索
  const sel = () => new Set($$('.stages input:checked').map(i => i.value));
  function score(row, q, kind) {
    const [id, hw, sn, ja, forms, yale, st, gl] = row;
    let s = 0;
    if (kind === 'yale') {
      for (const y of yale.split('|')) { if (!y) continue; if (y === q) s = Math.max(s, 4); else if (y.startsWith(q)) s = Math.max(s, 3); else if (y.includes(q)) s = Math.max(s, 1.5); }
    } else if (kind === 'ja') {
      if (ja.includes(q)) s = ja.startsWith(q) ? 3 : 2;
    } else {
      for (const f of forms.split('|')) { if (!f) continue; if (f === q) s = Math.max(s, 5); else if (f.startsWith(q)) s = Math.max(s, 3.5); else if (f.includes(q)) s = Math.max(s, 2); }
      const h = hw.normalize('NFD');
      if (h === q) s = Math.max(s, 4.5); else if (h.startsWith(q)) s = Math.max(s, 2.5); else if (h.includes(q)) s = Math.max(s, 1.2);
      if (!s && gl && gl.normalize('NFD').includes(q)) s = 0.5;
    }
    return s;
  }
  function search(raw) {
    const q0 = (raw || '').trim();
    if (!q0) { $('#results').innerHTML = ''; $('#info').textContent = `${INDEX.length.toLocaleString()} 項目`; return; }
    let kind = 'hangul', q;
    if (/^[a-zA-Z.\- ]+$/.test(q0)) { kind = 'yale'; q = q0.toLowerCase().replace(/\s+/g, ' '); }
    else if (/[぀-ヿ㐀-鿿]/.test(q0) && !/[ᄀ-ᇿ가-힣㄰-㆏]/.test(q0)) { kind = 'ja'; q = q0; }
    else q = normalize(q0);
    const st = sel();
    const hits = [];
    for (const row of INDEX) {
      if (![...row[6]].some(c => st.has(c))) continue;
      const s = score(row, q, kind);
      if (s) hits.push([s, row]);
    }
    hits.sort((a, b) => b[0] - a[0] || a[1][1].length - b[1][1].length || a[1][2] - b[1][2]);
    $('#info').textContent = hits.length ? `${hits.length.toLocaleString()} 項目${hits.length > 300 ? '（上位 300）' : ''}　${{ yale: 'Yale で', ja: '日本語訳で', hangul: '形と見出しで' }[kind]}探しました` : '見つかりません．綴りを短くするか，時代の絞り込みを外してください．';
    $('#results').innerHTML = hits.slice(0, 300).map(([, r]) => {
      const old = r[4].split('|').filter(Boolean).slice(0, 4).map(x => x.normalize('NFC'));
      return `<li class="item" data-id="${r[0]}" tabindex="0" aria-selected="${r[0] === current}">
        <div class="item-head"><span class="item-hw">${esc(r[1])}</span>${r[2] ? `<span class="faint">「${r[2]}」</span>` : ''}<span class="item-old">${old.map(esc).join('　')}</span></div>
        ${r[3] ? `<div class="item-ja">${esc(r[3])}</div>` : ''}${r[7] ? `<div class="item-gl">${esc(r[7])}</div>` : ''}</li>`;
    }).join('');
    $$('#results .item').forEach(li => { li.onclick = () => open(+li.dataset.id); li.onkeydown = e => { if (e.key === 'Enter') open(+li.dataset.id); }; });
    if (hits.length && !current) open(hits[0][1][0], true);
  }

  // ---------- 項目
  async function shard(n) {
    if (!SHARDS[n]) SHARDS[n] = fetch(`data/e/${String(n).padStart(2, '0')}.json`).then(r => r.json());
    return SHARDS[n];
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
      forms.map(f => `<tr><td>${vtag(f[0])}</td><td class="hangul">${esc(f[1])}</td><td class="ipa">${esc(f[2])}</td><td class="faint">${esc(f[4])}</td></tr>`).join('') + '</tbody></table>';
    if (e.c.length) h += `<h3>用例<span class="n">${e.c.length}</span></h3><table><thead><tr><th>時代</th><th>年</th><th>出典</th><th>用例</th></tr></thead><tbody>` +
      e.c.map(c => `<tr><td>${vtag(c[0])}</td><td class="num">${esc(c[2] ?? '')}</td><td class="num">${esc(c[3])}</td><td class="ctx">${ctx(c[4]) || `<span class="hangul">${esc(c[1])}</span>`}</td></tr>`).join('') + '</tbody></table>';
    h += `<p class="faint" style="font-size:12px;margin-top:18px">出典：우리말샘（国立国語院）の歴史情報${e.ja.length ? '，日本語訳は 한국어기초사전' : ''}．CC BY-SA 2.0 KR．<a href="https://opendict.korean.go.kr/search/searchResult?query=${encodeURIComponent(e.hw)}" rel="noopener" target="_blank">우리말샘 で開く</a></p></div>`;
    $('#detail').innerHTML = h;
    $('#detail').scrollTop = 0;
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
  $$('.palette button').forEach(b => b.addEventListener('click', () => {
    const q = $('#q'), s = q.selectionStart ?? q.value.length;
    q.value = q.value.slice(0, s) + b.dataset.ins + q.value.slice(q.selectionEnd ?? s);
    q.focus(); q.setSelectionRange(s + 1, s + 1);
  }));
  // 表示
  try { const t = localStorage.getItem('lexica.theme'); if (t) document.documentElement.dataset.theme = t; } catch (_) { /* なし */ }
  const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const lab = () => { $('#theme').textContent = isDark() ? '明るい表示にする' : '暗い表示にする'; };
  lab();
  $('#theme').onclick = () => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; try { localStorage.setItem('lexica.theme', document.documentElement.dataset.theme); } catch (_) { /* なし */ } lab(); };
  const top = $('.top'); const setTop = () => document.documentElement.style.setProperty('--top-h', top.offsetHeight + 'px');
  setTop(); new ResizeObserver(setTop).observe(top);

  Promise.all([fetch('data/meta.json').then(r => r.json()), fetch('data/index.json').then(r => r.json())]).then(([m, idx]) => {
    META = m; INDEX = idx;
    $('#meta').textContent = `${m.entries.toLocaleString()} 項目・${m.forms.toLocaleString()} 形・${m.citations.toLocaleString()} 用例（${m.built} 作成）`;
    fromHash();
  }).catch(() => { $('#info').textContent = 'データを読み込めませんでした．ページをウェブサーバー経由で開いてください（file:// では読めません）．'; });
})();
