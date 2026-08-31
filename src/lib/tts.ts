// Đọc chữ Hán bằng giọng tiếng Trung có sẵn của trình duyệt.
// Lưu ý quan trọng cho mobile: speak() PHẢI được gọi đồng bộ, ngay trong
// tay cầm sự kiện chạm/click của người dùng — chỉ cần trễ 1 nhịp qua
// setTimeout/Promise là Safari/Chrome trên điện thoại sẽ coi đây không
// còn là "thao tác của người dùng" và âm thầm chặn, không báo lỗi gì cả.

let voices: SpeechSynthesisVoice[] = [];
let unlocked = false;
let listenersReady = false;

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function loadVoices() {
  if (!isTTSSupported()) return;
  voices = window.speechSynthesis.getVoices();
}

// iOS Safari chỉ cho phát âm sau khi đã speak() trong một thao tác chạm.
// Phát một câu rỗng ngay lần chạm đầu tiên để mở khóa cho các lần sau.
function unlock() {
  if (unlocked || !isTTSSupported()) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

function ensureListeners() {
  if (listenersReady || !isTTSSupported()) return;
  listenersReady = true;
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  // dùng capture + once cho lần tương tác đầu tiên bất kỳ trên trang
  window.addEventListener("touchend", unlock, { once: true, capture: true });
  window.addEventListener("click", unlock, { once: true, capture: true });
}

function pickChineseVoice(): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) loadVoices();
  // ưu tiên zh-CN, sau đó bất kỳ giọng zh nào
  return (
    voices.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith("zh-cn")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("zh"))
  );
}

/**
 * Phát âm một chữ/từ tiếng Trung.
 * @param onFail gọi lại nếu phát âm chắc chắn thất bại (không hỗ trợ, lỗi
 *   thật, hoặc sau ~1.2s vẫn không thấy bắt đầu phát — dấu hiệu máy không
 *   có giọng đọc tiếng Trung). Dùng để hiển thị gợi ý cho người dùng.
 */
export function speak(text: string, onFail?: () => void) {
  if (!isTTSSupported()) {
    onFail?.();
    return;
  }
  ensureListeners();
  const synth = window.speechSynthesis;
  // chỉ hủy khi thực sự đang phát — gọi cancel() lúc đang rảnh có thể khiến
  // vài bản Chrome Android bị treo hàng đợi, lần speak() kế tiếp không kêu
  if (synth.speaking || synth.pending) synth.cancel();
  if (synth.paused) synth.resume();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  const voice = pickChineseVoice();
  if (voice) u.voice = voice;

  let settled = false;
  u.onstart = () => {
    settled = true;
  };
  u.onerror = (ev) => {
    settled = true;
    // "interrupted"/"canceled" là bình thường khi người dùng bấm nhanh liên tiếp
    if (ev.error === "interrupted" || ev.error === "canceled") return;
    onFail?.();
  };

  // QUAN TRỌNG: gọi speak() đồng bộ ngay tại đây, không setTimeout/Promise —
  // nếu không sẽ mất "user gesture" và bị chặn im lặng trên iOS Safari.
  synth.speak(u);

  if (onFail) {
    setTimeout(() => {
      if (!settled) onFail();
    }, 1200);
  }
}

// Gọi sớm từ các trang có nút phát âm để kịp nạp giọng + gắn unlock
export function initTTS() {
  ensureListeners();
}
