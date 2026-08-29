# Changelog

## 2026-08-29 — 成績が記録されない不具合

- **出題数の初期値を 全200 → 20 に変更**。4択は誤答再出題で1セッション200問超になり、最後まで終わらず `saveSession` に到達しないため履歴がずっと空だった
- 「中断してホームへ」でも、1語でも解いていれば途中結果を履歴に保存（`toPartialRecord`：total は実際に解いた語数）
- `npm test` 49 件緑・静的エクスポートビルド成功

## 2026-08-28 — 4択問題の自己点検・修正

- 全200問を見直し、誤答が正解と実質同義で語釈だけでは一意に定まらない **22問**の誤答を差し替え
  （忌憚・気丈・感服・暁通・漸次・甘受・斟酌・酌量・達観・鳥瞰・符合・銘記・首尾一貫・荒唐無稽・罷免・困憊・狼狽・憐憫・慟哭・背反・一挙両得・森羅万象）
- `達観` の語釈を補強（本質を見通す＋悟りの境地）
- **`符号` → `符合` に修正**：元一覧は「符号」だが語釈は「符合（ぴったり一致すること）」の意味。別語のため見出し語を訂正
- `npm test` 48 件緑・静的エクスポートビルド成功

## 2026-08-28 — 答え合わせ画面に全4語の語釈

- 4択で回答したあと、**4つの選択肢すべての意味**をボタン下に表示（誤答がなぜ違うか分かる）
- `distractors` を `string[]` → `{ word, gloss }[]` に変更。誤答3語ぶんの語釈 600 件を手作り
- `Idiom.Distractor` 型追加。`ChoiceOption` に `gloss`（正解は語釈=meaning、フォールバックはプールの意味）
- `npm test` 48 件緑・静的エクスポートビルド成功

## 2026-08-28 — 4択の誤答を手作りに

- 4択の誤答を、正解の語釈に意味が近い**別の語（一覧の外の語）を1語ずつ手作り**したものに変更（全200語 × 3 = 600語）
  - 例: 斡旋 → 仲介 / 周旋 / 口利き、断腸 → 痛恨 / 悲痛 / 慟哭、本末転倒 → 主客転倒 / 冠履転倒 / 尾大不掉
- `Idiom.distractors?: string[]`（`parseIdioms` で検証）。`buildChoices` は distractors があればそれを使い、無ければ従来のドメイン方式にフォールバック
- 4択ボタンは語のみ表示（読みは答え合わせ後に表示）。`ChoiceSet.choices` を `{ id, word }[]` に変更
- `npm test` 47 件緑・静的エクスポートビルド成功

## 2026-08-28 — 4択モード

- 「意味」を見て正しい語を4つから選ぶ出題形式を追加（ホームで「4択」/「思い出す(○×)」を切替、既定は4択）
- `lib/choices.ts`（`buildChoices`）: 誤答3語を「同じ意味グループ かつ 同字数」→「同字数」→「その他」の順で選定。各段では正解の語釈と漢字熟語キーワードが近い順に優先。RNG 注入可・非破壊
- `Idiom` に任意の `group` フィールド追加（`lib/types.ts` / `parseIdioms` 検証）
- `data/idioms.json` の **197/200 語**に広い意味ドメインを付与（emotion / speech / mind / character / power / conflict / change / quantity / skill / conduct / deceit）。字数（二字/四字）ごとに各ドメイン4語以上あり、明らかに無関係な誤答が出ないようにした（残り3語は現・押し並べて・揺蕩うの特殊字数）
- 誤答した語はこれまで通りセッション中に再出題。成績・履歴の仕様は不変
- `npm test` 45 件緑・静的エクスポートビルド成功

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
