# Tasks

## Active

- [ ] **実機で触って確認** - `npm run dev` → 出題〜結果〜履歴の一連を確認
- [ ] **語の読み・意味を目視チェック** - 一覧由来の200語。四字熟語のニュアンス中心に
- [ ] **例文を追加** - 現状 example ありは24語のみ。残り176語は語のみ
- [ ] **手作り誤答＋語釈の精度チェック(2巡目)** - 1巡目で22問修正済み。残りの near-synonym 系（会得/看破/席巻/出色 等）と語釈の細部を継続確認

## Waiting On

（なし）

## Someday

- [ ] **SRS(間隔反復)へ拡張** - Leitner 5箱、`lib/session.ts` を差し替え。[[spi-app]] 参照
- [ ] **二語の関係モード** - `category: "relation"` の出題形式を追加
- [ ] **postcss 脆弱性対応** - next@16 系へ上げると解消（現状は 15.5.24 で CVE-2025-66478 はパッチ済み）

## Done

- [x] ~~Phase 0: productivity 初期化~~ (2026-08-27) - TASKS.md / dashboard.html / CLAUDE.md / memory/
- [x] ~~Phase 1: 足場~~ (2026-08-27) - Next.js 15.5 App Router + TS, Vitest, idioms.json スキーマ + 種50語
- [x] ~~Phase 2: コアロジック(TDD)~~ (2026-08-27) - lib/queue.ts, lib/session.ts, lib/stats.ts, lib/idioms.ts / テスト35件グリーン
- [x] ~~Phase 3: UI + 取り込み~~ (2026-08-27) - app/page.tsx（出題）, app/history/page.tsx, scripts/import.mjs
- [x] ~~Phase 4: 仕上げ~~ (2026-08-27) - README, CHANGELOG, build 成功確認
- [x] ~~SPI頻出語句を追加(1回目)~~ (2026-08-28) - theport.jp 261089 を参考に熟語45+四字熟語12を自作語釈で追加。計107語
- [x] ~~本番語彙リストを投入~~ (2026-08-28) - ユーザー作成の `tansaku/SPI言語頻出語句一覧.md`（頻出150+四字熟語50）を変換取り込み
- [x] ~~出題プールを一覧のみに限定~~ (2026-08-28) - 種51語+自作57語を外し、`idioms.json` を一覧の200語だけに再構築。example は既存24語ぶんを引き継ぎ。test/build 緑
- [x] ~~GitHub Pages デプロイ~~ (2026-08-28) - `output:'export'` 静的化 + `.github/workflows/deploy.yml`。https://toiyy.github.io/spi/ で公開。push→自動デプロイ
- [x] ~~4択モードを追加~~ (2026-08-28) - 意味→語を4択で選ぶ。ホームでモード切替。`lib/choices.ts`(TDD)
- [x] ~~4択の誤答が簡単すぎる問題を修正~~ (2026-08-28) - 意味ドメインを197/200語に付与＋語釈キーワードで並べ替え
- [x] ~~4択の誤答を手作りに~~ (2026-08-28) - 正解に意味が近い一覧外の語を200語×3=600語 手作り(`idiom.distractors`)
- [x] ~~答え合わせ画面に全4語の語釈~~ (2026-08-28) - distractors を {word,gloss} に。誤答の語釈600件を手作り。回答後に4語すべての意味を表示
- [x] ~~4択問題の自己点検~~ (2026-08-28) - 全200問を見直し、誤答が正解と同義で不適切な22問を差し替え。符号→符合の見出し語誤りも訂正
- [x] ~~成績が記録されない不具合を修正~~ (2026-08-29) - 出題数の初期値を200→20に。長すぎて完了せず保存に到達しなかった。中断時も途中結果を保存
