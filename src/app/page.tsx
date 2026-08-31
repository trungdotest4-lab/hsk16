"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LEVELS, LEVEL_NUMBERS, wordKey } from "@/data/hsk";
import { loadProgress, stats } from "@/lib/srs";

const FEATURES = [
  {
    href: "/lotrinh",
    hanzi: "路",
    title: "Tổng quan & Lộ trình",
    desc: "Xem tổng số từ đã học, từ đến hạn ôn, và lộ trình hướng dẫn từ HSK1 đến HSK6.",
  },
  {
    href: "/flashcards",
    hanzi: "卡",
    title: "Flashcard từ vựng",
    desc: "5.000 từ HSK1-6 với chữ Hán, pinyin, nghĩa và phát âm. Ôn tập ngắt quãng tự động.",
  },
  {
    href: "/viet",
    hanzi: "写",
    title: "Luyện viết chữ Hán",
    desc: "Xem thứ tự nét và tự viết theo trên màn hình, chấm đúng sai từng nét.",
  },
  {
    href: "/quiz",
    hanzi: "考",
    title: "Trắc nghiệm",
    desc: "Quiz chọn nghĩa, chọn chữ và luyện nghe theo từng cấp độ HSK.",
  },
  {
    href: "/giaotrinh",
    hanzi: "课",
    title: "Học theo giáo trình",
    desc: "Từ vựng thật trích từng bài trong sách Giáo trình Hán ngữ — học đúng thứ tự sách.",
  },
  {
    href: "/onsai",
    hanzi: "错",
    title: "Sổ từ sai",
    desc: "Gom lại những từ bạn hay trả lời sai để ôn tập trung, nhớ nhanh hơn.",
  },
  {
    href: "/tailieu",
    hanzi: "书",
    title: "Kho tài liệu",
    desc: "158 bộ tài liệu Google Drive: giáo trình, đề thi, ngữ pháp, flashcard, video.",
  },
];

type LevelStat = { learned: number; mastered: number; total: number };

export default function Home() {
  const [levelStats, setLevelStats] = useState<Record<number, LevelStat>>({});

  useEffect(() => {
    const p = loadProgress();
    const s: Record<number, LevelStat> = {};
    for (const n of LEVEL_NUMBERS) {
      s[n] = stats(p, LEVELS[n].map((w) => wordKey(n, w)));
    }
    setLevelStats(s);
  }, []);

  return (
    <div className="space-y-10">
      <section className="text-center space-y-3 py-6">
        <p className="font-hanzi text-6xl text-red-600">你好！</p>
        <h1 className="text-3xl font-bold">Cùng học tiếng Hoa mỗi ngày</h1>
        <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
          Trọn bộ 5.000 từ vựng HSK1–6, luyện viết chữ Hán, trắc nghiệm
          và kho tài liệu — tiến độ đồng bộ qua tài khoản của bạn.
        </p>
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4">
        <h2 className="font-semibold">Tiến độ theo cấp độ</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {LEVEL_NUMBERS.map((n) => {
            const s = levelStats[n] ?? { learned: 0, mastered: 0, total: LEVELS[n].length };
            const pct = s.total ? Math.round((s.learned / s.total) * 100) : 0;
            return (
              <div key={n}>
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <span className="font-medium">HSK{n}</span>
                  <span className="text-stone-500">
                    {s.learned}/{s.total} từ{s.mastered > 0 ? ` · ${s.mastered} thành thạo` : ""}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 hover:border-red-300 dark:hover:border-red-800 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <span className="font-hanzi text-4xl text-red-600 group-hover:scale-110 transition-transform">
                {f.hanzi}
              </span>
              <div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400">{f.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
