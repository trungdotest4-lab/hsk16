// Dữ liệu học theo giáo trình "Hán ngữ giáo trình" (Đại học Ngôn ngữ Bắc Kinh) —
// khác với bộ từ vựng HSK1-6 chính thức (xem hsk.ts): đây là từ vựng thật của
// từng quyển/bài trong sách, trích trực tiếp từ Bảng từ vựng cuối mỗi quyển.
// Quyển nào chưa có file .json thì coi như chưa có dữ liệu (đang bổ sung dần).
import quyen3 from "./lessons/quyen3.json";

export type LessonWord = {
  h: string; // chữ Hán
  p: string; // pinyin
  vi: string; // nghĩa Việt
  pos?: string; // từ loại (动, 名, 形...) — không phải từ nào cũng có
  proper?: boolean; // true nếu là danh từ riêng (tên người/địa danh) thay vì từ vựng thường
};

export type Lesson = {
  n: number; // số thứ tự bài trong quyển
  words: LessonWord[];
};

// Khớp LEVEL_NUMBERS trong hsk.ts (1 quyển ~ 1 cấp độ HSK theo cách người dùng đang phân loại)
export const COURSEBOOKS: Partial<Record<number, Lesson[]>> = {
  3: quyen3 as Lesson[],
};

export function hasCoursebook(level: number): boolean {
  return !!COURSEBOOKS[level]?.length;
}

export function getLessons(level: number): Lesson[] {
  return COURSEBOOKS[level] ?? [];
}

export function getLesson(level: number, n: number): Lesson | undefined {
  return getLessons(level).find((l) => l.n === n);
}

// Khóa định danh 1 từ trong giáo trình, dùng chung cơ chế ôn tập (srs.ts) với
// từ vựng HSK — tiền tố "gt" để không trùng khóa "level:chữ" của hsk.wordKey
export function lessonWordKey(level: number, lessonN: number, w: LessonWord): string {
  return `gt${level}-${lessonN}:${w.h}`;
}
