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

/**
 * 4択問題の選択肢を作る。
 * 誤答は「同じ意味グループ かつ 同じ字数」→「同じ字数」→「その他」の順で選ぶ。
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
  const tierRest = others.filter((x) => wordLen(x.word) !== cLen && !tierGroup.includes(x));

  const distractors: Idiom[] = [];
  for (const tier of [tierGroup, tierLen, tierRest]) {
    for (const cand of shuffleArray(tier, rng)) {
      if (distractors.length >= need) break;
      distractors.push(cand);
    }
    if (distractors.length >= need) break;
  }

  return {
    choices: shuffleArray([correct, ...distractors], rng),
    answerId: correct.id,
  };
}
