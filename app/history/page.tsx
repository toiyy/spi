"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import idiomsJson from "@/data/idioms.json";
import { indexById, parseIdioms } from "@/lib/idioms";
import { loadHistory, overallStats, weakIds } from "@/lib/stats";
import type { History } from "@/lib/types";

const BY_ID = indexById(parseIdioms(idiomsJson));

export default function HistoryPage() {
  const [history, setHistory] = useState<History>({ sessions: [] });

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const stats = overallStats(history);
  const weak = weakIds(history, 15);
  const recent = [...history.sessions].reverse().slice(0, 10);

  return (
    <>
      <h1>これまでの成績</h1>
      <p className="sub">localStorage に保存された履歴</p>

      <div className="card">
        <div className="stat-grid">
          <div className="cell">
            <span>セッション</span>
            <div className="big-num">{stats.sessions}</div>
          </div>
          <div className="cell">
            <span>累計出題</span>
            <div className="big-num">{stats.totalAnswered}</div>
          </div>
          <div className="cell">
            <span>累計正答率</span>
            <div className="big-num">{Math.round(stats.accuracy * 100)}%</div>
          </div>
        </div>

        {weak.length > 0 && (
          <>
            <p className="sub" style={{ margin: "20px 0 4px" }}>
              苦手な語（誤答が多い順）
            </p>
            <ul className="weak">
              {weak.map((w) => {
                const idiom = BY_ID.get(w.id);
                return (
                  <li key={w.id}>
                    <span>
                      {idiom?.word ?? w.id}
                      {idiom && `（${idiom.reading}）`}
                    </span>
                    <span style={{ color: "var(--muted)" }}>{w.misses} 回</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {recent.length > 0 && (
          <>
            <p className="sub" style={{ margin: "20px 0 4px" }}>
              最近のセッション
            </p>
            <ul className="weak">
              {recent.map((s, i) => (
                <li key={`${s.date}-${i}`}>
                  <span style={{ color: "var(--muted)" }}>
                    {new Date(s.date).toLocaleString("ja-JP")}
                  </span>
                  <span>
                    {s.correct}/{s.total}（
                    {s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0}%）
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {history.sessions.length === 0 && (
          <p className="sub">まだ履歴がありません。1回学習すると記録されます。</p>
        )}
      </div>

      <div className="spacer" />
      <Link href="/">← ホームへ</Link>
    </>
  );
}
