#!/usr/bin/env node
/**
 * CSV -> data/idioms.json 取り込みスクリプト。
 *
 *   node scripts/import.mjs <file.csv> [--replace]
 *
 * CSV 列（ヘッダ行は任意。無い場合はこの順とみなす）:
 *   word,reading,meaning,example,category,id
 *   - example: 省略可（空セル可）
 *   - category: 省略時は "meaning"
 *   - id: 省略時は reading(ひらがな) をローマ字化して自動生成。重複は -2, -3 ...
 *
 * デフォルトは既存 idioms.json へマージ（既存 id はスキップ）。
 * --replace で全置き換え。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(HERE, "..", "data", "idioms.json");
const CATEGORIES = new Set(["meaning", "relation"]);
const HEADER = ["word", "reading", "meaning", "example", "category", "id"];

const KANA = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
};

function romanize(reading) {
  let out = "";
  const chars = [...reading];
  for (let i = 0; i < chars.length; i++) {
    const two = chars[i] + (chars[i + 1] ?? "");
    if (KANA[two]) {
      out += KANA[two];
      i++;
    } else if (KANA[chars[i]]) {
      out += KANA[chars[i]];
    } else if (chars[i] === "っ") {
      const nxt = chars[i + 1] + (chars[i + 2] ?? "");
      const r = KANA[nxt] || KANA[chars[i + 1]] || "";
      if (r) out += r[0];
    } else if (chars[i] === "ー") {
      // 長音は無視
    }
  }
  return out.replace(/[^a-z0-9]/g, "") || "item";
}

/** RFC4180 ざっくり対応の CSV パーサ */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function main() {
  const args = process.argv.slice(2);
  const replace = args.includes("--replace");
  const csvPath = args.find((a) => !a.startsWith("--"));
  if (!csvPath) {
    console.error("使い方: node scripts/import.mjs <file.csv> [--replace]");
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  if (rows.length === 0) {
    console.error("CSV に行がありません");
    process.exit(1);
  }

  const first = rows[0].map((s) => s.trim().toLowerCase());
  const hasHeader = first.includes("word") && first.includes("meaning");
  const cols = hasHeader ? first : HEADER;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const existing = replace ? [] : JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const ids = new Set(existing.map((x) => x.id));
  const added = [];

  for (const [n, raw] of dataRows.entries()) {
    const get = (key) => {
      const idx = cols.indexOf(key);
      return idx >= 0 ? (raw[idx] ?? "").trim() : "";
    };
    const word = get("word");
    const reading = get("reading");
    const meaning = get("meaning");
    if (!word || !reading || !meaning) {
      console.warn(`行 ${n + 1}: word/reading/meaning が空。スキップ`);
      continue;
    }
    const category = get("category") || "meaning";
    if (!CATEGORIES.has(category)) {
      console.warn(`行 ${n + 1} (${word}): category "${category}" が不正。スキップ`);
      continue;
    }
    let id = get("id") || romanize(reading);
    if (ids.has(id)) {
      let k = 2;
      while (ids.has(`${id}-${k}`)) k++;
      id = `${id}-${k}`;
    }
    ids.add(id);
    const entry = { id, word, reading, meaning, category };
    const example = get("example");
    if (example) entry.example = example;
    added.push(entry);
  }

  const out = [...existing, ...added];
  writeFileSync(DATA_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(
    `${replace ? "置き換え" : "マージ"}: +${added.length} 語 → 合計 ${out.length} 語 (${DATA_PATH})`,
  );
}

main();
