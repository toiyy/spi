# CLAUDE.md — SPI熟語暗記アプリ

個人利用の SPI 語彙(語句の意味・二語の関係)暗記アプリ。作者が一人で開発・利用する。

## 技術スタック

- Next.js 15 App Router + TypeScript + React 19
- テスト: Vitest + @testing-library/react
- 永続化: ブラウザ `localStorage`（サーバDBなし）
- パッケージ管理: `npm`（pnpm/yarn は使わない）

## コマンド

- 開発サーバ: `npm run dev`
- テスト: `npm test`（= `vitest run`）
- ビルド: `npm run build`
- 語彙取り込み: `node scripts/import.mjs <file.csv>` → `data/idioms.json` を更新

## 完了条件（ループの終了条件）

作業を「完了」とするのは次の両方が満たされたときだけ:
1. `npm test` がノーエラーで通る
2. `npm run build` が成功する

テストが赤い状態で作業を止めない。エラーが出たらログを読んで自己修正を繰り返す。

## ワークフロー

- 複雑な実装の前に Plan を提示して承認を得る
- コアロジック(`lib/`)は必ずテストを先に書いてから実装する（TDD）
- 変更後は `npm test` を実行。壊れたら直してから次へ
- 区切りごとに `TASKS.md` のチェックを更新し、`CHANGELOG.md` に要点を追記
- Lint/型エラーはツールに任せる。ここには書かない

## データモデル

`data/idioms.json` は `Idiom[]`:

```json
{
  "id": "kanshin",
  "word": "感心",
  "reading": "かんしん",
  "meaning": "りっぱさに深く心を動かされること",
  "example": "彼の努力には感心する。",
  "category": "meaning"
}
```

- `category`: `"meaning"`（語句の意味）| `"relation"`（二語の関係）
- `id` は重複禁止。半角英小文字とハイフンのみ

## ディレクトリ

- `app/` … 画面（App Router）
- `lib/` … 純粋ロジック（`queue.ts` 出題キュー、`stats.ts` 成績・履歴）
- `data/idioms.json` … 語彙データ（唯一のソース）
- `scripts/import.mjs` … CSV → idioms.json 取り込み
- `tests/` … Vitest
- `memory/` … プロジェクトの仕様・用語（productivity プラグインの記憶。詳細はここ）

## プラグイン運用

- productivity: `TASKS.md` でタスク管理、`dashboard.html` は視覚ボード、`/productivity:update` で同期
- engineering: `/engineering:review`（コードレビュー）、`/engineering:debug`、`/engineering:deploy-checklist`
- 付属 MCP コネクタ（Slack/Jira/GitHub 等）は本プロジェクトでは未使用
