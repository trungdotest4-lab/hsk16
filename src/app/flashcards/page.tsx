"use client";

import { useEffect, useState } from "react";
import { LEVELS, wordKey, type Word } from "@/data/hsk";
import { LevelPicker, useLevel } from "@/components/LevelPicker";
import { FlipCard } from "@/components/FlipCard";
import {
  isDue,
  loadProgress,
  review,
  saveProgress,
  type Progress,
} from "@/lib/srs";
import { pushOne } from "@/lib/sync";
import { initTTS } from "@/lib/tts";
import { recordCorrect, recordMistake } from "@/lib/mistakes";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SESSION_SIZE = 20;

export default function Flashcards() {
  const [level, setLevel] = useLevel();
  const [progress, setProgress] = useState<Progress>({});
  const [queue, setQueue] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState({ known: 0, unknown: 0 });
  const [ready, setReady] = useState(false);
  const [answering, setAnswering] = useState(false); // chặn bấm đúp trong lúc chờ úp thẻ
  const [ttsWarning, setTtsWarning] = useState(false);

  useEffect(() => {
    initTTS(); // nạp giọng đọc sớm + mở khóa phát âm trên mobile
    const p = loadProgress();
    setProgress(p);
    const words = LEVELS[level];
    const due = words.filter((w) => isDue(p, wordKey(level, w)));
    setQueue(shuffle(due).slice(0, SESSION_SIZE));
    setIdx(0);
    setDone({ known: 0, unknown: 0 });
    setFlipped(false);
    setReady(true);
  }, [level]);

  const current = queue[idx];
  const finished = ready && (queue.length === 0 || idx >= queue.length);

  function answer(known: boolean) {
    if (!current || answering) return;
    setAnswering(true);
    const key = wordKey(level, current);
    const p = review(progress, key, known);
    setProgress(p);
    saveProgress(p);
    pushOne(key, p[key].box, p[key].due); // đồng bộ nếu đã đăng nhập
    if (known) recordCorrect(key);
    else recordMistake(key); // gom vào sổ từ sai để ôn tập trung sau này
    setDone((d) => ({
      known: d.known + (known ? 1 : 0),
      unknown: d.unknown + (known ? 0 : 1),
    }));
    setFlipped(false);
    // đợi thẻ úp lại rồi mới chuyển từ để tránh lộ mặt sau
    setTimeout(() => {
      setIdx((i) => i + 1);
      setAnswering(false);
    }, 250);
  }

  function restart() {
    const words = LEVELS[level];
    const due = words.filter((w) => isDue(progress, wordKey(level, w)));
    setQueue(shuffle(due.length > 0 ? due : words).slice(0, SESSION_SIZE));
    setIdx(0);
    setDone({ known: 0, unknown: 0 });
    setFlipped(false);
  }

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-semibold text-lg">Flashcard</h1>
        <LevelPicker level={level} onChange={setLevel} />
      </div>

      {finished ? (
        <div className="text-center space-y-6 py-10">
          <p className="font-hanzi text-6xl text-red-600">好!</p>
          <h2 className="text-2xl font-bold">
            {queue.length === 0
              ? `Không còn từ HSK${level} nào đến hạn ôn!`
              : "Hoàn thành phiên học!"}
          </h2>
          {queue.length > 0 && (
            <p className="text-stone-600 dark:text-stone-400">
              Thuộc: <b className="text-green-600">{done.known}</b> · Chưa thuộc:{" "}
              <b className="text-red-600">{done.unknown}</b>
            </p>
          )}
          <button
            onClick={restart}
            className="px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Học tiếp phiên mới
          </button>
        </div>
      ) : (
        <>
          <div className="text-right text-sm text-stone-500">
            Thẻ {idx + 1}/{queue.length}
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
              Chưa thuộc
            </button>
            <button
              onClick={() => answer(true)}
              className="py-3 rounded-2xl border-2 border-green-200 dark:border-green-900 text-green-600 font-medium hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
            >
              Đã thuộc ✓
            </button>
          </div>

          <p className="text-center text-xs text-stone-400">
            Từ &quot;đã thuộc&quot; sẽ quay lại sau 1 → 3 → 7 → 14 ngày (ôn tập ngắt quãng).
          </p>
        </>
      )}
    </div>
  );
}
