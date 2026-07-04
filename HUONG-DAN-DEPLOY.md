# 🚀 Hướng dẫn deploy AgroPOS (Vercel + Supabase, bản free)

Mục tiêu: **push code 1 lần → web tự cập nhật**, không phải deploy tay.
Dữ liệu lưu trên Supabase → khách (điện thoại) và admin (máy tính) thấy chung dữ liệu.

---

## 📁 Cấu trúc project (giữ nguyên, chỉnh sửa dần)

```
phanbon-v2/
├── index.html                 ← App chính (HTML + CSS + JS)
├── server.js                  ← Server localhost + hot reload
├── package.json
├── vercel.json                ← Cấu hình Vercel
├── supabase-schema.sql        ← SQL tạo bảng (dán vào Supabase)
├── js/
│   └── supabase-sync.js       ← Lớp đồng bộ cloud (điền key ở đây)
└── .github/workflows/
    └── keep-alive.yml         ← Giữ Supabase không "ngủ đông"
```

---

## ① Chạy localhost (làm trước, test cho chắc)

```bash
cd phanbon-v2
node server.js
```
Mở **http://localhost:3000** — sửa file, nhấn **Ctrl+S** → trình duyệt tự reload.

> Lúc này CHƯA cần Supabase. App chạy bằng localStorage (dữ liệu trên 1 máy).

---

## ② Tạo database Supabase (free)

1. Vào **https://supabase.com** → đăng ký → **New project**
   - Đặt tên, chọn region **Southeast Asia (Singapore)** cho gần Việt Nam
   - Đặt mật khẩu database (lưu lại)
2. Đợi ~2 phút để project khởi tạo
3. Vào **SQL Editor** → **New query** → dán toàn bộ nội dung file
   `supabase-schema.sql` → bấm **Run**
4. Vào **Project Settings → API**, copy 2 giá trị:
   - **Project URL** (vd: `https://abcxyz.supabase.co`)
   - **anon public key** (chuỗi dài `eyJ...`)
5. Mở `js/supabase-sync.js`, điền vào 2 dòng đầu:
   ```js
   const SUPABASE_URL = 'https://abcxyz.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```
6. Lưu lại, chạy `node server.js`, mở localhost → mở **Console (F12)**
   thấy dòng `✅ Đã kết nối Supabase cloud` là xong.

> Từ giờ dữ liệu tự đồng bộ lên cloud mỗi khi bán hàng / sửa sản phẩm.

---

## ③ Đưa code lên GitHub

```bash
cd phanbon-v2
git init
git add .
git commit -m "AgroPOS v2"
# Tạo repo trống trên github.com rồi:
git remote add origin https://github.com/<tên-bạn>/agropos.git
git branch -M main
git push -u origin main
```

---

## ④ Kết nối Vercel → tự động deploy

1. Vào **https://vercel.com** → đăng nhập bằng GitHub
2. **Add New → Project** → chọn repo `agropos` → **Deploy**
3. Xong! Vercel cho bạn 1 link dạng `https://agropos.vercel.app`

**Từ giờ mỗi lần bạn `git push`, Vercel TỰ ĐỘNG build & deploy** — không phải làm tay gì nữa. Đây chính là phần "không deploy tay" bạn cần.

```bash
# Quy trình hằng ngày:
# 1. Sửa code, test trên localhost (node server.js)
# 2. Push lên:
git add .
git commit -m "Thêm tính năng X"
git push
# 3. ~30 giây sau web tự cập nhật. Xong.
```

---

## ⑤ Chống Supabase "ngủ đông" (free tier)

Supabase free tạm dừng project sau **7 ngày không hoạt động**.
File `.github/workflows/keep-alive.yml` đã tự ping mỗi 3 ngày. Để bật:

1. Trên GitHub repo → **Settings → Secrets and variables → Actions → New secret**
2. Thêm 2 secret:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_ANON_KEY` = anon key
3. Xong. GitHub tự ping, project không bao giờ ngủ.

---

## ⚠️ Lưu ý quan trọng

- **Vercel Hobby (free) chỉ cho phép phi thương mại.** Shop bán hàng là
  thương mại → đúng luật nên dùng **Cloudflare Pages** hoặc **Netlify**
  (free + cho thương mại, cách kết nối GitHub y hệt). Vercel vẫn chạy được
  nhưng về điều khoản là vùng xám.
- **Bảo mật:** policy hiện tại cho phép bất kỳ ai có anon key đọc/ghi.
  Đủ cho 1 shop nhỏ. Khi cần chặt hơn → bật **Supabase Auth** + đổi policy.
- **Giới hạn free Supabase:** 500MB database, 50.000 người dùng/tháng —
  thừa sức cho 1 cửa hàng.

---

## 🔁 Cách thay nền tảng (nếu chọn Cloudflare/Netlify thay Vercel)

Giống hệt bước ④, chỉ khác trang web:
- **Cloudflare Pages:** dash.cloudflare.com → Pages → Connect to Git
- **Netlify:** app.netlify.com → Add new site → Import from Git

Cả hai đều auto-deploy mỗi lần push, cho phép dùng thương mại.
