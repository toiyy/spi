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

/** 同義・類義でまとめたクラスタ。未指定なら自分だけ */
function clusterOf(x: Idiom): string {
  return x.cluster ?? x.id;
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

/** 正解の語釈と話題が近い順に並べ替える（同義語はクラスタで既に除いてある） */
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
 *
 * 誤答は「同じ意味ドメイン(group) かつ 同じ字数 かつ 別の意味クラスタ(cluster)」の語から選ぶ。
 * ドメインが同じなので紛らわしく、クラスタが違うので正解は一つに定まる。
 * 同字数の候補が語彙内にない語だけ `distractors` で明示する。
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
    // 同義クラスタの語は「正解が2つある問題」になるので必ず除く
    const cCluster = clusterOf(correct);
    const others = [...byId.values()].filter((x) => clusterOf(x) !== cCluster);

    const cLen = wordLen(correct.word);
    const sameLen = others.filter((x) => wordLen(x.word) === cLen);
    const sameGroup = sameLen.filter(
      (x) => correct.group !== undefined && x.group === correct.group,
    );
    const otherGroup = sameLen.filter((x) => !sameGroup.includes(x));
    const otherLen = others.filter((x) => wordLen(x.word) !== cLen);

    const ordered: { word: string; gloss: string }[] = [
      ...(correct.distractors ?? []),
      ...rankByMeaning(sameGroup, correct, rng).map((x) => ({
        word: x.word,
        gloss: x.meaning,
      })),
      ...rankByMeaning(otherGroup, correct, rng).map((x) => ({
        word: x.word,
        gloss: x.meaning,
      })),
      ...shuffleArray(otherLen, rng).map((x) => ({
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
