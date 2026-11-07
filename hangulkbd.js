/* hangulkbd.js — ハングルキーボード（任意表示）．本体の画面（lexica/static）と公開サイト（site_src）で同じファイルを使う．
   画面の下に韓国語の標準配列（두벌식，KS X 5002）と 옛한글 の字母（ㆍ ㅿ ㆁ ㅸ ㆆ ㅴ ㅺ …）を出し，
   押した字母を最後に選んでいた入力欄のカーソル位置で音節にまとめる（ㅁ ㆍ ㅿ ㆍ ㅁ → ᄆᆞᅀᆞᆷ，ㄱ ㅗ ㅏ → 과，ㄷ ㅏ ㄹ ㄱ → 닭）．
   各キーの隅には同じ位置の手元のキー（日本語・英語配列）を小さく示す．
   「手元のキーで打つ」を入れると，韓国語の入力方式を入れていなくても手元のキーで두벌식の字母が入る（日本語入力はオフで）．
   <script src="hangulkbd.js" data-lang="en"> で表示を英語に．開閉と設定はこの端末に記憶する（localStorage．使えなくても動く）．
   HKbd.compose(text) は字母の並びを音節にまとめる関数として単独でも使える． */
(() => {
  const script = document.currentScript;
  const LANG = (script?.dataset.lang || document.documentElement.lang || 'ja').startsWith('en') ? 'en' : 'ja';
  const S = {
    ja: { title: 'ハングル', layout: '두벌식', phys: '手元のキーで打つ', physTip: '手元のキーを押すと，同じ位置の字母が入ります（日本語入力はオフにしてください）',
      ime: '日本語入力をオフにしてください', close: '閉じる', target: '入力先：', pick: '入力欄を選んでください', field: '入力欄', old: '옛한글',
      shift: '⇧ 겹자음', shiftTip: '次の 1 字を ㄲ ㄸ ㅃ ㅆ ㅉ ㅒ ㅖ に', space: '空白', bs: '1 字母消す', enter: '⏎ 実行', enterTip: '検索する',
      open: 'ハングルキーボードを表示する／隠す', rail: 'ハングルキーボード', hand: '手元の ', aria: 'ハングルキーボード' },
    en: { title: 'Hangul', layout: '2-set (두벌식)', phys: 'Type with my keyboard', physTip: 'Your physical keys type the jamo at the same position (turn off any IME)',
      ime: 'Turn off your IME', close: 'Close', target: 'Typing into: ', pick: 'Select an input box', field: 'input', old: 'Old Hangul',
      shift: '⇧ Tense', shiftTip: 'Next key gives ㄲ ㄸ ㅃ ㅆ ㅉ ㅒ ㅖ', space: 'Space', bs: 'Delete one jamo', enter: '⏎ Go', enterTip: 'Search',
      open: 'Show / hide the Hangul keyboard', rail: 'Hangul keyboard', hand: 'key ', aria: 'Hangul keyboard' },
  }[LANG];

  // ---------------------------------------------------------------- 字母の表
  // 互換字母（キーの字）→ 結合字母（初声 L・中声 V・終声 T）
  const L = { 'ㄱ': 0x1100, 'ㄲ': 0x1101, 'ㄴ': 0x1102, 'ㄷ': 0x1103, 'ㄸ': 0x1104, 'ㄹ': 0x1105, 'ㅁ': 0x1106, 'ㅂ': 0x1107, 'ㅃ': 0x1108, 'ㅅ': 0x1109, 'ㅆ': 0x110A, 'ㅇ': 0x110B, 'ㅈ': 0x110C, 'ㅉ': 0x110D, 'ㅊ': 0x110E, 'ㅋ': 0x110F, 'ㅌ': 0x1110, 'ㅍ': 0x1111, 'ㅎ': 0x1112,
    'ㅿ': 0x1140, 'ㆁ': 0x114C, 'ㅸ': 0x112B, 'ㆆ': 0x1159, 'ㅄ': 0x1121, 'ㅴ': 0x1122, 'ㅵ': 0x1123, 'ㅳ': 0x1120, 'ㅶ': 0x1127, 'ㅷ': 0x1129, 'ㅺ': 0x112D, 'ㅻ': 0x112E, 'ㅼ': 0x112F, 'ㅽ': 0x1132, 'ㅾ': 0x1136, 'ㆀ': 0x1147, 'ㆅ': 0x1158, 'ㅹ': 0x112C };
  const T = { 'ㄱ': 0x11A8, 'ㄲ': 0x11A9, 'ㄳ': 0x11AA, 'ㄴ': 0x11AB, 'ㄵ': 0x11AC, 'ㄶ': 0x11AD, 'ㄷ': 0x11AE, 'ㄹ': 0x11AF, 'ㄺ': 0x11B0, 'ㄻ': 0x11B1, 'ㄼ': 0x11B2, 'ㄽ': 0x11B3, 'ㄾ': 0x11B4, 'ㄿ': 0x11B5, 'ㅀ': 0x11B6, 'ㅁ': 0x11B7, 'ㅂ': 0x11B8, 'ㅄ': 0x11B9, 'ㅅ': 0x11BA, 'ㅆ': 0x11BB, 'ㅇ': 0x11BC, 'ㅈ': 0x11BD, 'ㅊ': 0x11BE, 'ㅋ': 0x11BF, 'ㅌ': 0x11C0, 'ㅍ': 0x11C1, 'ㅎ': 0x11C2,
    'ㅿ': 0x11EB, 'ㆁ': 0x11F0, 'ㅸ': 0x11E6, 'ㆆ': 0x11F9, 'ㅭ': 0x11D7 };
  const V = { 'ㆍ': 0x119E, 'ㆎ': 0x11A1 };
  'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('').forEach((c, i) => { V[c] = 0x1161 + i; });
  const rev = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [String.fromCharCode(v), k]));
  const RL = rev(L), RV = rev(V), RT = rev(T);
  // 겹받침・겹모음（두벌식で続けて打つとまとまるもの）
  const FIN = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ', 'ㄹㅿ': 'ㅭ' };
  const VOW = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ', 'ㆍㅣ': 'ㆎ' };
  const SPLIT = Object.fromEntries([...Object.entries(FIN), ...Object.entries(VOW)].map(([k, v]) => [v, [...k]]));
  const isC = u => L[u] !== undefined || T[u] !== undefined;
  const isV = u => V[u] !== undefined;

  // 文字列 → 字母の単位（互換字母）．変換できない字は null
  function units(text) {
    const out = [];
    for (const ch of (text || '').normalize('NFD')) {
      const u = isC(ch) || isV(ch) ? ch : RL[ch] ?? RV[ch] ?? RT[ch];
      if (u === undefined) return null;
      out.push(u);
    }
    return out;
  }
  // 字母の単位 → 音節（두벌식のオートマトン．終声の後に母音が来たら，終声を次の音節の初声に移す）
  function build(us) {
    const syl = [];
    let cur = null;  // { l, v, t }
    const flush = () => { if (cur) syl.push(cur); cur = null; };
    for (const u of us) {
      if (isV(u)) {
        if (!cur) cur = { v: u };
        else if (!cur.v) cur.v = u;
        else if (!cur.t) {
          if (VOW[cur.v + u]) cur.v = VOW[cur.v + u];
          else { flush(); cur = { v: u }; }
        } else {
          let move = cur.t;
          if (SPLIT[cur.t] && L[SPLIT[cur.t][1]] !== undefined) { cur.t = SPLIT[move][0]; move = SPLIT[move][1]; }
          else delete cur.t;
          if (L[move] === undefined) { if (cur.t === undefined) cur.t = move; flush(); cur = { v: u }; continue; }
          flush(); cur = { l: move, v: u };
        }
      } else {
        if (cur && cur.v && cur.l !== undefined && !cur.t && T[u] !== undefined) cur.t = u;
        else if (cur && cur.t && FIN[cur.t + u]) cur.t = FIN[cur.t + u];
        else { flush(); cur = { l: u }; }
      }
    }
    flush();
    return syl.map(s => {
      if (s.l !== undefined && s.v) return (String.fromCharCode(L[s.l]) + String.fromCharCode(V[s.v]) + (s.t ? String.fromCharCode(T[s.t]) : '')).normalize('NFC');
      return (s.l ?? '') + (s.v ?? '');   // 母音のない子音・子音のない母音は互換字母のまま
    }).join('');
  }
  // 語の終わり（カーソルの前）のハングルの並びの開始位置．変換できない字の手前で止め，その音節の続きの中声・終声も外す
  function runStart(text) {
    const a = [...text];
    let k = a.length;
    while (k > 0 && a.length - k < 40) {
      const ch = a[k - 1];
      if (!/[ᄀ-ᇿㄱ-ㆎꥠ-꥿가-힣ힰ-퟿]/.test(ch) || !units(ch)) break;
      k--;
    }
    while (k < a.length && /[ᅠ-ᇿힰ-퟿]/.test(a[k])) k++;
    return a.slice(0, k).join('').length;
  }
  function compose(text) {
    const s = runStart(text);
    const us = units(text.slice(s));
    return us ? text.slice(0, s) + build(us) : text;
  }
  // 最後の字母を 1 つ消す（닭 → 달，과 → 고）
  function dropOne(text) {
    const s = runStart(text), us = units(text.slice(s));
    if (!us || !us.length) return null;
    const last = us.pop();
    if (SPLIT[last]) us.push(SPLIT[last][0]);
    return text.slice(0, s) + build(us);
  }

  // ---------------------------------------------------------------- キーボード
  const ROWS = [
    [['KeyQ', 'ㅂ', 'ㅃ'], ['KeyW', 'ㅈ', 'ㅉ'], ['KeyE', 'ㄷ', 'ㄸ'], ['KeyR', 'ㄱ', 'ㄲ'], ['KeyT', 'ㅅ', 'ㅆ'], ['KeyY', 'ㅛ'], ['KeyU', 'ㅕ'], ['KeyI', 'ㅑ'], ['KeyO', 'ㅐ', 'ㅒ'], ['KeyP', 'ㅔ', 'ㅖ']],
    [['KeyA', 'ㅁ'], ['KeyS', 'ㄴ'], ['KeyD', 'ㅇ'], ['KeyF', 'ㄹ'], ['KeyG', 'ㅎ'], ['KeyH', 'ㅗ'], ['KeyJ', 'ㅓ'], ['KeyK', 'ㅏ'], ['KeyL', 'ㅣ']],
    [['KeyZ', 'ㅋ'], ['KeyX', 'ㅌ'], ['KeyC', 'ㅊ'], ['KeyV', 'ㅍ'], ['KeyB', 'ㅠ'], ['KeyN', 'ㅜ'], ['KeyM', 'ㅡ']],
  ];
  const OLD = [['ㆍ', '아래아'], ['ㅿ', '반치음'], ['ㆁ', '옛이응'], ['ㅸ', '순경음 비읍'], ['ㆆ', '여린히읗'], ['ㆎ', 'ㆍ+ㅣ'], ['ㅄ', 'ㅂㅅ'], ['ㅴ', 'ㅂㅅㄱ'], ['ㅵ', 'ㅂㅅㄷ'], ['ㅳ', 'ㅂㄷ'], ['ㅶ', 'ㅂㅈ'], ['ㅷ', 'ㅂㅌ'], ['ㅺ', 'ㅅㄱ'], ['ㅼ', 'ㅅㄷ'], ['ㅽ', 'ㅅㅂ'], ['ㅾ', 'ㅅㅈ'], ['ㆅ', '쌍히읗']];
  const BY_CODE = Object.fromEntries(ROWS.flat().map(([c, a, b]) => [c, [a, b || a]]));
  const US = {};
  let LABEL = code => US[code] || code.replace(/^Key/, '').toLowerCase();

  const store = {
    get(k, d) { try { return localStorage.getItem('lexica.hkbd.' + k) ?? d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem('lexica.hkbd.' + k, v); } catch (_) { /* 記憶できなくても動く */ } },
  };
  const isText = el => el && ((el.tagName === 'INPUT' && /^(text|search|)$/.test(el.type || '')) || el.tagName === 'TEXTAREA') && !el.readOnly && !el.disabled;
  let target = null, panel = null, shift = false, physical = store.get('physical', '0') === '1';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = `
.hkbd { position: fixed; z-index: 2000; left: 50%; bottom: 14px; transform: translateX(-50%); width: min(640px, calc(100vw - 16px));
  background: var(--surface, #fff); color: var(--ink, #1c2530); border: 1px solid var(--rule-strong, #b9c2bc); border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,.18); padding: 8px 10px 10px; font-family: var(--font-ui, system-ui, sans-serif); user-select: none; -webkit-user-select: none; }
.hkbd[hidden] { display: none; }
.hkbd-head { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--muted, #5b6670); margin-bottom: 4px; cursor: move; flex-wrap: wrap; }
.hkbd-head b { color: var(--ink, #1c2530); font-weight: 600; }
.hkbd-head label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
.hkbd-head .sp { flex: 1; }
.hkbd-head .x { border: 0; background: none; font-size: 18px; line-height: 1; color: var(--muted, #5b6670); cursor: pointer; padding: 0 4px; }
.hkbd-tgt { font-size: 11.5px; color: var(--faint, #8a949c); }
.hkbd-warn { font-size: 11.5px; color: var(--vermilion, #b2452f); }
.hkbd-row { display: flex; gap: 4px; margin-top: 4px; justify-content: center; }
.hkbd-row.r1 { padding-left: 18px; } .hkbd-row.r2 { padding-left: 46px; }
.hkbd-row.old { flex-wrap: wrap; margin-top: 2px; padding-bottom: 6px; border-bottom: 1px dashed var(--rule, #d5dcd7); margin-bottom: 4px; align-items: center; }
.hkbd-row.old .lab { font-size: 11px; color: var(--faint, #8a949c); margin-right: 2px; }
.hkbd button.k { position: relative; flex: 0 0 auto; min-width: 46px; height: 42px; border: 1px solid var(--rule, #d5dcd7); border-radius: 6px;
  background: var(--surface-2, #f6f8f6); color: var(--ink, #1c2530); font: 500 19px/1 var(--font-hangul, serif); cursor: pointer; padding: 0 6px; }
.hkbd button.k:hover { border-color: var(--indigo, #2b4c8c); }
.hkbd button.k:active, .hkbd button.k.hit { background: var(--indigo-soft, #dde5f3); }
.hkbd button.k small { position: absolute; left: 4px; top: 2px; font: 10px/1 var(--font-ui, system-ui), sans-serif; color: var(--faint, #8a949c); }
.hkbd button.k sup { position: absolute; right: 4px; top: 3px; font: 11px/1 var(--font-hangul, serif); color: var(--faint, #8a949c); }
.hkbd .old button.k { min-width: 34px; height: 34px; font-size: 17px; background: var(--surface, #fff); }
.hkbd button.k.x2 { min-width: 74px; font: 13px/1 var(--font-ui, system-ui), sans-serif; } .hkbd button.k.sp { flex: 1 1 auto; max-width: 240px; font: 12px/1 var(--font-ui, system-ui), sans-serif; color: var(--muted, #5b6670); }
.hkbd button.k[aria-pressed="true"] { background: var(--indigo-soft, #dde5f3); border-color: var(--indigo, #2b4c8c); }
.btn.hkbd-open, .hkbd-open.btn { min-width: 42px; padding: 0 10px; background: var(--surface, #fff); color: var(--ink, #1c2530); border: 1px solid var(--rule-strong, #b9c2bc); font: 500 17px/1 var(--font-hangul, serif); }
.hkbd-open[aria-pressed="true"] { background: var(--indigo-soft, #dde5f3); border-color: var(--indigo, #2b4c8c); color: var(--indigo, #2b4c8c); }
@media (max-width: 560px) { .hkbd button.k { min-width: 28px; height: 38px; font-size: 16px; padding: 0 2px; } .hkbd button.k small, .hkbd button.k sup { display: none; }
  .hkbd-row.r1, .hkbd-row.r2 { padding-left: 0; } .hkbd .old button.k { min-width: 30px; } }
`;

  const curTarget = () => (target && document.contains(target) ? target : document.querySelector('input.field.big'));
  function setValue(el, before, after) {
    el.value = before + after;
    el.setSelectionRange(before.length, before.length);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  // 字母を入れて，カーソルの前の語を音節にまとめ直す
  function type(ch, el = curTarget()) {
    if (!el) return;
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, s) + ch;
    setValue(el, isC(ch) || isV(ch) ? compose(before) : before, el.value.slice(e));
  }
  function backspace() {
    const el = curTarget(); if (!el) return;
    el.focus({ preventScroll: true });
    const s = el.selectionStart, e = el.selectionEnd;
    if (s !== e) { setValue(el, el.value.slice(0, s), el.value.slice(e)); return; }
    if (!s) return;
    const head = el.value.slice(0, s);
    const d = dropOne(head);
    setValue(el, d ?? [...head].slice(0, -1).join(''), el.value.slice(e));
  }
  function key(b) {
    const ch = shift && b.dataset.sh ? b.dataset.sh : b.dataset.ch;
    type(ch);
    if (shift) setShift(false);
  }
  function setShift(on) {
    shift = on;
    panel?.querySelector('[data-act="shift"]')?.setAttribute('aria-pressed', on);
    panel?.querySelectorAll('button.k[data-sh]').forEach(b => { b.firstChild.textContent = on ? b.dataset.sh : b.dataset.ch; });
  }
  function showTarget() {
    const t = panel?.querySelector('.hkbd-tgt'); if (!t) return;
    const el = target && document.contains(target) ? target : null;
    t.textContent = el ? S.target + (el.getAttribute('aria-label') || el.placeholder || el.id || S.field).slice(0, 24) : S.pick;
  }

  function makePanel() {
    panel = document.createElement('div');
    panel.className = 'hkbd'; panel.hidden = true; panel.lang = 'ko';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', S.aria);
    const k = (code, ch, sh) => `<button type="button" class="k" data-ch="${ch}"${sh ? ` data-sh="${sh}"` : ''} data-code="${code}" title="${ch}${sh ? ' ' + sh : ''}（${S.hand}${LABEL(code)}）">${ch}<small>${esc(LABEL(code))}</small>${sh ? `<sup>${sh}</sup>` : ''}</button>`;
    panel.innerHTML = `<div class="hkbd-head" lang="${LANG}"><b>${S.title}</b><span>${S.layout}</span>
        <label title="${S.physTip}"><input type="checkbox" class="phys" ${physical ? 'checked' : ''}> ${S.phys}</label>
        <span class="hkbd-warn" hidden>${S.ime}</span>
        <span class="sp"></span><span class="hkbd-tgt"></span><button type="button" class="x" title="${S.close}" aria-label="${S.close}">×</button></div>
      <div class="hkbd-row old"><span class="lab" lang="${LANG}">${S.old}</span>${OLD.map(([ch, t]) => `<button type="button" class="k" data-ch="${ch}" title="${t}">${ch}</button>`).join('')}</div>
      ${ROWS.map((r, i) => `<div class="hkbd-row r${i}">${r.map(([c, a, b]) => k(c, a, b)).join('')}</div>`).join('')}
      <div class="hkbd-row" lang="${LANG}"><button type="button" class="k x2" data-act="shift" aria-pressed="false" title="${S.shiftTip}">${S.shift}</button>
        <button type="button" class="k sp" data-act="space">${S.space}</button><button type="button" class="k x2" data-act="bs" title="${S.bs}">⌫</button>
        <button type="button" class="k x2" data-act="enter" title="${S.enterTip}">${S.enter}</button></div>`;
    document.body.appendChild(panel);
    panel.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.preventDefault(); });  // 入力欄のフォーカスを保つ
    panel.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('x')) return toggle(false);
      if (b.dataset.ch) return key(b);
      const act = b.dataset.act;
      if (act === 'shift') setShift(!shift);
      else if (act === 'space') type(' ');
      else if (act === 'bs') backspace();
      else if (act === 'enter') { const t = curTarget(); const f = t?.form; if (f) f.requestSubmit ? f.requestSubmit() : f.submit(); else t?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }
    });
    panel.querySelector('.phys').addEventListener('change', e => { physical = e.target.checked; store.set('physical', physical ? '1' : '0'); curTarget()?.focus(); });
    const head = panel.querySelector('.hkbd-head');
    head.addEventListener('pointerdown', e => {
      if (e.target.closest('button, input, label')) return;
      const r = panel.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      const mv = ev => { panel.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx)) + 'px'; panel.style.top = Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy)) + 'px'; panel.style.bottom = 'auto'; panel.style.transform = 'none'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
    navigator.keyboard?.getLayoutMap?.().then(m => {
      LABEL = code => m.get(code) || US[code] || code.replace(/^Key/, '').toLowerCase();
      panel.querySelectorAll('button.k[data-code]').forEach(b => { const s = b.querySelector('small'); if (s) s.textContent = LABEL(b.dataset.code); });
    }).catch(() => {});
  }

  function toggle(on) {
    if (!panel) makePanel();
    on = on ?? panel.hidden;
    panel.hidden = !on;
    store.set('open', on ? '1' : '0');
    document.querySelectorAll('.hkbd-open').forEach(b => b.setAttribute('aria-pressed', on));
    if (on) { if (!target || !document.contains(target)) target = document.querySelector('input.field.big'); showTarget(); target?.focus({ preventScroll: true }); }
  }

  document.addEventListener('focusin', e => { if (isText(e.target) && !e.target.closest('.hkbd')) { target = e.target; showTarget(); } });
  // 手元のキー → 두벌식の字母
  document.addEventListener('keydown', e => {
    if (!panel || panel.hidden || !physical || e.ctrlKey || e.metaKey || e.altKey || !isText(e.target)) return;
    const warn = panel.querySelector('.hkbd-warn');
    if (e.isComposing || e.key === 'Process' || e.keyCode === 229) { warn.hidden = false; return; }
    warn.hidden = true;
    target = e.target;
    if (e.key === 'Backspace' && e.target.selectionStart === e.target.selectionEnd && e.target.selectionStart > 0) {
      const ch = e.target.value[e.target.selectionStart - 1];
      if (/[ᄀ-ᇿㄱ-ㆎ가-힣ꥠ-꥿ힰ-퟿]/.test(ch)) { e.preventDefault(); backspace(); }
      return;
    }
    const m = BY_CODE[e.code];
    if (!m) return;
    e.preventDefault();
    type((e.shiftKey !== shift) ? m[1] : m[0], e.target);
    if (shift) setShift(false);
    const b = panel.querySelector(`button.k[data-code="${e.code}"]`);
    if (b) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120); }
  });

  // 開閉のボタン：大きな検索欄の横と，左の欄の下（本体の画面）
  function addButtons() {
    document.querySelectorAll('input.field.big').forEach(inp => {
      if (inp.nextElementSibling?.classList.contains('hkbd-open')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn hkbd-open'; b.textContent = '한'; b.lang = 'ko';
      b.title = S.open; b.setAttribute('aria-label', S.open); b.setAttribute('aria-pressed', 'false');
      b.addEventListener('pointerdown', e => e.preventDefault());
      b.addEventListener('click', () => { target = inp; toggle(); });
      inp.insertAdjacentElement('afterend', b);
    });
    const foot = document.querySelector('.rail-foot');
    if (foot && !foot.querySelector('.hkbd-open')) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'theme-toggle hkbd-open'; b.textContent = S.rail; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('pointerdown', e => e.preventDefault());
      b.addEventListener('click', () => toggle());
      foot.insertBefore(b, foot.children[1] || null);
    }
  }
  const start = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    addButtons();
    if (store.get('open', '0') === '1') toggle(true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.HKbd = { toggle, type, compose, dropOne };
})();
