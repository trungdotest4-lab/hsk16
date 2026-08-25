"use client";

import { useEffect, useRef, useState } from "react";
import type HanziWriterType from "hanzi-writer";
import { LEVELS, meaning, type Word } from "@/data/hsk";
import { LevelPicker, useLevel } from "@/components/LevelPicker";
import { speak } from "@/lib/tts";

export default function LuyenViet() {
  const [level, setLevel] = useLevel();
  const [word, setWord] = useState<Word>(LEVELS[1][0]);
  const [charIdx, setCharIdx] = useState(0);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<"idle" | "quiz" | "done">("idle");
  const boxRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterType | null>(null);

  // đổi cấp độ thì chọn từ đầu tiên của cấp đó
  useEffect(() => {
    setWord(LEVELS[level][0]);
    setCharIdx(0);
  }, [level]);

  const chars = Array.from(word.h).filter((c) => /\p{Script=Han}/u.test(c));
  const currentChar = chars[charIdx] ?? chars[0];

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!boxRef.current || !currentChar) return;
      const { default: HanziWriter } = await import("hanzi-writer");
      if (cancelled || !boxRef.current) return;
      boxRef.current.innerHTML = "";
      writerRef.current = HanziWriter.create(boxRef.current, currentChar, {
        width: 280,
        height: 280,
        padding: 16,
        showOutline: true,
        strokeColor: "#dc2626",
        outlineColor: "#e7e5e4",
        drawingColor: "#1c1917",
        drawingWidth: 18,
      });
      setStatus("idle");
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [currentChar]);

  function startQuiz() {
    const w = writerRef.current;
    if (!w) return;
    setStatus("quiz");
    w.quiz({
      onComplete: () => setStatus("done"),
    });
  }

  function showDemo() {
    writerRef.current?.animateCharacter();
  }

  const filtered = LEVELS[level].filter(
    (w) =>
      w.h.includes(filter) ||
      w.p.toLowerCase().includes(filter.toLowerCase()) ||
      meaning(w).toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Luyện viết chữ Hán</h1>
          <p className="text-sm text-stone-500 mt-1">
            Xem thứ tự nét rồi tự viết theo — viết sai nét sẽ được nhắc lại.
          </p>
        </div>
        <LevelPicker level={level} onChange={setLevel} />
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-8">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white p-2 shadow-sm">
            <div ref={boxRef} className="w-[280px] h-[280px]" />
          </div>
          <div className="space-y-2 min-w-44">
            <p className="font-hanzi text-3xl">{word.h}</p>
            <p className="text-stone-600 dark:text-stone-400">
              {word.p} — {meaning(word)}
            </p>
            {chars.length > 1 && (
              <div className="flex gap-1 flex-wrap">
                {chars.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setCharIdx(i)}
                    className={`font-hanzi text-xl w-10 h-10 rounded-lg border transition-colors ${
                      i === charIdx
                        ? "border-red-500 bg-red-50 dark:bg-red-950 text-red-600"
                        : "border-stone-200 dark:border-stone-700 hover:border-red-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={showDemo}
                className="px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                ▶ Xem thứ tự nét
              </button>
              <button
                onClick={startQuiz}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                ✍️ Luyện viết
              </button>
              <button
                onClick={() => speak(word.h)}
                className="px-4 py-2 rounded-full border border-stone-300 dark:border-stone-700 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                🔊 Nghe phát âm
              </button>
            </div>
            {status === "quiz" && (
              <p className="text-sm text-amber-600">Hãy viết từng nét theo đúng thứ tự...</p>
            )}
            {status === "done" && (
              <p className="text-sm text-green-600 font-medium">🎉 Tuyệt vời! Viết đúng cả chữ!</p>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Tìm từ (chữ, pinyin, nghĩa)..."
            className="w-full rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2 text-sm outline-none focus:border-red-400"
          />
          <div className="max-h-[480px] overflow-y-auto rounded-2xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900">
            {filtered.slice(0, 200).map((w) => (
              <button
                key={w.h + w.p}
                onClick={() => {
                  setWord(w);
                  setCharIdx(0);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors ${
                  w.h === word.h ? "bg-red-50 dark:bg-red-950" : ""
                }`}
              >
                <span className="font-hanzi text-lg mr-2">{w.h}</span>
                <span className="text-stone-500">
                  {w.p} — {meaning(w)}
                </span>
              </button>
            ))}
            {filtered.length > 200 && (
              <p className="px-4 py-2.5 text-xs text-stone-400">
                ... và {filtered.length - 200} từ nữa — gõ để tìm nhanh hơn
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
