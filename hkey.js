/* hkey.js — 検索用の照合キー（lexica/searchkey.py と同じ規則．説明はそちらを参照）
   音節の組み方（連綴・分綴・重綴）を吸収し，era=16…19 ではその世紀に合流した字母・綴りも同じ分節に寄せる．
   HKey.init(jamoTable) のあと HKey.key(text, era) → 分節 1 つを 1 文字にした文字列（ᄆᆞᅀᆞᆷ → 'mAzAm'）． */
(function (root) {
  let T = {};
  const VOWEL = new Set(['a', 'ə', 'o', 'u', 'ɨ', 'i', 'ʌ', 'y', 'w', 'ɛ', 'e']);
  const TENSE = { k: 'kk', t: 'tt', p: 'pp', c: 'cc', s: 'ss' };
  const SAME_PLACE = {
    k: new Set(['k', 'kh', 'kk']), p: new Set(['p', 'ph', 'pp']), t: new Set(['t', 'th', 'tt', 'ch', 'cc']),
    s: new Set(['s', 'ss', 'th', 'tt', 'ch', 'cc', 'kk', 'pp']), c: new Set(['c', 'ch', 'cc']),
  };
  const BETA = { 'ʌ': ['o'], 'ɨ': ['u'], 'a': ['w', 'a'], 'ə': ['w', 'ə'], 'i': ['u', 'y'] };
  const PAL = { t: 'c', th: 'ch', tt: 'cc' };
  const SYL = /([ᄀ-ᅟꥠ-ꥼ]+)([ᅠ-ᆧힰ-ퟆ]*)([ᆨ-ᇿퟋ-ퟻ]*)/g;
  const last = a => a[a.length - 1];

  function sylls(text) {
    let s = (text || '').normalize('NFD');
    if (/[ㄱ-ㆎ]/.test(s)) s = [...s].map(c => (T[c] && T[c][0] === 'C') ? T[c][1] : c).join('');
    const out = [];
    for (const m of s.matchAll(SYL)) {
      const seg = (str, pos) => [...str].flatMap(c => (T[c] && T[c][0] === pos) ? T[c][1] : [c]);
      out.push([seg(m[1], 'L'), seg(m[2], 'V'), seg(m[3], 'T')]);
    }
    return out;
  }
  function apply(syls, era) {
    let segs = [];
    syls.forEach(([on0, nu0, co0], i) => {
      let on = on0.slice(), nu = nu0.slice(), co = co0.slice();
      if (era >= 16) {
        on = on.filter(x => x !== 'ʔ'); co = co.filter(x => x !== 'ʔ');
        if (on.length && last(on) === 'β') { on = on.slice(0, -1); if (nu.length) nu = (BETA[nu[0]] || [nu[0]]).concat(nu.slice(1)); }
        co = co.map(x => x === 't' ? 's' : x);
        if (i > 0) nu = nu.map(x => x === 'ʌ' ? 'ɨ' : x);
      }
      if (era >= 17) {
        on = on.filter(x => x !== 'z'); co = co.filter(x => x !== 'z');
        if (on.length >= 2 && on.slice(0, -1).every(x => x === 'p' || x === 's') && TENSE[last(on)]) on = [TENSE[last(on)]];
      }
      if (era >= 18 && i === 0 && nu[0] === 'ʌ') nu[0] = 'a';
      segs = segs.concat(on, nu, co);
    });
    // 子音と後ろの母音にかかる規則は，音節の切れ目を捨ててから当てる
    const n = segs.length;
    for (let k = 0; k < n; k++) {
      let x = segs[k]; const nx = segs[k + 1] ?? '';
      if (era >= 18 && PAL[x] && (nx === 'i' || nx === 'y')) segs[k] = x = PAL[x];
      if (era >= 17 && ['m', 'p', 'ph', 'pp'].includes(x) && nx === 'ɨ') segs[k + 1] = 'u';
      if (era >= 19 && ['s', 'c', 'ch', 'cc', 'ss'].includes(x) && nx === 'ɨ' && (segs[k + 2] ?? '') !== 'y') segs[k + 1] = 'i';
    }
    if (era >= 17) segs = segs.filter((x, k) => !(x === 'y' && k > 0 && ['c', 'ch', 'cc'].includes(segs[k - 1]) && k + 1 < segs.length && VOWEL.has(segs[k + 1])));
    if (era >= 18 && segs.length > 1 && segs[0] === 'n' && (segs[1] === 'i' || segs[1] === 'y')) segs = segs.slice(1);
    if (era >= 16) {
      const out = [];
      for (const x of segs) { if (out.length && !VOWEL.has(x) && last(out) === x) continue; out.push(x); }
      segs = out;
    }
    if (era >= 17) {
      segs = segs.map((x, k) => (x === 'n' && k > 0 && segs[k - 1] === 'l') ? 'l' : x);
      const out = [];
      for (const x of segs) {
        if (out.length && last(out) === x && !VOWEL.has(x)) continue;
        if (out.length && !VOWEL.has(x) && SAME_PLACE[last(out)] && SAME_PLACE[last(out)].has(x) && (out.length < 2 || VOWEL.has(out[out.length - 2]))) { out[out.length - 1] = x; continue; }
        out.push(x);
      }
      segs = out;
    }
    return segs;
  }
  const CODE = {
    k: 'k', kk: 'K', kh: 'x', n: 'n', nn: 'N', t: 't', tt: 'T', th: 'D', l: 'l', ll: 'L',
    m: 'm', p: 'p', pp: 'P', ph: 'F', s: 's', ss: 'S', c: 'c', cc: 'C', ch: 'J', h: 'h', hh: 'H',
    'β': 'B', 'ββ': 'W', 'w̃': 'M', f: 'f', z: 'z', 'ŋ': 'G', 'ʔ': 'Q',
    a: 'a', 'ə': 'e', o: 'o', u: 'u', 'ɨ': 'U', i: 'i', 'ʌ': 'A', y: 'y', w: 'w', 'ɛ': 'E', e: 'R',
  };
  const join = s => s.map(x => CODE[x] ?? x).join('');
  const HKey = {
    ERAS: [15, 16, 17, 18, 19],
    VARIETY_ERA: { LMK15: 15, LMK16: 16, EMK17: 17, EMK18: 18, EMK19: 19 },
    init(table) { T = table || {}; },
    segs(text, era = 0) { return apply(sylls(text), era); },
    key(text, era = 0) { return join(apply(sylls(text), era)); },
    keysFor(text, eras) { const s = sylls(text); return eras.map(e => join(apply(s, e))); },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = HKey; else root.HKey = HKey;
})(typeof self !== 'undefined' ? self : this);
