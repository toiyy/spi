import { describe, it, expect } from "vitest";
import { buildChoices } from "@/lib/choices";
import type { Idiom } from "@/lib/types";

/** 決定的な擬似乱数（mulberry32）。テストの再現性用 */
function seeded(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mk(id: string, group?: string, word = "○○"): Idiom {
  return { id, word, reading: "よみ", meaning: `${id}の意味`, category: "meaning", group };
}

// 二字(word長2)を基本に、グループ有無を散らしたプール
const POOL: Idiom[] = [
  mk("a", "worry", "憂慮"),
  mk("b", "worry", "懸念"),
  mk("c", "worry", "危惧"),
  mk("d", "worry", "心痛"),
  mk("e", "praise", "感服"),
  mk("f", "praise", "敬服"),
  mk("g", undefined, "沿革"),
  mk("h", undefined, "漸次"),
  mk("i", undefined, "折衷"),
  mk("j", "yojijukugo", "四字熟語"), // word長4
  mk("k", "yojijukugo", "本末転倒"),
  mk("l", "yojijukugo", "試行錯誤"),
  mk("m", "yojijukugo", "支離滅裂"),
];

describe("buildChoices", () => {
  it("正解を含む4択を返し、id はすべて一意", () => {
    const { choices, answerId } = buildChoices(POOL[0], POOL, { rng: seeded(1) });
    expect(choices).toHaveLength(4);
    expect(choices.map((c) => c.id)).toContain("a");
    expect(answerId).toBe("a");
    expect(new Set(choices.map((c) => c.id)).size).toBe(4);
  });

  it("同グループの語が十分あれば誤答は全て同グループ・同じ字数", () => {
    const { choices } = buildChoices(POOL[0], POOL, { rng: seeded(42) });
    const distractors = choices.filter((c) => c.id !== "a");
    expect(distractors).toHaveLength(3);
    for (const d of distractors) {
      expect(d.group).toBe("worry");
      expect([...d.word].length).toBe(2);
    }
  });

  it("同グループが足りなければ同じ字数の語で補う", () => {
    // "e"(praise) はグループ仲間が "f" の1つだけ → 残り2つは他の二字語から
    const { choices } = buildChoices(POOL[4], POOL, { rng: seeded(7) });
    expect(choices).toHaveLength(4);
    expect(choices.map((c) => c.id)).toContain("e");
    expect(choices.map((c) => c.id)).toContain("f"); // 唯一のグループ仲間は必ず入る
    for (const c of choices) expect([...c.word].length).toBe(2);
  });

  it("グループ無しの語でも同じ字数の語から4択を作る", () => {
    const { choices } = buildChoices(POOL[6], POOL, { rng: seeded(3) });
    expect(choices).toHaveLength(4);
    for (const c of choices) expect([...c.word].length).toBe(2);
  });

  it("四字熟語には四字熟語の誤答がつく", () => {
    const { choices } = buildChoices(POOL[9], POOL, { rng: seeded(9) });
    expect(choices).toHaveLength(4);
    for (const c of choices) expect([...c.word].length).toBe(4);
  });

  it("同じ乱数列なら結果は決定的", () => {
    const a = buildChoices(POOL[0], POOL, { rng: seeded(123) });
    const b = buildChoices(POOL[0], POOL, { rng: seeded(123) });
    expect(a).toEqual(b);
  });

  it("候補が4未満ならある分だけ返す", () => {
    const tiny = [mk("x"), mk("y")];
    const { choices, answerId } = buildChoices(tiny[0], tiny, { rng: seeded(1) });
    expect(choices).toHaveLength(2);
    expect(answerId).toBe("x");
  });

  it("正解しかなければ正解だけを返す", () => {
    const { choices } = buildChoices(POOL[0], [POOL[0]], { rng: seeded(1) });
    expect(choices).toEqual([POOL[0]]);
  });

  it("語釈のキーワードが近い候補を優先する", () => {
    const correct: Idiom = {
      id: "c", word: "憂慮", reading: "ゆうりょ",
      meaning: "強い不安を感じて心配すること", category: "meaning", group: "emo",
    };
    const near: Idiom = {
      id: "near", word: "懸念", reading: "けねん",
      meaning: "先行きに不安を覚えること", category: "meaning", group: "emo",
    };
    const far: Idiom = {
      id: "far", word: "落成", reading: "らくせい",
      meaning: "建物の工事が完了すること", category: "meaning", group: "emo",
    };
    const filler = Array.from({ length: 6 }, (_, i) => ({
      id: `f${i}`, word: `語${i}`, reading: "よみ",
      meaning: `無関係な事柄${i}`, category: "meaning" as const, group: "emo",
    }));
    // near は必ず選ばれ、far より前に来る（＝ far は押し出されて選外になりうる）
    let nearIn = 0;
    for (let s = 1; s <= 40; s++) {
      const { choices } = buildChoices(correct, [correct, near, far, ...filler], {
        rng: seeded(s),
      });
      const ids = choices.map((x) => x.id);
      expect(ids).toContain("near");
      if (!ids.includes("far")) nearIn++;
    }
    expect(nearIn).toBeGreaterThan(0); // far が選外になる回がある = 優先順が効いている
  });

  it("入力を破壊しない", () => {
    const snap = JSON.stringify(POOL);
    buildChoices(POOL[0], POOL, { rng: seeded(1) });
    expect(JSON.stringify(POOL)).toBe(snap);
  });
});
