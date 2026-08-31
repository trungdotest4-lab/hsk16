"use client";

import { useEffect } from "react";

// Đăng ký service worker để app cài được lên máy và học được cả khi mất mạng
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // im lặng bỏ qua — không có offline cũng không ảnh hưởng chức năng chính
      });
    }
  }, []);
  return null;
}
