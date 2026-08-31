import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Sans_SC } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans-vn",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const notoSC = Noto_Sans_SC({
  variable: "--font-hanzi",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Học Tiếng Hoa",
  description: "Ứng dụng tự học tiếng Trung: flashcard HSK, luyện viết chữ Hán, trắc nghiệm và kho tài liệu",
};

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/lotrinh", label: "Lộ trình" },
  { href: "/flashcards", label: "Flashcard" },
  { href: "/viet", label: "Luyện viết" },
  { href: "/quiz", label: "Trắc nghiệm" },
  { href: "/tailieu", label: "Tài liệu" },
  { href: "/taikhoan", label: "Tài khoản" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${notoSC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <header className="sticky top-0 z-10 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6 overflow-x-auto">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl font-hanzi text-red-600">学</span>
              <span className="font-semibold whitespace-nowrap">Học Tiếng Hoa</span>
            </Link>
            <nav className="flex gap-1 text-sm">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300 transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 dark:border-stone-800 py-4 text-center text-xs text-stone-500">
          加油！Cố lên! — Ứng dụng tự học tiếng Trung
        </footer>
      </body>
    </html>
  );
}
