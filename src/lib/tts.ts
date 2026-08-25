// Đọc chữ Hán bằng giọng tiếng Trung có sẵn của trình duyệt
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  const voice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.startsWith("zh"));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
