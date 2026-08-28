import type { Idiom } from "./types";

export interface BuildQueueOptions {
  /** 出題する語数（省略時は全件、負数は 0 扱い） */
  count?: number;
  /** ランダム出題にするか */
  shuffle?: boolean;
  /** テスト用に差し替え可能な乱数源。[0,1) を返す */
  rng?: () => number;
}

/** Fisher–Yates。入力は破壊しない */
export function shuffleArray<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 1セッション分の出題キューを作る。入力配列は破壊しない */
export function buildQueue(idioms: readonly Idiom[], opts: BuildQueueOptions = {}): Idiom[] {
  const { count, shuffle = false, rng = Math.random } = opts;
  let list: Idiom[] = shuffle ? shuffleArray(idioms, rng) : [...idioms];
  if (count !== undefined) {
    list = list.slice(0, Math.max(0, count));
  }
  return list;
}
