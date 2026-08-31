import type { MetadataRoute } from "next";

// PWA manifest — cho phép cài app lên màn hình chính, mở toàn màn hình như app gốc
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Học Tiếng Hoa - HSK1-6",
    short_name: "Học Tiếng Hoa",
    description:
      "Ứng dụng tự học tiếng Trung: flashcard HSK, luyện viết chữ Hán, trắc nghiệm và kho tài liệu",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fafaf9",
    theme_color: "#dc2626",
    lang: "vi",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
