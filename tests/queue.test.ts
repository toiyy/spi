import { describe, it, expect } from "vitest";
import { buildQueue, shuffleArray } from "@/lib/queue";
import type { Idiom } from "@/lib/types";

function makeIdioms(n: number): Idiom[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `w${i}`,
    word: `語${i}`,
    reading: `ご${i}`,
    meaning: `意味${i}`,
    category: "meaning" as const,
  }));
}

describe("buildQueue", () => {
  it("デフォルトは全件を元の順で返す", () => {
    const idioms = makeIdioms(5);
    expect(buildQueue(idioms).map((x) => x.id)).toEqual(["w0", "w1", "w2", "w3", "w4"]);
  });

  it("count で先頭から件数を絞る", () => {
    const idioms = makeIdioms(5);
    expect(buildQueue(idioms, { count: 3 }).map((x) => x.id)).toEqual(["w0", "w1", "w2"]);
  });

  it("count が件数を超えても全件返す", () => {
    const idioms = makeIdioms(3);
    expect(buildQueue(idioms, { count: 10 })).toHaveLength(3);
  });

  it("count = 0 は空配列", () => {
    expect(buildQueue(makeIdioms(3), { count: 0 })).toEqual([]);
  });

  it("shuffle:true + 固定 rng で決定的に並び替える", () => {
    const idioms = makeIdioms(4);
    const seq = [0.99, 0.0, 0.5, 0.0];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const a = buildQueue(idioms, { shuffle: true, rng });
    const b = buildQueue(idioms, { shuffle: true, rng: (() => { let j = 0; return () => seq[j++ % seq.length]; })() });
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    // 中身は保存される（要素の欠落・重複なし）
    expect([...a].map((x) => x.id).sort()).toEqual(["w0", "w1", "w2", "w3"]);
  });

  it("元の配列を破壊しない", () => {
    const idioms = makeIdioms(3);
    const snapshot = idioms.map((x) => x.id);
    buildQueue(idioms, { shuffle: true, rng: () => 0.42, count: 2 });
    expect(idioms.map((x) => x.id)).toEqual(snapshot);
  });
});

describe("shuffleArray", () => {
  it("すべての要素を保持する", () => {
    const src = [1, 2, 3, 4, 5, 6];
    const out = shuffleArray(src, () => 0.3);
    expect([...out].sort((a, b) => a - b)).toEqual(src);
  });

  it("入力を破壊しない", () => {
    const src = [1, 2, 3];
    shuffleArray(src, () => 0.7);
    expect(src).toEqual([1, 2, 3]);
  });
});
