"use client";

import { useEffect, useState } from "react";
import { LEVEL_NUMBERS } from "@/data/hsk";

const KEY = "hsk-level";

// Hook cấp độ HSK đang học (1-6), nhớ lựa chọn trong localStorage
export function useLevel(): [number, (n: number) => void] {
  const [level, setLevel] = useState(1);
  useEffect(() => {
    const saved = Number(localStorage.getItem(KEY));
    if (saved >= 1 && saved <= 6) setLevel(saved);
  }, []);
  function change(n: number) {
    setLevel(n);
    localStorage.setItem(KEY, String(n));
  }
  return [level, change];
}

export function LevelPicker({
  level,
  onChange,
}: {
  level: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {LEVEL_NUMBERS.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            n === level
              ? "bg-red-600 border-red-600 text-white"
              : "border-stone-300 dark:border-stone-700 hover:border-red-400"
          }`}
        >
          HSK{n}
        </button>
      ))}
    </div>
  );
}
