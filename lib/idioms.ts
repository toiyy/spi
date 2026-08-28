import type { Category, Idiom } from "./types";

const CATEGORIES: readonly Category[] = ["meaning", "relation"];

function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}

/** 未知の入力を Idiom[] へ検証しつつ変換する。壊れた行があれば例外 */
export function parseIdioms(raw: unknown): Idiom[] {
  if (!Array.isArray(raw)) {
    throw new Error("idioms データは配列である必要があります");
  }
  const seen = new Set<string>();
  return raw.map((item, i) => {
    if (!item || typeof item !== "object") {
      throw new Error(`idioms[${i}]: オブジェクトではありません`);
    }
    const o = item as Record<string, unknown>;
    for (const key of ["id", "word", "reading", "meaning"] as const) {
      if (typeof o[key] !== "string" || (o[key] as string).length === 0) {
        throw new Error(`idioms[${i}]: "${key}" が不正です`);
      }
    }
    if (!isCategory(o.category)) {
      throw new Error(`idioms[${i}] (${String(o.id)}): "category" が不正です`);
    }
    if (o.example !== undefined && typeof o.example !== "string") {
      throw new Error(`idioms[${i}] (${String(o.id)}): "example" は文字列である必要があります`);
    }
    if (o.group !== undefined && (typeof o.group !== "string" || o.group.length === 0)) {
      throw new Error(`idioms[${i}] (${String(o.id)}): "group" は空でない文字列である必要があります`);
    }
    if (o.distractors !== undefined) {
      if (
        !Array.isArray(o.distractors) ||
        o.distractors.length < 3 ||
        o.distractors.some((d) => typeof d !== "string" || d.length === 0)
      ) {
        throw new Error(`idioms[${i}] (${String(o.id)}): "distractors" は3語以上の文字列配列である必要があります`);
      }
    }
    const id = o.id as string;
    if (seen.has(id)) {
      throw new Error(`idioms[${i}]: id "${id}" が重複しています`);
    }
    seen.add(id);
    return {
      id,
      word: o.word as string,
      reading: o.reading as string,
      meaning: o.meaning as string,
      example: o.example as string | undefined,
      category: o.category,
      group: o.group as string | undefined,
      distractors: o.distractors as string[] | undefined,
    };
  });
}

/** id → Idiom の索引 */
export function indexById(idioms: readonly Idiom[]): Map<string, Idiom> {
  return new Map(idioms.map((x) => [x.id, x]));
}
