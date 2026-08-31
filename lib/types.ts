export type Category = "meaning" | "relation";

export interface Idiom {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example?: string;
  category: Category;
  /** 4択の誤答を選ぶための広い意味ドメイン。誤答は同じ group から選ぶ */
  group?: string;
  /**
   * 同義・類義でまとめた意味クラスタ。同じ値の語は互いに誤答にしない
   * （正解が2つ以上ある問題を防ぐ）。未指定なら自分だけのクラスタ扱い。
   */
  cluster?: string;
  /** 同字数の候補が語彙内にない語だけ、誤答を明示する */
  distractors?: Distractor[];
}

export interface Distractor {
  word: string;
  gloss: string;
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
