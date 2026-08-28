# Changelog

## 2026-08-28 — GitHub Pages 公開

- **https://toiyy.github.io/spi/** で公開（`main` への push で自動デプロイ）
- `next.config.mjs`: `output: 'export'` + `trailingSlash` + CI 時のみ `basePath: '/spi'`（`DEPLOY_TARGET=gh-pages`）
- `.github/workflows/deploy.yml`: npm ci → test → build → `upload-pages-artifact` → `deploy-pages`
- git リポジトリ初期化・初コミット、`gh repo create toiyy/spi --public`

## 2026-08-28 — 語彙追加

- `data/idioms.json` を **ユーザー作成の一覧 `tansaku/SPI言語頻出語句一覧.md` の 200 語だけ**に再構築
  - 頻出語句150選 + 四字熟語50選（出典 theport.jp 261089、抽出はユーザー）
  - 種データ51語・自作57語は出題プールから除外（`scratchpad/idioms.283.json` にバックアップ）
  - 既存にあった語の `example` は引き継ぎ（24語）。残り176語は読み・意味のみ
- `data/idioms.json` は 1 行 1 語のコンパクト形式
- `npm test` 35 件緑・`npm run build` 成功を確認

## 2026-08-27 — 初期構築

- productivity / engineering プラグイン導入（`knowledge-work-plugins` マーケットプレイス）
- productivity 運用ファイル: `TASKS.md`, `dashboard.html`, `CLAUDE.md`, `memory/`
- Next.js 15.5.24 (App Router) + TypeScript + React 19 の最小構成を手動セットアップ
- テスト基盤: Vitest + Testing Library（jsdom）
- コアロジック（TDD、35 テスト）
  - `lib/queue.ts` — 出題キュー生成（順番／シャッフル、rng 差し替え可）
  - `lib/session.ts` — シンプル出題セッション（誤答は当日末尾へ再投入、一発正解のみカウント）
  - `lib/stats.ts` — localStorage 永続化、累計正答率、苦手語ランキング
  - `lib/idioms.ts` — idioms.json のスキーマ検証
- データ: `data/idioms.json` に SPI「語句の意味」種データ 50 語
- 画面: `/`（出題→自己採点○×→結果）、`/history`（累計・苦手語・履歴）
- `scripts/import.mjs` — CSV → idioms.json 取り込み（かな→ローマ字で id 自動生成、マージ／--replace）
- `npm test` 全緑・`npm run build` 成功を確認

### 既知の課題

- transitive `postcss` の脆弱性（source map 経由）。next@16 で解消。CVE-2025-66478 は 15.5.24 でパッチ済み
- 語彙は種データ 50 語のみ。本番リストは未投入
