"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import idiomsJson from "@/data/idioms.json";
import { indexById, parseIdioms } from "@/lib/idioms";
import { buildQueue } from "@/lib/queue";
import { buildChoices, type ChoiceSet } from "@/lib/choices";
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
type Mode = "choice" | "recall";

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [mode, setMode] = useState<Mode>("choice");
  const [count, setCount] = useState(ALL_IDIOMS.length);
  const [shuffle, setShuffle] = useState(true);
  const [session, setSession] = useState<SessionState>(() => startSession([]));
  const [revealed, setRevealed] = useState(false); // recall モード用
  const [quiz, setQuiz] = useState<ChoiceSet | null>(null); // choice モード用
  const [picked, setPicked] = useState<string | null>(null);
  const savedFor = useRef<SessionState | null>(null);

  function loadQuizFor(s: SessionState) {
    const id = currentId(s);
    const idiom = id ? BY_ID.get(id) : undefined;
    setQuiz(idiom ? buildChoices(idiom, ALL_IDIOMS) : null);
    setPicked(null);
  }

  function begin() {
    const queue = buildQueue(ALL_IDIOMS, { count, shuffle });
    const s = startSession(queue.map((x) => x.id));
    setSession(s);
    setRevealed(false);
    savedFor.current = null;
    loadQuizFor(s);
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
      return;
    }
    loadQuizFor(next);
  }

  if (view === "home") {
    return (
      <>
        <h1>SPI熟語暗記</h1>
        <p className="sub">語句の意味 / 全 {ALL_IDIOMS.length} 語</p>
        <div className="card">
          <div className="row" style={{ marginBottom: 16 }}>
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === "choice"}
                onChange={() => setMode("choice")}
              />
              4択（意味→語を選ぶ）
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === "recall"}
                onChange={() => setMode("recall")}
              />
              思い出す（○×）
            </label>
          </div>
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
          データが見つかりません。
          <button onClick={() => setView("home")}>ホームへ</button>
        </div>
      );
    }

    const progress = (
      <p className="progress">
        残り {remaining} 語 / 正解 {s.correct} ・ 誤答 {s.wrongIds.length}
      </p>
    );

    if (mode === "choice") {
      const answerId = quiz?.answerId ?? null;
      const answered = picked !== null;
      const hit = picked === answerId;
      return (
        <>
          <h1>この意味の語は？</h1>
          {progress}
          <div className="card">
            <div className="q-meaning">{idiom.meaning}</div>
            <div className="choices">
              {(quiz?.choices ?? []).map((c) => {
                const cls =
                  answered && c.id === answerId
                    ? "choice correct"
                    : answered && c.id === picked
                      ? "choice wrong"
                      : "choice";
                return (
                  <button
                    key={c.id}
                    className={cls}
                    disabled={answered}
                    onClick={() => setPicked(c.id)}
                  >
                    <span className="c-word">{c.word}</span>
                    {answered && <span className="c-gloss">{c.gloss}</span>}
                  </button>
                );
              })}
            </div>
            {answered && (
              <>
                <p className={hit ? "judge hit" : "judge miss"}>
                  {hit ? "正解" : "不正解"} — 正解は「{idiom.word}」（{idiom.reading}）
                </p>
                {idiom.example && (
                  <div className="answer">
                    <div className="example">例：{idiom.example}</div>
                  </div>
                )}
                <div className="spacer" />
                <button className="primary" onClick={() => answer(hit)}>
                  次へ
                </button>
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

    // recall モード
    return (
      <>
        <h1>出題中</h1>
        {progress}
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
                {idiom.example && (
                  <div className="example">例：{idiom.example}</div>
                )}
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
              {s.wrongIds.map((wid) => {
                const w = BY_ID.get(wid);
                return (
                  <li key={wid}>
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
