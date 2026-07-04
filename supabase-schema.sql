-- ============================================================
-- AgroPOS – Schema Supabase
-- Dán toàn bộ nội dung này vào: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Bảng lưu dữ liệu app (mỗi "bảng" của app = 1 dòng JSON)
create table if not exists public.app_data (
  key   text primary key,        -- 'products', 'customers', 'invoices', ...
  value jsonb,                    -- nội dung dạng JSON
  updated_at timestamptz default now()
);

-- Tự cập nhật updated_at mỗi khi sửa
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch on public.app_data;
create trigger trg_touch before update on public.app_data
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Bảo mật (RLS)
-- ============================================================
-- Bật Row Level Security
alter table public.app_data enable row level security;

-- ⚠️ CHÍNH SÁCH ĐƠN GIẢN CHO SHOP NHỎ:
-- Cho phép mọi người (anon) đọc/ghi. Đủ dùng cho 1 cửa hàng,
-- nhưng AI KHÁC CÓ KEY cũng sửa được. Nếu cần chặt hơn, hãy
-- bật Supabase Auth và đổi policy theo user.
drop policy if exists "allow anon all" on public.app_data;
create policy "allow anon all" on public.app_data
  for all
  to anon
  using (true)
  with check (true);

-- ============================================================
-- (Tùy chọn) Bảng giữ project khỏi "ngủ đông" sau 7 ngày
-- Dùng kèm GitHub Actions ping mỗi vài ngày (xem HUONG-DAN-DEPLOY.md)
-- ============================================================
create table if not exists public.keepalive (
  id bigint generated always as identity primary key,
  pinged_at timestamptz default now()
);
alter table public.keepalive enable row level security;
drop policy if exists "allow anon keepalive" on public.keepalive;
create policy "allow anon keepalive" on public.keepalive
  for all to anon using (true) with check (true);
