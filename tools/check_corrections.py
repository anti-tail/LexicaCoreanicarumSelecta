#!/usr/bin/env python3
"""corrections/translations.tsv（訳と形の対応付けの訂正）の書式を確かめる．GitHub Actions が push と PR のたびに動かす．
    python3 tools/check_corrections.py corrections/translations.tsv
誤りがあれば行番号と理由を出して終了コード 1．書式は CONTRIBUTING.md．"""
import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPS = {"set", "add", "remove", "hide-form"}
COLS = ["id", "lang", "op", "value", "issue", "by", "note"]


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s).replace("〮", "").replace("〯", "").strip()


def main(path: str) -> int:
    index = {r[0]: r for r in json.loads((ROOT / "data" / "index.json").read_text(encoding="utf-8"))}
    errors, n = [], 0
    for i, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip() or line.startswith("#"):
            continue
        cells = line.split("\t")
        if cells[:3] == COLS[:3]:
            continue
        where = f"{path}:{i}"
        if len(cells) < 4:
            errors.append(f"{where}: 列が足りません（id, lang, op, value はタブで区切って必須）/ needs tab-separated id, lang, op, value")
            continue
        id_, lang, op, value = (c.strip() for c in cells[:4])
        if not id_.isdigit() or int(id_) not in index:
            errors.append(f"{where}: 項目番号 {id_!r} がありません / no such entry id")
            continue
        if op not in OPS:
            errors.append(f"{where}: op は {', '.join(sorted(OPS))} のどれか / op must be one of these (got {op!r})")
            continue
        if op == "hide-form":
            forms = {nfc(x[1:]) for x in (index[int(id_)][4] or "").split("|") if x}
            if nfc(value) not in forms:
                errors.append(f"{where}: 形 {value!r} は項目 {id_} にありません / form not in this entry ({' '.join(sorted(forms))})")
        else:
            if lang not in ("ja", "en"):
                errors.append(f"{where}: lang は ja か en / lang must be ja or en (got {lang!r})")
            if not value and op != "remove":
                errors.append(f"{where}: value が空です / value is empty")
        if len(cells) > 4 and cells[4].strip() and not cells[4].strip().lstrip("#").isdigit():
            errors.append(f"{where}: issue は Issue の番号（例 12 または #12）/ issue must be an Issue number")
        n += 1
    for e in errors:
        print(e)
    print(f"{n} 行を確かめました / checked {n} rows; {len(errors)} 件の誤り / errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "corrections/translations.tsv"))
