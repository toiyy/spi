import { describe, it, expect } from "vitest";
import { startSession, currentId, grade, summary, toRecord } from "@/lib/session";

describe("session", () => {
  it("開始時は先頭が current、未完了", () => {
    const s = startSession(["a", "b", "c"]);
    expect(currentId(s)).toBe("a");
    expect(s.finished).toBe(false);
    expect(s.total).toBe(3);
  });

  it("空リストは即完了", () => {
    const s = startSession([]);
    expect(s.finished).toBe(true);
    expect(currentId(s)).toBeNull();
    expect(summary(s)).toEqual({ total: 0, correct: 0, wrongIds: [], accuracy: 0 });
  });

  it("全問正解でクリア、accuracy=1", () => {
    let s = startSession(["a", "b"]);
    s = grade(s, "correct");
    expect(currentId(s)).toBe("b");
    s = grade(s, "correct");
    expect(s.finished).toBe(true);
    expect(summary(s)).toEqual({ total: 2, correct: 2, wrongIds: [], accuracy: 1 });
  });

  it("誤答は末尾に回され、正解するまで残る", () => {
    let s = startSession(["a", "b"]);
    s = grade(s, "wrong"); // a を末尾へ
    expect(currentId(s)).toBe("b");
    s = grade(s, "correct"); // b クリア
    expect(currentId(s)).toBe("a");
    expect(s.finished).toBe(false);
    s = grade(s, "correct"); // a ようやくクリア
    expect(s.finished).toBe(true);
  });

  it("一度でも誤答した語は correct に数えず wrongIds に入る", () => {
    let s = startSession(["a", "b"]);
    s = grade(s, "wrong"); // a
    s = grade(s, "correct"); // b (first try)
    s = grade(s, "correct"); // a (was wrong)
    const sum = summary(s);
    expect(sum.total).toBe(2);
    expect(sum.correct).toBe(1);
    expect(sum.wrongIds).toEqual(["a"]);
    expect(sum.accuracy).toBe(0.5);
  });

  it("同じ語を複数回間違えても wrongIds は重複しない", () => {
    let s = startSession(["a", "b"]);
    s = grade(s, "wrong"); // a
    s = grade(s, "wrong"); // b
    s = grade(s, "wrong"); // a again
    s = grade(s, "correct"); // b
    s = grade(s, "correct"); // a
    expect(summary(s).wrongIds.sort()).toEqual(["a", "b"]);
    expect(summary(s).correct).toBe(0);
  });

  it("完了後の grade は状態を変えない", () => {
    let s = startSession(["a"]);
    s = grade(s, "correct");
    const after = grade(s, "wrong");
    expect(after).toEqual(s);
  });

  it("grade は元の state を破壊しない（イミュータブル）", () => {
    const s = startSession(["a", "b"]);
    const snapshot = JSON.stringify(s);
    grade(s, "wrong");
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it("toRecord は SessionRecord 形へ変換する", () => {
    let s = startSession(["a", "b"]);
    s = grade(s, "wrong");
    s = grade(s, "correct");
    s = grade(s, "correct");
    const rec = toRecord(s, new Date("2026-08-27T10:00:00Z"));
    expect(rec).toEqual({
      date: "2026-08-27T10:00:00.000Z",
      total: 2,
      correct: 1,
      wrongIds: ["a"],
    });
  });

  it("完了前でも summary は現時点の数字を返す", () => {
    let s = startSession(["a", "b", "c"]);
    s = grade(s, "correct");
    const sum = summary(s);
    expect(sum.total).toBe(3);
    expect(sum.correct).toBe(1);
  });
});
