# Tasks

## Active

- [ ] **実機で触って確認** - `npm run dev` → 出題〜結果〜履歴の一連を確認
- [ ] **語の読み・意味を目視チェック** - 一覧由来の200語。四字熟語のニュアンス中心に
- [ ] **例文を追加** - 現状 example ありは24語のみ。残り176語は語のみ

## Waiting On

（なし）

## Someday

- [ ] **SRS(間隔反復)へ拡張** - Leitner 5箱、`lib/session.ts` を差し替え。[[spi-app]] 参照
- [ ] **二語の関係モード** - `category: "relation"` の出題形式を追加
- [ ] **postcss 脆弱性対応** - next@16 系へ上げると解消（現状は 15.5.24 で CVE-2025-66478 はパッチ済み）
- [ ] **Vercel デプロイ**

## Done

- [x] ~~Phase 0: productivity 初期化~~ (2026-08-27) - TASKS.md / dashboard.html / CLAUDE.md / memory/
- [x] ~~Phase 1: 足場~~ (2026-08-27) - Next.js 15.5 App Router + TS, Vitest, idioms.json スキーマ + 種50語
- [x] ~~Phase 2: コアロジック(TDD)~~ (2026-08-27) - lib/queue.ts, lib/session.ts, lib/stats.ts, lib/idioms.ts / テスト35件グリーン
- [x] ~~Phase 3: UI + 取り込み~~ (2026-08-27) - app/page.tsx（出題）, app/history/page.tsx, scripts/import.mjs
- [x] ~~Phase 4: 仕上げ~~ (2026-08-27) - README, CHANGELOG, build 成功確認
- [x] ~~SPI頻出語句を追加(1回目)~~ (2026-08-28) - theport.jp 261089 を参考に熟語45+四字熟語12を自作語釈で追加。計107語
- [x] ~~本番語彙リストを投入~~ (2026-08-28) - ユーザー作成の `tansaku/SPI言語頻出語句一覧.md`（頻出150+四字熟語50）を変換取り込み
- [x] ~~出題プールを一覧のみに限定~~ (2026-08-28) - 種51語+自作57語を外し、`idioms.json` を一覧の200語だけに再構築。example は既存24語ぶんを引き継ぎ。test/build 緑
