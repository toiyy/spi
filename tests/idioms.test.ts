import { describe, it, expect } from "vitest";
import { parseIdioms, indexById } from "@/lib/idioms";
import idiomsJson from "@/data/idioms.json";

describe("parseIdioms", () => {
  const ok = { id: "a", word: "感心", reading: "かんしん", meaning: "深く心を動かされること", category: "meaning" };

  it("正しい配列をそのまま通す", () => {
    expect(parseIdioms([ok])).toHaveLength(1);
  });

  it("example は省略可", () => {
    expect(parseIdioms([ok])[0].example).toBeUndefined();
  });

  it("配列でなければ例外", () => {
    expect(() => parseIdioms({})).toThrow();
  });

  it("必須キー欠けで例外", () => {
    expect(() => parseIdioms([{ ...ok, meaning: "" }])).toThrow(/meaning/);
  });

  it("不正な category で例外", () => {
    expect(() => parseIdioms([{ ...ok, category: "kanji" }])).toThrow(/category/);
  });

  it("id 重複で例外", () => {
    expect(() => parseIdioms([ok, { ...ok, word: "別" }])).toThrow(/重複/);
  });
});

describe("data/idioms.json (種データ)", () => {
  it("スキーマ検証を通る", () => {
    expect(() => parseIdioms(idiomsJson)).not.toThrow();
  });

  it("50語以上ある", () => {
    expect(parseIdioms(idiomsJson).length).toBeGreaterThanOrEqual(50);
  });

  it("id はすべて一意", () => {
    const list = parseIdioms(idiomsJson);
    expect(indexById(list).size).toBe(list.length);
  });

  it("全語に例文がある", () => {
    const noExample = parseIdioms(idiomsJson)
      .filter((x) => !x.example)
      .map((x) => x.word);
    expect(noExample).toEqual([]);
  });

  it("読みはひらがな（と長音符）だけ", () => {
    const bad = parseIdioms(idiomsJson)
      .filter((x) => !/^[ぁ-んー]+$/.test(x.reading))
      .map((x) => `${x.word}(${x.reading})`);
    expect(bad).toEqual([]);
  });

  it("語が重複していない", () => {
    const words = parseIdioms(idiomsJson).map((x) => x.word);
    expect(new Set(words).size).toBe(words.length);
  });
});
