import { describe, it, expect, beforeEach } from "vitest";
import { loadHistory, saveSession, overallStats, weakIds, HISTORY_KEY } from "@/lib/stats";
import type { SessionRecord } from "@/lib/types";

function rec(over: Partial<SessionRecord> = {}): SessionRecord {
  return { date: "2026-08-27T00:00:00.000Z", total: 10, correct: 8, wrongIds: ["x", "y"], ...over };
}

describe("stats (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("履歴が無ければ空を返す", () => {
    expect(loadHistory(localStorage)).toEqual({ sessions: [] });
  });

  it("壊れた JSON でも空を返す", () => {
    localStorage.setItem(HISTORY_KEY, "{not json");
    expect(loadHistory(localStorage)).toEqual({ sessions: [] });
  });

  it("sessions が配列でなければ空を返す", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ sessions: "nope" }));
    expect(loadHistory(localStorage)).toEqual({ sessions: [] });
  });

  it("saveSession は追記して永続化する", () => {
    saveSession(rec({ correct: 5 }), localStorage);
    saveSession(rec({ correct: 7 }), localStorage);
    const h = loadHistory(localStorage);
    expect(h.sessions).toHaveLength(2);
    expect(h.sessions.map((s) => s.correct)).toEqual([5, 7]);
  });

  it("overallStats は累計と正答率を出す", () => {
    const h = {
      sessions: [
        rec({ total: 10, correct: 8, wrongIds: ["a", "b"] }),
        rec({ total: 5, correct: 5, wrongIds: [] }),
      ],
    };
    expect(overallStats(h)).toEqual({
      sessions: 2,
      totalAnswered: 15,
      totalCorrect: 13,
      accuracy: 13 / 15,
    });
  });

  it("overallStats: セッション0件なら accuracy 0", () => {
    expect(overallStats({ sessions: [] })).toEqual({
      sessions: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      accuracy: 0,
    });
  });

  it("weakIds は誤答回数の多い順", () => {
    const h = {
      sessions: [
        rec({ wrongIds: ["a", "b"] }),
        rec({ wrongIds: ["a", "c"] }),
        rec({ wrongIds: ["a"] }),
        rec({ wrongIds: ["b"] }),
      ],
    };
    expect(weakIds(h)).toEqual([
      { id: "a", misses: 3 },
      { id: "b", misses: 2 },
      { id: "c", misses: 1 },
    ]);
  });

  it("weakIds は topN で切る", () => {
    const h = { sessions: [rec({ wrongIds: ["a", "b", "c", "d"] })] };
    expect(weakIds(h, 2)).toHaveLength(2);
  });
});
