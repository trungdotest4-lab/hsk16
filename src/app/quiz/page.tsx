"use client";

import { useEffect, useState } from "react";
import { LEVELS, meaning, wordKey, type Word } from "@/data/hsk";
import { LevelPicker, useLevel } from "@/components/LevelPicker";
import { initTTS, speak } from "@/lib/tts";
import { recordCorrect, recordMistake } from "@/lib/mistakes";

type Mode = "nghia" | "chu" | "nghe";
type Question = { word: Word; choices: Word[] };

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "nghia", label: "Chọn nghĩa", desc: "Nhìn chữ Hán → chọn nghĩa đúng" },
  { id: "chu", label: "Chọn chữ", desc: "Đọc nghĩa → chọn chữ Hán" },
  { id: "nghe", label: "Luyện nghe", desc: "Nghe phát âm → chọn chữ đúng" },
];

const NUM_QUESTIONS = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestions(level: number): Question[] {
  const words = LEVELS[level];
  return shuffle(words)
    .slice(0, NUM_QUESTIONS)
    .map((word) => {
      const wrong = shuffle(words.filter((w) => w.h !== word.h)).slice(0, 3);
      return { word, choices: shuffle([word, ...wrong]) };
    });
}

export default function Quiz() {
  const [level, setLevel] = useLevel();
  const [mode, setMode] = useState<Mode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [ttsWarning, setTtsWarning] = useState(false);

  function start(m: Mode) {
    setMode(m);
    setQuestions(makeQuestions(level));
    setIdx(0);
    setScore(0);
    setPicked(null);
  }

  const q = questions[idx];

  // Nạp giọng đọc sớm + mở khóa phát âm trên mobile
  useEffect(() => {
    initTTS();
  }, []);

  // Tự phát âm khi sang câu mới ở chế độ nghe (kể cả khi "Làm lại" với bộ câu hỏi mới)
  useEffect(() => {
    if (mode === "nghe" && q && picked === null) speak(q.word.h, () => setTtsWarning(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, idx, questions]);

  function pick(w: Word) {
    if (picked !== null) return;
    setPicked(w.h);
    const key = wordKey(level, q.word);
    if (w.h === q.word.h) {
      setScore((s) => s + 1);
      recordCorrect(key);
    } else {
      recordMistake(key); // trả lời sai — gom vào sổ từ sai để ôn tập trung
    }
  }

  if (!mode) {
    return (
      <div className="max-w-md mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Trắc nghiệm</h1>
          <LevelPicker level={level} onChange={setLevel} />
        </div>
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => start(m.id)}
            className="w-full text-left rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 hover:border-red-300 dark:hover:border-red-800 hover:shadow-md transition-all"
          >
            <div className="font-semibold">{m.label}</div>
            <div className="text-sm text-stone-500">{m.desc}</div>
          </button>
        ))}
      </div>
    );
  }

  if (idx >= questions.length) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12">
        <p className="font-hanzi text-6xl text-red-600">{pct >= 80 ? "棒!" : "加油!"}</p>
        <h1 className="text-2xl font-bold">
          Kết quả HSK{level}: {score}/{questions.length} câu đúng
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          {pct >= 80
            ? "Xuất sắc! Bạn nắm rất chắc."
            : pct >= 50
              ? "Khá tốt, ôn thêm flashcard nhé!"
              : "Đừng nản — quay lại flashcard ôn thêm rồi thử lại!"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => start(mode)}
            className="px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Làm lại
          </button>
          <button
            onClick={() => setMode(null)}
            className="px-6 py-3 rounded-full border border-stone-300 dark:border-stone-700 font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Đổi chế độ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <h1 className="font-semibold text-lg text-stone-900 dark:text-stone-100">
          {MODES.find((m) => m.id === mode)?.label} · HSK{level}
        </h1>
        <span>
          Câu {idx + 1}/{questions.length} · Đúng: {score}
        </span>
      </div>

      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 text-center min-h-40 flex flex-col items-center justify-center gap-2">
        {mode === "nghia" && (
          <span className={`font-hanzi ${q.word.h.length > 3 ? "text-5xl" : "text-7xl"}`}>
            {q.word.h}
          </span>
        )}
        {mode === "chu" && <span className="text-xl font-medium">{meaning(q.word)}</span>}
        {mode === "nghe" && (
          <button
            onClick={() => speak(q.word.h, () => setTtsWarning(true))}
            className="text-5xl hover:scale-110 transition-transform"
            aria-label="Phát âm lại"
          >
            🔊
          </button>
        )}
      </div>

      {mode === "nghe" && ttsWarning && (
        <p className="text-center text-xs text-amber-600 -mt-3">
          ⚠️ Máy chưa phát được âm thanh. Nếu đang mở link trong Zalo/Messenger/Facebook, hãy
          chọn &quot;Mở bằng Safari/Chrome&quot;. Vẫn không nghe được thì vào Cài đặt máy → Ngôn
          ngữ &amp; giọng đọc để tải giọng tiếng Trung.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3">
        {q.choices.map((c) => {
          const isCorrect = c.h === q.word.h;
          const isPicked = picked === c.h;
          let cls =
            "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-red-300 dark:hover:border-red-800";
          if (picked !== null) {
            if (isCorrect) cls = "border-green-500 bg-green-50 dark:bg-green-950";
            else if (isPicked) cls = "border-red-500 bg-red-50 dark:bg-red-950";
            else cls = "border-stone-200 dark:border-stone-800 opacity-50";
          }
          return (
            <button
              key={c.h + c.p}
              onClick={() => pick(c)}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${cls}`}
            >
              {mode === "nghia" ? (
                <span>{meaning(c)}</span>
              ) : (
                <span className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-hanzi text-2xl">{c.h}</span>
                  {picked !== null && (
                    <span className="text-sm text-stone-500">
                      {c.p} — {meaning(c)}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="text-center">
          <p className="text-sm text-stone-500 mb-3">
            {q.word.h} · {q.word.p} · {meaning(q.word)}
          </p>
          <button
            onClick={() => {
              setPicked(null);
              setIdx((i) => i + 1);
            }}
            className="px-8 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Câu tiếp theo →
          </button>
        </div>
      )}
    </div>
  );
}
