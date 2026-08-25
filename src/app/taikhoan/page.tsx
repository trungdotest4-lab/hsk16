"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { fullSync } from "@/lib/sync";
import { loadProgress } from "@/lib/srs";

export default function TaiKhoan() {
  const sb = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!sb) {
      setChecked(true);
      return;
    }
    sb.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      setChecked(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        setMsg({
          kind: "ok",
          text: "Đã đăng ký! Nếu Supabase yêu cầu xác nhận email, hãy kiểm tra hộp thư rồi quay lại đăng nhập.",
        });
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await doSync();
        setMsg({ kind: "ok", text: "Đăng nhập thành công, tiến độ đã được đồng bộ!" });
      }
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function doSync() {
    setBusy(true);
    setMsg(null);
    try {
      const merged = await fullSync();
      if (merged) {
        setMsg({
          kind: "ok",
          text: `Đồng bộ xong — ${Object.keys(merged).length} từ đã có tiến độ.`,
        });
      }
    } catch (err) {
      const text = (err as Error).message;
      setMsg({
        kind: "err",
        text: text.includes("progress")
          ? "Chưa tạo bảng dữ liệu trên Supabase. Hãy chạy file supabase/schema.sql trong SQL Editor của dự án (xem hướng dẫn bên dưới)."
          : text,
      });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await sb?.auth.signOut();
    setMsg({ kind: "ok", text: "Đã đăng xuất. Tiến độ vẫn được giữ trên máy này." });
  }

  if (!checked) return null;

  if (!sb) {
    return (
      <div className="max-w-md mx-auto text-center py-12 text-stone-500">
        Chưa cấu hình Supabase (thiếu biến môi trường trong .env.local).
      </div>
    );
  }

  const localCount = typeof window !== "undefined" ? Object.keys(loadProgress()).length : 0;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Tài khoản & đồng bộ</h1>
      <p className="text-sm text-stone-500">
        Đăng nhập để lưu tiến độ học lên đám mây (Supabase) và học tiếp trên thiết bị khác.
        Không đăng nhập thì tiến độ vẫn lưu trên máy này.
      </p>

      {msg && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            msg.kind === "ok"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {user ? (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4">
          <p>
            Đang đăng nhập: <b>{user.email}</b>
          </p>
          <p className="text-sm text-stone-500">
            Tiến độ trên máy này: {localCount} từ đã có dữ liệu ôn tập.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={doSync}
              disabled={busy}
              className="px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {busy ? "Đang đồng bộ..." : "🔄 Đồng bộ ngay"}
            </button>
            <button
              onClick={signOut}
              className="px-5 py-2.5 rounded-full border border-stone-300 dark:border-stone-700 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4"
        >
          <div className="flex gap-2">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  mode === m
                    ? "bg-red-600 border-red-600 text-white"
                    : "border-stone-300 dark:border-stone-700"
                }`}
              >
                {m === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-4 py-2.5 outline-none focus:border-red-400"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-4 py-2.5 outline-none focus:border-red-400"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </button>
        </form>
      )}

      <details className="text-sm text-stone-500">
        <summary className="cursor-pointer font-medium">
          Hướng dẫn tạo bảng dữ liệu trên Supabase (làm 1 lần)
        </summary>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Mở dashboard dự án Supabase → SQL Editor</li>
          <li>
            Dán nội dung file <code>supabase/schema.sql</code> trong thư mục dự án rồi bấm Run
          </li>
          <li>Quay lại đây bấm &quot;Đồng bộ ngay&quot;</li>
        </ol>
      </details>
    </div>
  );
}
