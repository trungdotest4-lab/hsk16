// Bộ từ vựng HSK1-6 (chuẩn cũ 2012) — sinh bởi scripts/build-data.mjs
import level1 from "./hsk/level1.json";
import level2 from "./hsk/level2.json";
import level3 from "./hsk/level3.json";
import level4 from "./hsk/level4.json";
import level5 from "./hsk/level5.json";
import level6 from "./hsk/level6.json";

export type Example = {
  h: string; // câu ví dụ bằng chữ Hán
  p: string; // pinyin của câu
  vi: string; // dịch nghĩa câu
};

export type Word = {
  h: string; // chữ Hán giản thể
  p: string; // pinyin
  en: string; // nghĩa tiếng Anh
  vi?: string; // nghĩa tiếng Việt (đã đầy đủ cho HSK1-6)
  ex?: Example; // câu ví dụ (đang bổ sung dần theo từng cấp)
};

export const LEVELS: Record<number, Word[]> = {
  1: level1 as Word[],
  2: level2 as Word[],
  3: level3 as Word[],
  4: level4 as Word[],
  5: level5 as Word[],
  6: level6 as Word[],
};

export const LEVEL_NUMBERS = [1, 2, 3, 4, 5, 6];

// Nghĩa hiển thị: ưu tiên tiếng Việt, chưa dịch thì dùng tiếng Anh
export function meaning(w: Word): string {
  return w.vi ?? w.en;
}

// Khóa định danh một từ trong hệ thống ôn tập: "cấpđộ:chữ"
export function wordKey(level: number, w: Word): string {
  return `${level}:${w.h}`;
}
