"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LEVELS, LEVEL_NUMBERS, wordKey } from "@/data/hsk";
import { loadProgress, type Progress } from "@/lib/srs";
import { getSupabase } from "@/lib/supabase";
import { fullSync } from "@/lib/sync";
import { loadMistakes } from "@/lib/mistakes";

// Thông tin mô tả từng chặng lộ trình HSK
const ROADMAP: Record<
  number,
  { goal: string; skill: string; tips: string[] }
> = {
  1: {
    goal: "150 từ đầu tiên — nền móng của mọi thứ",
    skill: "Chào hỏi, giới thiệu bản thân, số đếm, mua sắm đơn giản.",
    tips: [
      "Học 10–15 từ mới mỗi ngày bằng Flashcard",
      "Luyện viết các chữ đơn giản: 人, 大, 好, 我...",
      "Nghe phát âm từng từ và đọc theo",
    ],
  },
  2: {
    goal: "Thêm 151 từ — đạt mốc ~300 từ",
    skill: "Hội thoại ngắn về công việc, sở thích, thời gian, phương hướng.",
    tips: [
      "Duy trì 15 từ mới/ngày + ôn hết từ đến hạn",
      "Làm quiz Chọn nghĩa và Luyện nghe mỗi ngày 1 lượt",
      "Bắt đầu để ý các lượng từ: 个, 本, 杯...",
    ],
  },
  3: {
    goal: "Thêm 300 từ — đạt mốc ~600 từ",
    skill: "Giao tiếp cơ bản trong sinh hoạt, học tập, công việc; câu phức đơn giản.",
    tips: [
      "Tăng lên 15–20 từ mới/ngày",
      "Luyện viết mỗi ngày 5 chữ để nhớ mặt chữ lâu hơn",
      "Xem tài liệu ngữ pháp HSK3 trong Kho tài liệu",
    ],
  },
  4: {
    goal: "Thêm 600 từ — đạt mốc ~1.200 từ",
    skill: "Thảo luận nhiều chủ đề, đọc hiểu văn bản ngắn, xem video có phụ đề.",
    tips: [
      "20 từ mới/ngày, ưu tiên ôn từ 'Chưa thuộc' trước",
      "Làm quiz Luyện nghe nhiều hơn — HSK4 thi nghe khá nhanh",
      "Tập đặt câu với từ mới học",
    ],
  },
  5: {
    goal: "Thêm 1.300 từ — đạt mốc ~2.500 từ",
    skill: "Đọc báo, tạp chí; xem phim Trung; thuyết trình chủ đề quen thuộc.",
    tips: [
      "20–25 từ mới/ngày, kiên trì là chìa khóa",
      "Đọc tài liệu luyện dịch trong Kho tài liệu",
      "Ôn lại định kỳ HSK3-4 để không rơi rụng",
    ],
  },
  6: {
    goal: "Thêm 2.500 từ — chinh phục ~5.000 từ",
    skill: "Hiểu thoải mái nội dung nghe/đọc, diễn đạt trôi chảy bằng nói và viết.",
    tips: [
      "25–30 từ mới/ngày với thành ngữ học kèm ví dụ",
      "Chú trọng 成语 (thành ngữ 4 chữ) — thi HSK6 rất hay gặp",
      "Luyện viết đoạn văn tóm tắt — kỹ năng bắt buộc của HSK6",
    ],
  },
};

type LevelStat = {
  learned: number;
  mastered: number;
  due: number;
  total: number;
};

function calcStats(p: Progress): Record<number, LevelStat> {
  const now = Date.now();
  const out: Record<number, LevelStat> = {};
  for (const n of LEVEL_NUMBERS) {
    let learned = 0;
    let mastered = 0;
    let due = 0;
    for (const w of LEVELS[n]) {
      const s = p[wordKey(n, w)];
      if (s && s.box > 0) learned++;
      if (s && s.box >= 4) mastered++;
      if (s && s.due <= now) due++;
    }
    out[n] = { learned, mastered, due, total: LEVELS[n].length };
  }
  return out;
}

// Trạng thái một chặng: xong khi thuộc hết, đang học khi đã có từ, còn lại là chưa bắt đầu
function levelStatus(s: LevelStat): "done" | "doing" | "todo" {
  if (s.learned >= s.total) return "done";
  if (s.learned > 0) return "doing";
  return "todo";
}

