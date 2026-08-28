import type { History, SessionRecord } from "./types";

export const HISTORY_KEY = "spi-history";

type MaybeStorage = Pick<Storage, "getItem" | "setItem"> | undefined;

function resolveStorage(storage?: MaybeStorage): Pick<Storage, "getItem" | "setItem"> | null {
  if (storage) return storage;
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    try {
      return (globalThis as { localStorage: Storage }).localStorage;
    } catch {
      return null;
    }
  }
  return null;
}

export function loadHistory(storage?: MaybeStorage): History {
  const s = resolveStorage(storage);
  if (!s) return { sessions: [] };
  try {
    const raw = s.getItem(HISTORY_KEY);
    if (!raw) return { sessions: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as { sessions?: unknown }).sessions)
    ) {
      return { sessions: [] };
    }
    return parsed as History;
  } catch {
    return { sessions: [] };
  }
}

export function saveSession(record: SessionRecord, storage?: MaybeStorage): History {
  const s = resolveStorage(storage);
  const next: History = { sessions: [...loadHistory(storage).sessions, record] };
  if (s) {
    try {
      s.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* 保存できなくてもアプリは続行する */
    }
  }
  return next;
}

export interface OverallStats {
  sessions: number;
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
}

export function overallStats(history: History): OverallStats {
  const totalAnswered = history.sessions.reduce((n, s) => n + s.total, 0);
  const totalCorrect = history.sessions.reduce((n, s) => n + s.correct, 0);
  return {
    sessions: history.sessions.length,
    totalAnswered,
    totalCorrect,
    accuracy: totalAnswered === 0 ? 0 : totalCorrect / totalAnswered,
  };
}

/** 誤答回数の多い語 id を多い順に返す */
export function weakIds(history: History, topN = 10): { id: string; misses: number }[] {
  const counts = new Map<string, number>();
  for (const s of history.sessions) {
    for (const id of s.wrongIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, misses]) => ({ id, misses }))
    .sort((a, b) => b.misses - a.misses || a.id.localeCompare(b.id))
    .slice(0, topN);
}
