"use client";

import { useState } from "react";
import { ROOT_FOLDER, TAI_LIEU } from "@/data/tailieu";

const GROUPS: { label: string; match: (name: string) => boolean }[] = [
  { label: "Tất cả", match: () => true },
  { label: "Khóa học", match: (n) => /khóa học|bài giảng/i.test(n) },
  { label: "Giáo trình", match: (n) => /giáo trình|boya|mustong|sách/i.test(n) },
  { label: "Đề thi & luyện thi", match: (n) => /đề thi|luyện thi|thi đậu|ôn thi|ôn tập/i.test(n) },
  { label: "Từ vựng & flashcard", match: (n) => /từ vựng|flashcard|từ điển|từ ghép/i.test(n) },
  { label: "Ngữ pháp", match: (n) => /ngữ pháp|cấu trúc|lượng từ|nối câu|câu phức/i.test(n) },
  { label: "Luyện viết & bộ thủ", match: (n) => /viết|bộ thủ|kẻ vở|chiết tự|hán tự/i.test(n) },
  { label: "Giao tiếp", match: (n) => /giao tiếp|đàm thoại|khẩu ngữ|phỏng vấn|câu chuyện|bài hát/i.test(n) },
  { label: "Chuyên ngành", match: (n) => /ngành|thương mại|văn phòng|biên phiên dịch|hàng hải/i.test(n) },
];

export default function TaiLieuPage() {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState(0);

  const filtered = TAI_LIEU.filter(
    (t) =>
      GROUPS[group].match(t.name) &&
      t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kho tài liệu</h1>
          <p className="text-sm text-stone-500 mt-1">
            {TAI_LIEU.length} bộ tài liệu trong Google Drive của bạn — bấm để mở.
          </p>
        </div>
        <a
          href={ROOT_FOLDER}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          Mở thư mục gốc ↗
        </a>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm tài liệu..."
        className="w-full max-w-md rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-5 py-2.5 outline-none focus:border-red-400"
      />

      <div className="flex gap-2 flex-wrap">
        {GROUPS.map((g, i) => (
          <button
            key={g.label}
            onClick={() => setGroup(i)}
            className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
              i === group
                ? "bg-red-600 border-red-600 text-white"
                : "border-stone-300 dark:border-stone-700 hover:border-red-400"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t) => (
          <a
            key={t.link}
            href={t.link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-sm hover:border-red-300 dark:hover:border-red-800 hover:shadow-md transition-all flex items-start gap-3"
          >
            <span className="text-lg">📁</span>
            <span>{t.name}</span>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-stone-500 py-10">Không tìm thấy tài liệu phù hợp.</p>
      )}
    </div>
  );
}
