// Service worker tối giản: cho phép học offline vì toàn bộ dữ liệu từ vựng
// và tiến độ (localStorage) đã nằm sẵn trên máy — chỉ cần cache HTML + JS/CSS.
// Tăng số ở CACHE mỗi khi đổi chiến lược cache để buộc dọn cache cũ.
const CACHE = "hsk16-v1";

const APP_SHELL = [
  "/",
  "/lotrinh",
  "/flashcards",
  "/onsai",
  "/quiz",
  "/viet",
  "/tailieu",
  "/taikhoan",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // từng request lỗi (vd offline lúc cài) không được làm hỏng cả batch
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => {}))),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return; // để Supabase/CDN đi thẳng qua mạng

  // Tài nguyên tĩnh có hash (_next/static) là bất biến — cache trước, có thì dùng luôn
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Điều hướng trang: ưu tiên mạng để luôn có bản mới nhất, rơi về cache khi mất mạng
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
    );
    return;
  }

  // Còn lại (ảnh, font...): cache trước rồi mới ra mạng
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
