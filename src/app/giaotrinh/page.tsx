"use client";

import { useEffect, useState } from "react";
import type { Word } from "@/data/hsk";
import { getLessons, hasCoursebook, lessonWordKey, type Lesson, type LessonWord } from "@/data/lessons";
import { LevelPicker, useLevel } from "@/components/LevelPicker";
import { FlipCard } from "@/components/FlipCard";
import { loadProgress, review, saveProgress, type Progress } from "@/lib/srs";
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

// FlipCard nhận kiểu Word (hsk.ts) — chuyển tạm LessonWord sang dạng tương thích
function toWord(lw: LessonWord): Word {
  return { h: lw.h, p: lw.p, en: lw.vi, vi: lw.vi };
}

function countLearned(progress: Progress, level: number, lesson: Lesson): number {
  return lesson.words.filter((w) => {
    const s = progress[lessonWordKey(level, lesson.n, w)];
    return s && s.box > 0;
  }).length;
}

export default function GiaoTrinh() {
  const [level, setLevel] = useLevel();
  const [progress, setProgress] = useState<Progress>({});
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [queue, setQueue] = useState<LessonWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState({ known: 0, unknown: 0 });
  const [answering, setAnswering] = useState(false);
  const [ttsWarning, setTtsWarning] = useState(false);

  useEffect(() => {
    initTTS();
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    setActiveLesson(null);
  }, [level]);

  const lessons = getLessons(level);
  const available = hasCoursebook(level);
  const current = queue[idx];
  const finished = activeLesson && (queue.length === 0 || idx >= queue.length);

  function openLesson(lesson: Lesson) {
    setActiveLesson(lesson);
    setQueue(shuffle(lesson.words));
    setIdx(0);
    setDone({ known: 0, unknown: 0 });
    setFlipped(false);
  }

  function answer(known: boolean) {
    if (!current || !activeLesson || answering) return;
    setAnswering(true);
    const key = lessonWordKey(level, activeLesson.n, current);
    const p = review(progress, key, known);
    setProgress(p);
    saveProgress(p);
    pushOne(key, p[key].box, p[key].due);
    if (known) recordCorrect(key);
    else recordMistake(key);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Học theo giáo trình</h1>
          <p className="text-sm text-stone-500 mt-1">
            Từ vựng thật trích từ sách Giáo trình Hán ngữ — học đúng thứ tự từng bài.
          </p>
        </div>
        <LevelPicker level={level} onChange={setLevel} />
      </div>

      {!available && (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-500">
          <p className="font-hanzi text-4xl mb-3">书</p>
          <p>Chưa có dữ liệu giáo trình cho HSK{level}.</p>
          <p className="text-sm mt-1">Sẽ bổ sung khi có file PDF quyển này.</p>
        </div>
      )}

      {available && !activeLesson && (
        <div className="grid sm:grid-cols-2 gap-3">
          {lessons.map((l) => {
            const learned = countLearned(progress, level, l);
            const pct = Math.round((learned / l.words.length) * 100);
            return (
              <button
                key={l.n}
                onClick={() => openLesson(l)}
                className="text-left rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-red-300 dark:hover:border-red-800 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Bài {l.n}</span>
                  <span className="text-xs text-stone-500">
                    {learned}/{l.words.length} từ
                  </span>
                </div>
                <div className="h-1.5 mt-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeLesson && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-stone-500">
            <button
              onClick={() => setActiveLesson(null)}
              className="hover:text-red-600 transition-colors"
            >
              ← Bài {activeLesson.n}
            </button>
            {!finished && (
              <span>
                Thẻ {idx + 1}/{queue.length}
              </span>
            )}
          </div>

          {finished ? (
            <div className="text-center space-y-6 py-10">
              <p className="font-hanzi text-6xl text-red-600">好!</p>
              <h2 className="text-2xl font-bold">Hoàn thành Bài {activeLesson.n}!</h2>
              <p className="text-stone-600 dark:text-stone-400">
                Thuộc: <b className="text-green-600">{done.known}</b> · Chưa thuộc:{" "}
                <b className="text-red-600">{done.unknown}</b>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => openLesson(activeLesson)}
                  className="px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                >
                  Học lại
                </button>
                <button
                  onClick={() => setActiveLesson(null)}
                  className="px-6 py-3 rounded-full border border-stone-300 dark:border-stone-700 font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Chọn bài khác
                </button>
              </div>
            </div>
          ) : (
            <>
              <FlipCard
                word={toWord(current)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
