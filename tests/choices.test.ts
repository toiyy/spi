import { describe, it, expect } from "vitest";
import { buildChoices, ANSWER_ID } from "@/lib/choices";
import type { Idiom } from "@/lib/types";

/** 決定的な擬似乱数（mulberry32） */
function seeded(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mk(
  id: string,
  group?: string,
  word = "○○",
  extra: Partial<Idiom> = {},
): Idiom {
  return {
    id,
    word,
    reading: "よみ",
    meaning: `${id}の意味`,
    category: "meaning",
    group,
    ...extra,
  };
}

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
  mk("j", "yoji", "四字熟語"),
  mk("k", "yoji", "本末転倒"),
  mk("l", "yoji", "試行錯誤"),
  mk("m", "yoji", "支離滅裂"),
];
const byWord = new Map(POOL.map((p) => [p.word, p]));

describe("buildChoices — 手作り誤答(distractors)", () => {
  const correct = mk("x", "worry", "憂慮", {
    distractors: ["懸念", "危惧", "杞憂", "気掛かり"],
  });

  it("誤答は distractors から取り、正解を含む4択になる", () => {
    const { choices, answerId } = buildChoices(correct, POOL, { rng: seeded(1) });
    expect(choices).toHaveLength(4);
    expect(answerId).toBe(ANSWER_ID);
    const ans = choices.find((c) => c.id === ANSWER_ID);
    expect(ans?.word).toBe("憂慮");
    const others = choices.filter((c) => c.id !== ANSWER_ID).map((c) => c.word);
    for (const w of others) expect(correct.distractors).toContain(w);
  });

  it("distractors が4語以上でも3語だけ選ぶ", () => {
    const { choices } = buildChoices(correct, POOL, { rng: seeded(2) });
    expect(choices.filter((c) => c.id !== ANSWER_ID)).toHaveLength(3);
  });

  it("同じ乱数列なら決定的", () => {
    expect(buildChoices(correct, POOL, { rng: seeded(9) })).toEqual(
      buildChoices(correct, POOL, { rng: seeded(9) }),
    );
  });

  it("選択肢の id はすべて一意", () => {
    const { choices } = buildChoices(correct, POOL, { rng: seeded(3) });
    expect(new Set(choices.map((c) => c.id)).size).toBe(choices.length);
  });
});

describe("buildChoices — フォールバック(distractors なし)", () => {
  it("正解を含む4択・id 一意", () => {
    const { choices, answerId } = buildChoices(POOL[0], POOL, { rng: seeded(1) });
    expect(choices).toHaveLength(4);
    expect(answerId).toBe(ANSWER_ID);
    expect(choices.find((c) => c.id === ANSWER_ID)?.word).toBe("憂慮");
    expect(new Set(choices.map((c) => c.id)).size).toBe(4);
  });

  it("同グループが十分あれば誤答は同グループ・同字数", () => {
    const { choices } = buildChoices(POOL[0], POOL, { rng: seeded(42) });
    const others = choices.filter((c) => c.id !== ANSWER_ID);
    expect(others).toHaveLength(3);
    for (const c of others) {
      expect(byWord.get(c.word)?.group).toBe("worry");
      expect([...c.word].length).toBe(2);
    }
  });

  it("同グループが足りなければ同字数で補う", () => {
    const { choices } = buildChoices(POOL[4], POOL, { rng: seeded(7) });
    expect(choices.map((c) => c.word)).toContain("敬服"); // 唯一のグループ仲間
    for (const c of choices) expect([...c.word].length).toBe(2);
  });

  it("四字熟語には四字熟語の誤答がつく", () => {
    const { choices } = buildChoices(POOL[9], POOL, { rng: seeded(9) });
    for (const c of choices) expect([...c.word].length).toBe(4);
  });

  it("語釈のキーワードが近い候補を優先する", () => {
    const correct: Idiom = mk("cc", "emo", "憂慮", {
      meaning: "強い不安を感じて心配すること",
    });
    const near = mk("near", "emo", "懸念", {
      meaning: "先行きに不安を覚えること",
    });
    const far = mk("far", "emo", "落成", {
      meaning: "建物の工事が完了すること",
    });
    const filler = Array.from({ length: 6 }, (_, i) =>
      mk(`f${i}`, "emo", `語${i}`, { meaning: `無関係な事柄${i}` }),
    );
    let farOut = 0;
    for (let s = 1; s <= 40; s++) {
      const { choices } = buildChoices(correct, [correct, near, far, ...filler], {
        rng: seeded(s),
      });
      const words = choices.map((c) => c.word);
      expect(words).toContain("懸念");
      if (!words.includes("落成")) farOut++;
    }
    expect(farOut).toBeGreaterThan(0);
  });

  it("候補が4未満ならある分だけ返す", () => {
    const tiny = [mk("p", undefined, "亜"), mk("q", undefined, "唖")];
    const { choices } = buildChoices(tiny[0], tiny, { rng: seeded(1) });
    expect(choices).toHaveLength(2);
  });

  it("正解しかなければ正解だけを返す", () => {
    const { choices } = buildChoices(POOL[0], [POOL[0]], { rng: seeded(1) });
    expect(choices).toEqual([{ id: ANSWER_ID, word: "憂慮" }]);
  });
});

it("入力を破壊しない", () => {
  const snap = JSON.stringify(POOL);
  buildChoices(POOL[0], POOL, { rng: seeded(1) });
  buildChoices(
    mk("z", "worry", "憂慮", { distractors: ["懸念", "危惧", "杞憂"] }),
    POOL,
    { rng: seeded(1) },
  );
  expect(JSON.stringify(POOL)).toBe(snap);
});
