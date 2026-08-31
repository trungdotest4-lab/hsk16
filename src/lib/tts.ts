// Đọc chữ Hán bằng giọng tiếng Trung có sẵn của trình duyệt.
// Hỗ trợ cả mobile: giọng nói tải bất đồng bộ (voiceschanged), iOS cần
// "mở khóa" bằng thao tác chạm đầu tiên và hay tự pause speechSynthesis.

let voices: SpeechSynthesisVoice[] = [];
let unlocked = false;
let listenersReady = false;

function loadVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  voices = window.speechSynthesis.getVoices();
}

// iOS Safari chỉ cho phát âm sau khi đã speak() trong một thao tác chạm.
// Phát một câu rỗng ngay lần chạm đầu tiên để mở khóa cho các lần sau.
function unlock() {
  if (unlocked || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance("");
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

function ensureListeners() {
  if (listenersReady || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  listenersReady = true;
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  // dùng capture + once cho lần tương tác đầu tiên bất kỳ
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

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  ensureListeners();
  const synth = window.speechSynthesis;
  synth.cancel();
  // iOS/Chrome đôi khi ở trạng thái paused khiến speak() im lặng
  if (synth.paused) synth.resume();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  const voice = pickChineseVoice();
  if (voice) u.voice = voice;
  // Chrome Android có lúc nuốt lệnh speak gọi ngay sau cancel — trễ 1 nhịp
  setTimeout(() => {
    if (synth.paused) synth.resume();
    synth.speak(u);
  }, 0);
}

// Gọi sớm từ các trang có nút phát âm để kịp nạp giọng + gắn unlock
export function initTTS() {
  ensureListeners();
}
