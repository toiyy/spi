export type Category = "meaning" | "relation";

export interface Idiom {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example?: string;
  category: Category;
  /** 4択の誤答を選ぶための意味グループ（distractors 未設定時のフォールバック用） */
  group?: string;
  /** 4択の誤答として使う、意味の近い語（この一覧の外の語）。3語以上 */
  distractors?: string[];
}

export type Grade = "correct" | "wrong";

/** 1セッション分の結果（localStorage に貯める1レコード） */
export interface SessionRecord {
  /** ISO 8601 文字列 */
  date: string;
  /** セッションに含まれた語数（distinct） */
  total: number;
  /** 一度も間違えずにクリアした語数 */
  correct: number;
  /** 1回以上間違えた語の id（distinct） */
  wrongIds: string[];
}

export interface History {
  sessions: SessionRecord[];
}
