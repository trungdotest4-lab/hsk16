"use client";

import { meaning, type Word } from "@/data/hsk";
import { speak } from "@/lib/tts";

// Thẻ lật dùng chung cho Flashcard và Ôn từ sai — cha component sở hữu
// trạng thái flip + cảnh báo TTS để giữ animation "úp thẻ trước khi đổi từ".
export function FlipCard({
  word,
  flipped,
  onToggleFlip,
  ttsWarning,
  onTtsFail,
}: {
  word: Word;
  flipped: boolean;
  onToggleFlip: () => void;
  ttsWarning: boolean;
  onTtsFail: () => void;
}) {
  return (
    <>
      <div
        className={`flip-card cursor-pointer select-none ${flipped ? "flipped" : ""}`}
        onClick={onToggleFlip}
      >
        <div className="flip-inner relative h-96">
          <div className="flip-face absolute inset-0 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col items-center justify-center gap-4 shadow-sm px-6">
            <span
              className={`font-hanzi text-center ${word.h.length > 3 ? "text-6xl" : "text-8xl"}`}
            >
              {word.h}
            </span>
            <span className="text-xs text-stone-400">Chạm để xem nghĩa</span>
          </div>
          <div className="flip-back flip-face absolute inset-0 rounded-3xl bg-red-600 text-white flex flex-col items-center justify-center gap-2.5 px-6 text-center shadow-sm overflow-y-auto">
            <span className="font-hanzi text-4xl">{word.h}</span>
            <span className="text-xl font-medium">{word.p}</span>
            <span className="text-base opacity-90">{meaning(word)}</span>
            {!word.vi && (
              <span className="text-xs opacity-70">(nghĩa tiếng Anh — sẽ Việt hóa dần)</span>
            )}
            {word.ex && (
              <div className="mt-1.5 pt-2.5 border-t border-white/25 w-full space-y-1">
                <p className="font-hanzi text-lg">{word.ex.h}</p>
                <p className="text-sm opacity-90">{word.ex.p}</p>
                <p className="text-sm opacity-75 italic">{word.ex.vi}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // ở mặt sau có câu ví dụ thì đọc cả câu, chưa lật thì đọc riêng từ
            speak(flipped && word.ex ? word.ex.h : word.h, onTtsFail);
          }}
          className="px-5 py-2 rounded-full border border-stone-300 dark:border-stone-700 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          🔊 {flipped && word.ex ? "Nghe cả câu" : "Nghe phát âm"}
        </button>
      </div>

      {ttsWarning && (
        <p className="text-center text-xs text-amber-600">
          ⚠️ Máy chưa phát được âm thanh. Nếu bạn đang mở link trong Zalo/Messenger/Facebook, hãy
          chọn &quot;Mở bằng Safari/Chrome&quot;. Vẫn không nghe được thì vào Cài đặt máy → Ngôn
          ngữ &amp; giọng đọc để tải giọng tiếng Trung.
        </p>
      )}
    </>
  );
}
