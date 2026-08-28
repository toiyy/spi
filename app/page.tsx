"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import idiomsJson from "@/data/idioms.json";
import { indexById, parseIdioms } from "@/lib/idioms";
import { buildQueue } from "@/lib/queue";
import {
  currentId,
  grade,
  startSession,
  summary,
  toRecord,
  type SessionState,
} from "@/lib/session";
import { saveSession } from "@/lib/stats";

const ALL_IDIOMS = parseIdioms(idiomsJson);
const BY_ID = indexById(ALL_IDIOMS);

type View = "home" | "study" | "result";

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [count, setCount] = useState(ALL_IDIOMS.length);
  const [shuffle, setShuffle] = useState(true);
  const [session, setSession] = useState<SessionState>(() => startSession([]));
  const [revealed, setRevealed] = useState(false);
  const savedFor = useRef<SessionState | null>(null);

  function begin() {
    const queue = buildQueue(ALL_IDIOMS, { count, shuffle });
    setSession(startSession(queue.map((x) => x.id)));
    setRevealed(false);
    savedFor.current = null;
    setView("study");
  }

  function answer(correct: boolean) {
    const next = grade(session, correct ? "correct" : "wrong");
    setSession(next);
    setRevealed(false);
    if (next.finished && savedFor.current !== next) {
      savedFor.current = next;
      saveSession(toRecord(next));
      setView("result");
    }
  }

  if (view === "home") {
    return (
      <>
        <h1>SPI熟語暗記</h1>
        <p className="sub">語句の意味 / 種データ {ALL_IDIOMS.length} 語</p>
        <div className="card">
          <div className="row" style={{ alignItems: "center", marginBottom: 16 }}>
            <label>
              出題数
              <input
                type="number"
                min={1}
                max={ALL_IDIOMS.length}
                value={count}
                onChange={(e) =>
                  setCount(clamp(Number(e.target.value), 1, ALL_IDIOMS.length))
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
              />
              ランダム出題
            </label>
          </div>
          <button className="primary" onClick={begin}>
            開始
          </button>
        </div>
        <div className="spacer" />
        <Link href="/history">これまでの成績 →</Link>
      </>
    );
  }

  if (view === "study") {
    const id = currentId(session);
    const idiom = id ? BY_ID.get(id) : undefined;
    const s = summary(session);
    const remaining = session.remaining.length;
    if (!idiom) {
      return (
        <div className="card">
          データが見つかりません。<button onClick={() => setView("home")}>ホームへ</button>
        </div>
      );
    }
    return (
      <>
        <h1>出題中</h1>
        <p className="progress">
          残り {remaining} 語 / 正解 {s.correct} ・ 誤答 {s.wrongIds.length}
        </p>
        <div className="card">
          <div className="word">{idiom.word}</div>
          <div className="reading">{idiom.reading}</div>

          {!revealed ? (
            <button className="primary" onClick={() => setRevealed(true)}>
              意味を見る
            </button>
          ) : (
            <>
              <div className="answer">
                <div className="meaning">{idiom.meaning}</div>
                {idiom.example && <div className="example">例：{idiom.example}</div>}
              </div>
              <div className="row">
                <button className="ok" onClick={() => answer(true)}>
                  ○ わかった
                </button>
                <button className="ng" onClick={() => answer(false)}>
                  × あやふや
                </button>
              </div>
            </>
          )}
        </div>
        <div className="spacer" />
        <button className="ghost" onClick={() => setView("home")}>
          中断してホームへ
        </button>
      </>
    );
  }

  // result
  const s = summary(session);
  const pct = Math.round(s.accuracy * 100);
  return (
    <>
      <h1>結果</h1>
      <p className="sub">お疲れさまでした</p>
      <div className="card">
        <div className="stat-grid">
          <div className="cell">
            <span>語数</span>
            <div className="big-num">{s.total}</div>
          </div>
          <div className="cell">
            <span>一発正解</span>
            <div className="big-num">{s.correct}</div>
          </div>
          <div className="cell">
            <span>正答率</span>
            <div className="big-num">{pct}%</div>
          </div>
        </div>

        {s.wrongIds.length > 0 && (
          <>
            <p className="sub" style={{ margin: "16px 0 4px" }}>
              間違えた語（復習）
            </p>
            <ul className="weak">
              {s.wrongIds.map((id) => {
                const w = BY_ID.get(id);
                return (
                  <li key={id}>
                    <span>
                      {w?.word}（{w?.reading}）
                    </span>
                    <span style={{ color: "var(--muted)" }}>{w?.meaning}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="spacer" />
        <div className="row">
          <button className="primary" onClick={begin}>
            もう一度
          </button>
          <button onClick={() => setView("home")}>ホーム</button>
        </div>
      </div>
      <div className="spacer" />
      <Link href="/history">これまでの成績 →</Link>
    </>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
