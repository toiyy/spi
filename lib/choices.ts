import type { Idiom } from "./types";
import { shuffleArray } from "./queue";

export interface ChoiceSet {
  /** シャッフル済みの選択肢（通常4つ、プールが小さければそれ未満） */
  choices: Idiom[];
  /** 正解の id */
  answerId: string;
}

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
// 頻出で情報量の乏しい語は除外。
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

/** 候補を「正解の語釈とキーワードが多く重なる順」に並べ替える。同点は乱数で散らす */
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
 * 誤答は「同じ意味グループ かつ 同じ字数」→「同じ字数」→「その他」の順で候補を作り、
 * 各段では正解の語釈とキーワードが近いものを優先する。
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

  const ordered = [
    ...rankByMeaning(tierGroup, correct, rng),
    ...rankByMeaning(tierLen, correct, rng),
    ...shuffleArray(tierRest, rng),
  ];

  const distractors = ordered.slice(0, need);
  return {
    choices: shuffleArray([correct, ...distractors], rng),
    answerId: correct.id,
  };
}
