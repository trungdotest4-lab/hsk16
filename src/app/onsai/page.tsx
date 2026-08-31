"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LEVELS, type Word } from "@/data/hsk";
import { FlipCard } from "@/components/FlipCard";
import { loadProgress, review, saveProgress, type Progress } from "@/lib/srs";
import { pushOne } from "@/lib/sync";
import { initTTS } from "@/lib/tts";
import { loadMistakes, recordCorrect, recordMistake, sortedMistakeKeys } from "@/lib/mistakes";

type Entry = { key: string; level: number; word: Word; count: number };

const SESSION_SIZE = 20;

// Ghép khóa "cấpđộ:chữ" trong sổ từ sai trở lại thành từ thật
function resolveEntries(): Entry[] {
  const m = loadMistakes();
  const out: Entry[] = [];
  for (const key of sortedMistakeKeys(m)) {
    const [levelStr, ...rest] = key.split(":");
    const level = Number(levelStr);
    const hanzi = rest.join(":");
    const word = LEVELS[level]?.find((w) => w.h === hanzi);
    if (word) out.push({ key, level, word, count: m[key].count });
  }
  return out;
}

export default function OnSai() {
  const [progress, setProgress] = useState<Progress>({});
  const [queue, setQueue] = useState<Entry[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState({ known: 0, unknown: 0 });
  const [ready, setReady] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [ttsWarning, setTtsWarning] = useState(false);
  const [totalInBook, setTotalInBook] = useState(0);

  function loadSession() {
    const entries = resolveEntries();
    setTotalInBook(entries.length);
    setQueue(entries.slice(0, SESSION_SIZE));
    setIdx(0);
    setDone({ known: 0, unknown: 0 });
    setFlipped(false);
  }

  useEffect(() => {
    initTTS();
    setProgress(loadProgress());
    loadSession();
    setReady(true);
  }, []);

  const current = queue[idx]?.word;
  const finished = ready && (queue.length === 0 || idx >= queue.length);

  function answer(known: boolean) {
    const entry = queue[idx];
    if (!entry || answering) return;
    setAnswering(true);
    // vẫn cập nhật SRS bình thường — đây chỉ là một phiên flashcard được lọc riêng
    const p = review(progress, entry.key, known);
    setProgress(p);
    saveProgress(p);
    pushOne(entry.key, p[entry.key].box, p[entry.key].due);
    if (known) recordCorrect(entry.key);
    else recordMistake(entry.key);
    setDone((d) => ({
      known: d.known + (known ? 1 : 0),
      unknown: d.unknown + (known ? 0 : 1),
    }));
    setFlipped(false);
    setTimeout(() => {
      setIdx((i) => i + 1);
      setAnswering(false);
    }, 250);
  }

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-semibold text-lg">Sổ từ sai</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Những từ bạn hay trả lời sai ở Flashcard &amp; Trắc nghiệm
          </p>
        </div>
        <Link
          href="/lotrinh"
          className="text-sm px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          ← Tổng quan
        </Link>
      </div>

      {finished ? (
        <div className="text-center space-y-6 py-10">
          {totalInBook === 0 ? (
            <>
              <p className="font-hanzi text-6xl text-green-600">好!</p>
              <h2 className="text-2xl font-bold">Sổ từ sai đang trống!</h2>
              <p className="text-stone-600 dark:text-stone-400">
                Không có từ nào đang khiến bạn khó nhớ. Cứ tiếp tục học nhé, từ sai (nếu có) sẽ tự
                gom về đây.
              </p>
              <Link
                href="/flashcards"
                className="inline-block px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Học Flashcard
              </Link>
            </>
          ) : (
            <>
              <p className="font-hanzi text-6xl text-red-600">好!</p>
              <h2 className="text-2xl font-bold">Đã ôn xong phiên này!</h2>
              <p className="text-stone-600 dark:text-stone-400">
                Thuộc: <b className="text-green-600">{done.known}</b> · Vẫn sai:{" "}
                <b className="text-red-600">{done.unknown}</b>
              </p>
              <button
                onClick={loadSession}
                className="px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Kiểm tra lại sổ từ sai
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>
              Thẻ {idx + 1}/{queue.length}
            </span>
            <span>
              HSK{queue[idx].level} · sai <b className="text-amber-600">{queue[idx].count}</b> lần
            </span>
          </div>

          <FlipCard
            word={current}
            flipped={flipped}
            onToggleFlip={() => setFlipped((f) => !f)}
            ttsWarning={ttsWarning}
            onTtsFail={() => setTtsWarning(true)}
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => answer(false)}
              className="py-3 rounded-2xl border-2 border-red-200 dark:border-red-900 text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Vẫn chưa thuộc
            </button>
            <button
              onClick={() => answer(true)}
              className="py-3 rounded-2xl border-2 border-green-200 dark:border-green-900 text-green-600 font-medium hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
            >
              Đã thuộc ✓
            </button>
          </div>

          <p className="text-center text-xs text-stone-400">
            Trả lời &quot;Đã thuộc&quot; vài lần liên tiếp, từ sẽ tự rời khỏi sổ từ sai.
          </p>
        </>
      )}
    </div>
  );
}
