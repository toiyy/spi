# SPI熟語暗記アプリ

SPI（適性検査）の「語句の意味」を個人で暗記するための Web アプリ。

公開先: https://toiyy.github.io/spi/ （`main` に push すると GitHub Actions が自動デプロイ）

## セットアップ

```bash
npm install
npm run dev      # http://localhost:3000
```

## 使い方

- トップ（`/`）: 出題数とランダム有無を選んで「開始」
  - 語を見て意味を思い出す → 「意味を見る」で答え合わせ → ○ / ×
  - × の語はそのセッション中に再出題される（正解するまで残る）
  - 終了すると結果を localStorage に保存
- 履歴（`/history`）: 累計正答率・苦手な語（誤答が多い順）・最近のセッション

## 語彙データの追加

`data/idioms.json` が唯一のソース。CSV から取り込むには:

```bash
node scripts/import.mjs path/to/words.csv          # 既存にマージ
node scripts/import.mjs path/to/words.csv --replace # 全置き換え
```

CSV の列（ヘッダ行は任意）: `word,reading,meaning,example,category,id`
`example` は空可、`category` 省略時は `meaning`、`id` 省略時は読み仮名から自動生成。

## 開発

```bash
npm test          # Vitest（lib/ のロジック）
npm run build     # 本番ビルド
```

- コアロジックは `lib/`（`queue` 出題キュー / `session` 出題進行 / `stats` 成績 / `idioms` 検証）。テストを先に書く。
- 画面は `app/`（App Router）。
- 詳細な仕様・用語は `memory/` と `CLAUDE.md` を参照。
- タスク管理は `TASKS.md`（`dashboard.html` をブラウザで開くと視覚ボード）。

## 技術

Next.js 15 (App Router) / React 19 / TypeScript / Vitest。永続化は `localStorage` のみ（サーバなし）。
