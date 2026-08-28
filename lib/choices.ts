import type { Idiom } from "./types";
import { shuffleArray } from "./queue";

export interface ChoiceOption {
  /** 正解は "answer"、誤答は "d0" "d1" … */
  id: string;
  word: string;
  /** その語の意味（答え合わせ画面で表示） */
  gloss: string;
}

export interface ChoiceSet {
  /** シャッフル済みの選択肢（通常4つ） */
  choices: ChoiceOption[];
  /** 正解の選択肢 id（= "answer"） */
  answerId: string;
}

export const ANSWER_ID = "answer";

export interface BuildChoicesOptions {
  /** 選択肢の総数（正解含む）。既定 4 */
  count?: number;
  /** テスト用の乱数源。[0,1) を返す */
  rng?: () => number;
}

function wordLen(w: string): number {
  return [...w].length;
}

// 語釈の中身は主に漢字熟語が担うので、2 文字以上の漢字連なりをキーワードとして取り出す。
const STOP = new Set(["物事", "相手", "自分", "非常", "場合", "様子", "程度", "全体"]);

function keywords(meaning: string): Set<string> {
  const m = meaning.match(/[一-龥々]{2,}/g) ?? [];
  return new Set(m.filter((t) => !STOP.has(t)));
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

function rankByMeaning(
  cands: readonly Idiom[],
  correct: Idiom,
  rng: () => number,
): Idiom[] {
  const target = keywords(correct.meaning);
  return shuffleArray(cands, rng)
    .map((x) => ({ x, score: overlap(keywords(x.meaning), target) }))
    .sort((a, b) => b.score - a.score)
    .map((o) => o.x);
}

/**
 * 4択問題の選択肢を作る。
 * `correct.distractors`（手作りの近い語＋語釈）があればそれを誤答に使う。
 * 無ければ語彙プールから「同じ意味グループ かつ 同字数」→「同字数」→「その他」で補う。
 * 入力配列は破壊しない。
 */
export function buildChoices(
  correct: Idiom,
  pool: readonly Idiom[],
  opts: BuildChoicesOptions = {},
): ChoiceSet {
  const rng = opts.rng ?? Math.random;
  const count = opts.count ?? 4;
  const need = Math.max(0, count - 1);

  const answer: ChoiceOption = {
    id: ANSWER_ID,
    word: correct.word,
    gloss: correct.meaning,
  };

  let distractors: ChoiceOption[];

  if (correct.distractors && correct.distractors.length >= need) {
    distractors = shuffleArray(correct.distractors, rng)
      .slice(0, need)
      .map((d, i) => ({ id: `d${i}`, word: d.word, gloss: d.gloss }));
  } else {
    const byId = new Map<string, Idiom>();
    for (const x of pool) {
      if (x.id !== correct.id && !byId.has(x.id)) byId.set(x.id, x);
    }
    const others = [...byId.values()];
    const cLen = wordLen(correct.word);
    const inGroup = (x: Idiom) =>
      correct.group !== undefined && x.group === correct.group;

    const tierGroup = others.filter((x) => inGroup(x) && wordLen(x.word) === cLen);
    const tierLen = others.filter((x) => !inGroup(x) && wordLen(x.word) === cLen);
    const tierRest = others.filter(
      (x) => wordLen(x.word) !== cLen && !tierGroup.includes(x),
    );

    const ordered: { word: string; gloss: string }[] = [
      ...(correct.distractors ?? []),
      ...rankByMeaning(tierGroup, correct, rng).map((x) => ({
        word: x.word,
        gloss: x.meaning,
      })),
      ...rankByMeaning(tierLen, correct, rng).map((x) => ({
        word: x.word,
        gloss: x.meaning,
      })),
      ...shuffleArray(tierRest, rng).map((x) => ({
        word: x.word,
        gloss: x.meaning,
      })),
    ];

    const seen = new Set<string>([correct.word]);
    distractors = [];
    for (const d of ordered) {
      if (seen.has(d.word)) continue;
      seen.add(d.word);
      distractors.push({ id: `d${distractors.length}`, word: d.word, gloss: d.gloss });
      if (distractors.length >= need) break;
    }
  }

  return {
    choices: shuffleArray([answer, ...distractors], rng),
    answerId: ANSWER_ID,
  };
}