export default function LoTrinh() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Record<number, LevelStat>>({});
  const [mistakeCount, setMistakeCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStats(calcStats(loadProgress()));
    setMistakeCount(Object.keys(loadMistakes()).length);
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getUser().then(async ({ data }) => {
      setUser(data?.user ?? null);
      setReady(true);
      if (data?.user) {
        // có đăng nhập thì kéo tiến độ mới nhất từ server về rồi tính lại
        try {
          const merged = await fullSync();
          if (merged) setStats(calcStats(merged));
        } catch {
          // offline / chưa tạo bảng — dùng dữ liệu local
        }
      }
    });
  }, []);

  // chuyển sang trang học với cấp độ được chọn sẵn
  function goStudy(path: string, level: number) {
    try {
      localStorage.setItem("hsk-level", String(level));
    } catch {}
    router.push(path);
  }

  const totalLearned = LEVEL_NUMBERS.reduce((s, n) => s + (stats[n]?.learned ?? 0), 0);
  const totalMastered = LEVEL_NUMBERS.reduce((s, n) => s + (stats[n]?.mastered ?? 0), 0);
  const totalDue = LEVEL_NUMBERS.reduce((s, n) => s + (stats[n]?.due ?? 0), 0);
  const totalWords = LEVEL_NUMBERS.reduce((s, n) => s + LEVELS[n].length, 0);
  // chặng hiện tại: cấp đầu tiên chưa thuộc hết
  const currentLevel =
    LEVEL_NUMBERS.find((n) => (stats[n]?.learned ?? 0) < (stats[n]?.total ?? 1)) ?? 6;

  if (!ready) return null;

  const displayName = user?.email?.replace(/@hsk16\.local$/, "");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan & Lộ trình</h1>
        {user ? (
          <p className="text-sm text-stone-500 mt-1">
            Xin chào <b className="text-red-600">{displayName}</b> — tiến độ của bạn được đồng
            bộ trên mọi thiết bị.
          </p>
        ) : (
          <p className="text-sm text-stone-500 mt-1">
            Bạn chưa đăng nhập — tiến độ chỉ lưu trên máy này.{" "}
            <Link href="/taikhoan" className="text-red-600 underline underline-offset-2">
              Đăng nhập
            </Link>{" "}
            để theo dõi trên mọi thiết bị.
          </p>
        )}
      </div>

      {/* Thẻ số liệu tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Từ đã học", value: totalLearned, sub: `/ ${totalWords.toLocaleString("vi")} từ` },
          { label: "Thành thạo", value: totalMastered, sub: "ôn đủ 4 vòng" },
          { label: "Đến hạn ôn", value: totalDue, sub: "cần ôn hôm nay" },
          { label: "Từ hay sai", value: mistakeCount, sub: "trong sổ từ sai", href: "/onsai" },
          { label: "Chặng hiện tại", value: `HSK${currentLevel}`, sub: ROADMAP[currentLevel].goal.split("—")[0].trim() },
        ].map((c) => {
          const content = (
            <>
              <p className="text-xs text-stone-500">{c.label}</p>
              <p className="text-2xl font-bold text-red-600 mt-0.5">{c.value}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{c.sub}</p>
            </>
          );
          const cls =
            "rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4";
          return c.href ? (
            <Link key={c.label} href={c.href} className={`${cls} hover:border-red-300 dark:hover:border-red-800 transition-colors`}>
              {content}
            </Link>
          ) : (
            <div key={c.label} className={cls}>
              {content}
            </div>
          );
        })}
      </div>

      {totalDue > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            ⏰ Bạn có <b>{totalDue}</b> từ đến hạn ôn tập — ôn ngay để không quên!
          </p>
          <button
            onClick={() => goStudy("/flashcards", currentLevel)}
            className="px-4 py-2 rounded-full bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Ôn ngay →
          </button>
        </div>
      )}

      {/* Lộ trình từng chặng */}
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Lộ trình HSK1 → HSK6</h2>
        <p className="text-sm text-stone-500">
          Học tuần tự từng cấp. Mỗi ngày: học từ mới + ôn hết từ đến hạn (thẻ sẽ tự quay
          lại sau 1 → 3 → 7 → 14 ngày).
        </p>
      </div>

      <ol className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
        {LEVEL_NUMBERS.map((n) => {
          const s = stats[n] ?? { learned: 0, mastered: 0, due: 0, total: LEVELS[n].length };
          const status = levelStatus(s);
          const pct = Math.round((s.learned / s.total) * 100);
          const isCurrent = n === currentLevel;
          const meta = ROADMAP[n];
          return (
            <li key={n} className="relative pl-12">
              {/* mốc tròn trên trục thời gian */}
              <span
                className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  status === "done"
                    ? "bg-green-600 border-green-600 text-white"
                    : isCurrent
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-400"
                }`}
              >
                {status === "done" ? "✓" : n}
              </span>

              <div
                className={`rounded-2xl border p-5 space-y-3 bg-white dark:bg-stone-900 ${
                  isCurrent
                    ? "border-red-300 dark:border-red-800 shadow-md"
                    : "border-stone-200 dark:border-stone-800"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-semibold">
                    HSK{n}
                    {isCurrent && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600">
                        đang học
                      </span>
                    )}
                    {status === "done" && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-600">
                        hoàn thành
                      </span>
                    )}
                  </h3>
                  <span className="text-sm text-stone-500">
                    {s.learned}/{s.total} từ · {s.mastered} thành thạo
                    {s.due > 0 && <b className="text-amber-600"> · {s.due} đến hạn</b>}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${status === "done" ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-sm font-medium">{meta.goal}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  <b>Sau chặng này bạn có thể:</b> {meta.skill}
                </p>

                {(isCurrent || status === "doing") && (
                  <>
                    <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1">
                      {meta.tips.map((t) => (
                        <li key={t}>• {t}</li>
                      ))}
                    </ul>
                    <div className="flex gap-2 flex-wrap pt-1">
                      <button
                        onClick={() => goStudy("/flashcards", n)}
                        className="px-4 py-1.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Học flashcard
                      </button>
                      <button
                        onClick={() => goStudy("/quiz", n)}
                        className="px-4 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        Trắc nghiệm
                      </button>
                      <button
                        onClick={() => goStudy("/viet", n)}
                        className="px-4 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        Luyện viết
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="text-center text-xs text-stone-400 pb-4">
        Gợi ý: chỉ cần đều đặn 15–20 phút mỗi ngày, bạn sẽ đi hết lộ trình nhanh hơn bạn nghĩ. 加油！
      </p>
    </div>
  );
}
