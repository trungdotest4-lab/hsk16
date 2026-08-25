// Ôn tập ngắt quãng kiểu Leitner, lưu tiến độ trong localStorage
// Khóa mỗi từ: "cấpđộ:chữ" (ví dụ "1:爱")
export type CardState = {
  box: number; // 0-4, hộp càng cao ôn càng thưa
  due: number; // timestamp lần ôn tiếp theo
};

export type Progress = Record<string, CardState>;

const KEY = "hsk-srs";
const OLD_KEY = "hsk1-srs"; // phiên bản cũ chỉ có HSK1, khóa là chữ Hán trần
// Khoảng cách giữa các lần ôn theo hộp (ngày)
const INTERVALS_DAYS = [0, 1, 3, 7, 14];

export function loadProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    const cur: Progress = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    // chuyển tiến độ bản cũ (chỉ HSK1) sang khóa mới rồi xóa
    const oldRaw = localStorage.getItem(OLD_KEY);
    if (oldRaw) {
      const old: Progress = JSON.parse(oldRaw);
      for (const [h, st] of Object.entries(old)) {
        const k = h.includes(":") ? h : `1:${h}`;
        if (!cur[k]) cur[k] = st;
      }
      localStorage.removeItem(OLD_KEY);
      localStorage.setItem(KEY, JSON.stringify(cur));
    }
    return cur;
  } catch {
    return {};
  }
}

export function saveProgress(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function review(p: Progress, key: string, known: boolean): Progress {
  const cur = p[key] ?? { box: 0, due: 0 };
  const box = known ? Math.min(cur.box + 1, 4) : 0;
  const due = Date.now() + INTERVALS_DAYS[box] * 24 * 60 * 60 * 1000;
  return { ...p, [key]: { box, due } };
}

export function isDue(p: Progress, key: string): boolean {
  const s = p[key];
  return !s || s.due <= Date.now();
}

export function stats(p: Progress, keys: string[]) {
  let learned = 0;
  let mastered = 0;
  for (const k of keys) {
    const s = p[k];
    if (s && s.box > 0) learned++;
    if (s && s.box >= 4) mastered++;
  }
  return { learned, mastered, total: keys.length };
}

// Gộp tiến độ local và server: lấy trạng thái "tiến xa hơn" cho từng từ
export function mergeProgress(a: Progress, b: Progress): Progress {
  const out: Progress = { ...a };
  for (const [k, st] of Object.entries(b)) {
    const cur = out[k];
    if (!cur || st.box > cur.box || (st.box === cur.box && st.due > cur.due)) {
      out[k] = st;
    }
  }
  return out;
}
