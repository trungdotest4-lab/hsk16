-- Bảng lưu tiến độ ôn tập từ vựng (mỗi dòng = 1 từ của 1 người dùng)
-- Chạy file này 1 lần trong Supabase Dashboard -> SQL Editor -> Run
create table if not exists public.progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  word text not null, -- khóa từ dạng "cấpđộ:chữ", ví dụ "1:爱"
  box int not null default 0, -- hộp Leitner 0-4
  due bigint not null default 0, -- timestamp (ms) lần ôn tiếp theo
  updated_at timestamptz not null default now(),
  primary key (user_id, word)
);

alter table public.progress enable row level security;

-- Mỗi người chỉ đọc/ghi được dữ liệu của chính mình
drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
