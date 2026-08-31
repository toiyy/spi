import { describe, it, expect } from "vitest";
import { buildChoices, ANSWER_ID } from "@/lib/choices";
import { parseIdioms } from "@/lib/idioms";
import idiomsJson from "@/data/idioms.json";
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
  mk("a", "worry", "憂慮", { cluster: "anxious" }),
  mk("b", "worry", "懸念", { cluster: "anxious" }), // a と同義 → 誤答にしてはいけない
  mk("c", "worry", "激怒"),
  mk("d", "worry", "落胆"),
  mk("e", "worry", "動転"),
  mk("f", "worry", "困憊"),
  mk("g", "other", "沿革"),
  mk("h", "other", "漸次"),
  mk("i", "other", "折衷"),
  mk("j", "yoji", "四字熟語"),
  mk("k", "yoji", "本末転倒"),
  mk("l", "yoji", "試行錯誤"),
  mk("m", "yoji", "支離滅裂"),
];
const byWord = new Map(POOL.map((p) => [p.word, p]));

describe("buildChoices", () => {
  it("正解を含む4択を返し、選択肢 id は一意", () => {
    const { choices, answerId } = buildChoices(POOL[0], POOL, { rng: seeded(1) });
    expect(choices).toHaveLength(4);
    expect(answerId).toBe(ANSWER_ID);
    expect(choices.find((c) => c.id === ANSWER_ID)?.word).toBe("憂慮");
    expect(new Set(choices.map((c) => c.id)).size).toBe(4);
  });

  it("同じ意味クラスタの語は誤答にしない（正解が2つある問題を作らない）", () => {
    for (let s = 1; s <= 50; s++) {
      const { choices } = buildChoices(POOL[0], POOL, { rng: seeded(s) });
      expect(choices.map((c) => c.word)).not.toContain("懸念");
    }
  });

  it("誤答は同じ意味ドメイン・同じ字数から選ぶ", () => {
    const { choices } = buildChoices(POOL[0], POOL, { rng: seeded(42) });
    for (const c of choices.filter((c) => c.id !== ANSWER_ID)) {
      expect(byWord.get(c.word)?.group).toBe("worry");
      expect([...c.word].length).toBe(2);
    }
  });

  it("四字熟語には四字熟語の誤答がつく", () => {
    const { choices } = buildChoices(POOL[9], POOL, { rng: seeded(9) });
    for (const c of choices) expect([...c.word].length).toBe(4);
  });

  it("各選択肢に語釈(gloss)が付く", () => {
    const { choices } = buildChoices(POOL[0], POOL, { rng: seeded(4) });
    expect(choices.find((c) => c.id === ANSWER_ID)?.gloss).toBe("aの意味");
    for (const c of choices) expect(c.gloss.length).toBeGreaterThan(0);
  });

  it("distractors 指定があればそれを使う", () => {
    const special = mk("x", undefined, "現", {
      distractors: [
        { word: "夢", gloss: "眠って見るもの" },
        { word: "幻", gloss: "実際にはないもの" },
        { word: "虚", gloss: "中身がないこと" },
      ],
    });
    const { choices } = buildChoices(special, POOL, { rng: seeded(3) });
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((c) => c.word))).toEqual(
      new Set(["現", "夢", "幻", "虚"]),
    );
  });

  it("同じ乱数列なら決定的", () => {
    expect(buildChoices(POOL[0], POOL, { rng: seeded(9) })).toEqual(
      buildChoices(POOL[0], POOL, { rng: seeded(9) }),
    );
  });

  it("候補が足りなければある分だけ返す", () => {
    const tiny = [mk("p", "z", "亜"), mk("q", "z", "唖")];
    const { choices } = buildChoices(tiny[0], tiny, { rng: seeded(1) });
    expect(choices).toHaveLength(2);
  });

  it("入力を破壊しない", () => {
    const snap = JSON.stringify(POOL);
    buildChoices(POOL[0], POOL, { rng: seeded(1) });
    expect(JSON.stringify(POOL)).toBe(snap);
  });
});

describe("data/idioms.json — 全問が4択として成立する", () => {
  const ALL = parseIdioms(idiomsJson);
  const cl = (x: Idiom) => x.cluster ?? x.id;
  const byWord2 = new Map(ALL.map((x) => [x.word, x]));

  it("全語で4つの選択肢が作れる", () => {
    for (const idiom of ALL) {
      const { choices } = buildChoices(idiom, ALL, { rng: seeded(idiom.id.length + 1) });
      expect(choices, idiom.word).toHaveLength(4);
    }
  });

  it("誤答に正解と同じ意味クラスタの語が混ざらない", () => {
    for (const idiom of ALL) {
      for (let s = 1; s <= 8; s++) {
        const { choices } = buildChoices(idiom, ALL, { rng: seeded(s) });
        for (const c of choices) {
          if (c.id === ANSWER_ID) continue;
          const d = byWord2.get(c.word);
          if (!d) continue; // distractors 由来（語彙外）
          expect(cl(d), `${idiom.word} の誤答 ${c.word}`).not.toBe(cl(idiom));
        }
      }
    }
  });

  it("誤答に正解と同じ語が混ざらない", () => {
    for (const idiom of ALL) {
      for (let s = 1; s <= 5; s++) {
        const { choices } = buildChoices(idiom, ALL, { rng: seeded(s) });
        const words = choices.map((c) => c.word);
        expect(new Set(words).size, idiom.word).toBe(words.length);
      }
    }
  });

  it("誤答は正解と同じ字数（特殊語を除く）", () => {
    for (const idiom of ALL) {
      if (idiom.distractors) continue;
      const n = [...idiom.word].length;
      const { choices } = buildChoices(idiom, ALL, { rng: seeded(7) });
      for (const c of choices) {
        expect([...c.word].length, `${idiom.word} / ${c.word}`).toBe(n);
      }
    }
  });
});
