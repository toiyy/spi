# SPI熟語暗記アプリ

**状態:** 開発中（2026-08-27 開始）
**目的:** SPI(適性検査)の言語分野「語句の意味」「二語の関係」で問われる必須語彙を、個人で暗記するためのアプリ。

## 決定事項

| 項目 | 決定 | 備考 |
|------|------|------|
| 形態 | Next.js App Router + TS のWebアプリ | ローカルで `npm run dev` |
| 学習方式 | シンプル出題（順番/ランダム）+ 正誤記録 | 誤答は当日中に再出題。SRSは Someday |
| データ | まず種データ50語を生成、後で本番データ追加 | `data/idioms.json` が唯一のソース |
| 永続化 | localStorage | サーバDBなし。個人利用のため |

## 出題ロジック（シンプル方式）

1. `idioms.json` からセッション用キューを作る（全件 or 出題数指定、順番 or シャッフル）
2. 1問ずつ「語」を見せ、意味を思い出す → 自己採点 ○/×
3. × の語はキュー末尾に再投入（当日中にもう一度）
4. セッション終了時、正答率と履歴を localStorage に保存
5. 保存するのは「成績・履歴」のみ（箱番号や次回日付は持たない = SRSではない）

## 履歴データ（localStorage）

- キー: `spi-history`
- 値: `{ sessions: SessionRecord[] }`
- `SessionRecord`: `{ date, total, correct, wrongIds: string[] }`

## 実装状況（2026-08-27）

- 骨組み〜UI〜取り込みスクリプトまで完成。`npm test` 35件緑 / `npm run build` 成功
- コアロジック: `lib/queue.ts` `lib/session.ts` `lib/stats.ts` `lib/idioms.ts`
- 画面: `app/page.tsx`（出題）, `app/history/page.tsx`
- 語彙 `data/idioms.json` は 200 語（すべて `category: "meaning"`）。中身はユーザー作成一覧 `tansaku/SPI言語頻出語句一覧.md`（頻出150+四字熟語50、出典 theport.jp 261089）**のみ**。種51語・自作57語は 2026-08-28 に出題プールから除外（`scratchpad/idioms.283.json` にバックアップ）。example ありは24語だけ

## 次にやること

TASKS.md の Active を参照。本番語彙の投入と実機確認。

## 関連

- 用語は [[glossary]] を参照
