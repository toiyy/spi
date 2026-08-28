import type { Grade, SessionRecord } from "./types";

/**
 * シンプル出題セッションの状態。
 * - `remaining[0]` が現在の出題語
 * - 誤答した語は末尾に回し、正解するまで残る（＝当日中に再出題）
 * - 一度も誤答せずクリアした語だけを「正解」に数える
 */
export interface SessionState {
  /** まだクリアしていない語 id（FIFO） */
  remaining: string[];
  /** セッション開始時の語数（distinct） */
  total: number;
  /** 一度も誤答せずクリアした語 id */
  clearedFirstTry: string[];
  /** 1回以上誤答した語 id（distinct） */
  wrongIds: string[];
  /** すべてクリアしたか */
  finished: boolean;
}

export interface SessionSummary {
  total: number;
  correct: number;
  wrongIds: string[];
  accuracy: number;
}

export function startSession(ids: readonly string[]): SessionState {
  return {
    remaining: [...ids],
    total: ids.length,
    clearedFirstTry: [],
    wrongIds: [],
    finished: ids.length === 0,
  };
}

export function currentId(state: SessionState): string | null {
  return state.remaining[0] ?? null;
}

export function grade(state: SessionState, g: Grade): SessionState {
  if (state.finished) return state;
  const id = state.remaining[0];
  if (id === undefined) return { ...state, finished: true };

  if (g === "correct") {
    const rest = state.remaining.slice(1);
    const everWrong = state.wrongIds.includes(id);
    return {
      ...state,
      remaining: rest,
      clearedFirstTry: everWrong ? state.clearedFirstTry : [...state.clearedFirstTry, id],
      wrongIds: state.wrongIds,
      finished: rest.length === 0,
    };
  }

  // wrong: 末尾へ回す
  return {
    ...state,
    remaining: [...state.remaining.slice(1), id],
    wrongIds: state.wrongIds.includes(id) ? state.wrongIds : [...state.wrongIds, id],
    finished: false,
  };
}

export function summary(state: SessionState): SessionSummary {
  const correct = state.clearedFirstTry.length;
  return {
    total: state.total,
    correct,
    wrongIds: state.wrongIds,
    accuracy: state.total === 0 ? 0 : correct / state.total,
  };
}

export function toRecord(state: SessionState, now: Date = new Date()): SessionRecord {
  const s = summary(state);
  return {
    date: now.toISOString(),
    total: s.total,
    correct: s.correct,
    wrongIds: s.wrongIds,
  };
}
