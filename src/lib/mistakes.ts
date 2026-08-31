// "Sổ từ sai" — theo dõi những từ hay bị trả lời sai ở Flashcard/Quiz để
// gom lại ôn tập trung (nguyên lý Pareto: 20% từ khó chiếm 80% thời gian quên).
// Khóa từ dùng chung định dạng "cấpđộ:chữ" với hệ thống SRS (xem srs.ts).

export type Mistakes = Record<string, { count: number; last: number }>;

const KEY = "hsk-mistakes";

export function loadMistakes(): Mistakes {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveMistakes(m: Mistakes) {
  localStorage.setItem(KEY, JSON.stringify(m));
}

// Gọi khi trả lời sai — tăng số lần sai của từ này
export function recordMistake(key: string): Mistakes {
  const m = loadMistakes();
  const cur = m[key] ?? { count: 0, last: 0 };
  const next = { ...m, [key]: { count: cur.count + 1, last: Date.now() } };
  saveMistakes(next);
  return next;
}

// Gọi khi trả lời đúng — giảm dần số lần sai, rời khỏi sổ khi về 0
export function recordCorrect(key: string): Mistakes {
  const m = loadMistakes();
  const cur = m[key];
  if (!cur) return m;
  const next = { ...m };
  if (cur.count <= 1) {
    delete next[key];
  } else {
    next[key] = { count: cur.count - 1, last: cur.last };
  }
  saveMistakes(next);
  return next;
}

// Danh sách khóa từ trong sổ, sai nhiều nhất lên trước
export function sortedMistakeKeys(m: Mistakes): string[] {
  return Object.entries(m)
    .sort((a, b) => b[1].count - a[1].count || b[1].last - a[1].last)
    .map(([k]) => k);
}
