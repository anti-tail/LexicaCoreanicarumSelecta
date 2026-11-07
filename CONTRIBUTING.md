# 誤りの報告と訂正 / Reporting and correcting errors

[日本語](#日本語) · [English](#english)

## 日本語

このサイトの日本語訳・英語訳は，中期・近世朝鮮語の項目（우리말샘 の歴史情報）に，同じ現代語の見出しを持つ 한국어기초사전 の対訳を機械的に結びつけたものです．
同じ見出しの別の意味の訳が付いていたり，項目に別の語の形が入っていたりすることがあります．

### 誤りを知らせる（どなたでも）

1. 項目の下の「誤りを報告」を押します．GitHub の Issue の書式が，項目番号・見出し・今の訳と形を入れた状態で開きます（GitHub のアカウントが要ります）．
2. 「誤りの種類」と「直し方の案」を書いて送ります．根拠（文献・辞書・用例）があれば添えてください．

### 直す（協力者）

訂正は [`corrections/translations.tsv`](corrections/translations.tsv) に 1 行足すだけです．ページは読み込むたびにこの表を当てるので，
コミットから 1 分ほどで公開中のサイトに反映されます（データの書き出し直しは要りません）．

1. Issue を開き，項目番号を確かめます．
2. GitHub で `corrections/translations.tsv` を開き，鉛筆のボタン（Edit this file）で行を足します．列は**タブ**で区切ります．
3. コミットの説明に `Fixes #12`（Issue の番号）と書くと，コミットと同時に Issue が閉じます．
   - リポジトリの書き込み権限がある協力者は main に直接コミットできます．
   - 権限がない方は「Propose changes」で Pull Request になります．管理者が確かめて取り込みます．
4. 書式は GitHub Actions（訂正の表の点検）が自動で確かめます．赤い × が付いたら，Actions の記録に行番号と理由が出ています．

| 列 | 内容 |
| --- | --- |
| `id` | 項目番号（URL の `#id=` の数字．Issue の「項目番号」） |
| `lang` | `ja`（日本語訳）か `en`（英語訳）．形を外すときは `-` |
| `op` | `set`：訳をこの値に置き換える／`add`：訳を足す／`remove`：訳を外す／`hide-form`：形をこの項目から外す |
| `value` | 訳（複数は `\|` で区切る），または外す形（表示どおり．傍点は無くてよい） |
| `issue` | Issue の番号（任意） |
| `by` | 直した人（GitHub の名前など．任意） |
| `note` | 注（任意） |

例（`→` はタブ）：

```
1234567→ja→set→こころ【心】|きもち【気持ち】→12→shiratori→한국어기초사전 の別の語義の訳が付いていた
1234567→en→remove→personality→12→shiratori→
7654321→-→hide-form→ᄆᆞᅀᆞᆷ→15→shiratori→심장 ではなく 마음 の形
```

同じ項目・言語の行は上から順に当たります（`set` の後に `add` など）．訂正された項目には「訂正済み」の印と Issue へのリンク，元の訳が出ます．
外した形は打ち消し線で残し，検索には当たらなくなります．

協力者の追加は管理者がリポジトリの Settings → Collaborators から招待します（Write 権限）．

## English

The Japanese and English translations on this site are attached automatically: each Middle/Early Modern Korean entry (historical data of 우리말샘) receives the equivalents
that 한국어기초사전 gives for the same modern headword. A translation may belong to another sense of that headword, or an entry may contain a form of a different word.

### Reporting (anyone)

1. Press “Report an error” under the entry. A GitHub Issue form opens with the entry id, headword, current translations and forms filled in (a GitHub account is needed).
2. Choose the kind of error and describe the fix. Evidence (references, dictionaries, citations) is welcome.

### Correcting (collaborators)

Add one line to [`corrections/translations.tsv`](corrections/translations.tsv). The pages apply this table every time they load, so the live site changes about a minute after the commit
(no re-export is needed).

1. Open the Issue and check the entry id.
2. Open `corrections/translations.tsv` on GitHub, press the pencil (Edit this file) and add a line. Separate the columns with **tabs**.
3. Write `Fixes #12` (the Issue number) in the commit message to close the Issue with the commit.
   - Collaborators with write access can commit to main directly.
   - Others get a Pull Request via “Propose changes”; the maintainer reviews and merges it.
4. GitHub Actions (Check corrections) validates the format. If it fails, the Actions log shows the line number and the reason.

| Column | Meaning |
| --- | --- |
| `id` | Entry id (the number after `#id=` in the URL; “Entry id” in the Issue) |
| `lang` | `ja` (Japanese) or `en` (English); `-` for `hide-form` |
| `op` | `set`: replace the translations with value / `add`: add / `remove`: remove / `hide-form`: remove a form from this entry |
| `value` | Translation(s) (separate several with `\|`), or the form to remove (as displayed; tone dots may be omitted) |
| `issue` | Issue number (optional) |
| `by` | Who made the correction (optional) |
| `note` | Note (optional) |

Lines for the same entry and language apply from top to bottom. Corrected entries show a “corrected” mark, links to the Issues and the original translation.
Removed forms stay visible with a strike-through and no longer match searches.

The maintainer invites collaborators under Settings → Collaborators (Write access).
