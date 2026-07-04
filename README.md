# AgroPOS – Phân Bón Xanh Việt

## Cách chạy localhost với hot reload

### Yêu cầu
- Node.js (tải tại https://nodejs.org)

### Chạy server
```bash
cd phanbon-v2
node server.js
```

Mở trình duyệt: **http://localhost:3000**

### Hot reload
Mỗi lần sửa file `AgroPOS_v2.html` và **Lưu (Ctrl+S)**, trình duyệt tự reload sau ~0.5s.
Không cần nhấn F5.

### Cấu trúc project
```
phanbon-v2/
├── AgroPOS_v2.html   ← Toàn bộ app (HTML + CSS + JS)
├── server.js         ← Dev server với hot reload
└── README.md
```
