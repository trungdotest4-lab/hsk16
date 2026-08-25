"use client";

// Đồng bộ tiến độ học với Supabase (bảng public.progress)
import { getSupabase } from "./supabase";
import {
  loadProgress,
  mergeProgress,
  saveProgress,
  type Progress,
} from "./srs";

type Row = { word: string; box: number; due: number };

// Kéo tiến độ từ server, gộp với local, lưu lại cả hai chiều.
// Trả về tiến độ sau khi gộp, hoặc null nếu chưa đăng nhập / lỗi.
export async function fullSync(): Promise<Progress | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: userData } = await sb.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const { data, error } = await sb
    .from("progress")
    .select("word, box, due")
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  const remote: Progress = {};
  for (const r of (data ?? []) as Row[]) {
    remote[r.word] = { box: r.box, due: Number(r.due) };
  }
  const merged = mergeProgress(loadProgress(), remote);
  saveProgress(merged);
  await pushAll(merged);
  return merged;
}

// Đẩy toàn bộ tiến độ local lên server (upsert theo lô)
export async function pushAll(p?: Progress) {
  const sb = getSupabase();
  if (!sb) return;
  const { data: userData } = await sb.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const prog = p ?? loadProgress();
  const rows = Object.entries(prog).map(([word, st]) => ({
    user_id: user.id,
    word,
    box: st.box,
    due: st.due,
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("progress").upsert(rows.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }
}

// Đẩy một từ vừa ôn (gọi sau mỗi lần trả lời, bỏ qua êm nếu chưa đăng nhập)
export async function pushOne(word: string, box: number, due: number) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data: userData } = await sb.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    await sb.from("progress").upsert({ user_id: user.id, word, box, due });
  } catch {
    // offline hoặc chưa tạo bảng — tiến độ vẫn nằm an toàn trong localStorage
  }
}
