# Chuyển dự án sang máy khác để làm tiếp

## 1. Cài trên máy mới

| Cần | Ghi chú |
|---|---|
| Node.js **22 LTS hoặc 24** | Máy cũ dùng Node 24.22. Tối thiểu Node 20. |
| Git | Để clone và đẩy code. |
| Trình duyệt Chrome/Edge | Để chạy thử. |
| Claude Code (tuỳ chọn) | Mở thư mục dự án là Claude đọc `CLAUDE.md` và `docs/CONTRACT.md`, nắm được toàn bộ bối cảnh. |

## 2. Lấy code về và chạy

```bash
git clone https://github.com/DesC2411/ngvn.git may-academy-2011
cd may-academy-2011
npm ci
cp .env.example .env      # Windows PowerShell: copy .env.example .env
```

Mở `.env`, điền `ADMIN_KEY=` (mật khẩu trang quản trị). Rồi:

```bash
npm run dev
```

- Game: http://localhost:8820
- Quản trị: http://localhost:8820/admin.html
- Trang thầy cô: lấy link trong trang quản trị (mục thầy cô)
- Sổ Tri Ân: http://localhost:8820/book.html?teacher=t01
- Tự kiểm thử server (khi server đang chạy): `node server/selftest.js`

Lần đầu chạy, server tự tạo `data/db/` trống và nạp 45 lời chúc sẵn cho mỗi cây đại thụ.

## 3. Những thứ KHÔNG có trên GitHub (phải tự chép)

| Thư mục/file | Là gì | Không chép thì sao |
|---|---|---|
| `.env` | Mật khẩu quản trị, cổng | Tạo lại từ `.env.example` |
| `data/db/` | Thiệp, hạc, chữ ký, vía, lời chưa nói, **mã link thầy cô** | Mất dữ liệu đã gửi; link thầy cô cũ hết dùng được, phải cấp lại |
| `data/uploads/` | Ảnh vẽ tay trong thiệp | Thiệp mất hình vẽ |
| `assets/models/_downloads/` | Gói mô hình gốc (388 MB) | Không sao: mô hình dùng thật đã nằm trong `client/public/models` |
| `node_modules/`, `dist/` | Thư viện và bản build | `npm ci` và `npm run build` tạo lại |

Muốn mang dữ liệu thật sang: **tắt server ở máy cũ**, chép nguyên `data/db/` và `data/uploads/` sang đúng chỗ ở máy mới rồi mới bật server.

## 4. Bản đồ mã nguồn

```
CLAUDE.md                 luật chung, danh sách thầy cô, tính năng đã duyệt, trạng thái
docs/CONTRACT.md          API, WebSocket, chữ ký hàm giữa các phần
deploy/YEU_CAU_VPS.md     cấu hình VPS cần + cách đưa lên
data/teachers.json        28 thầy cô + 2 đại thụ (đổi người/tên cây chỉ sửa file này)
data/config.json          ngày lễ, giờ khoá nhận thiệp, danh sách môn, lớp
data/seed/                lời chúc sẵn cho đại thụ (make_daithu.cjs sinh daithu.json)
server/                   Express + WebSocket, lưu JSON trong data/db
client/src/world/         thế giới 3D (Three.js): khuôn viên, vườn, hồ, trường thật, nhân vật
client/src/ui/            giao diện: đăng nhập, làm thiệp, các bảng hoạt động, chế độ thầy cô
client/src/admin/         trang quản trị, trang thầy cô, Sổ Tri Ân
client/public/            mô hình GLB, logo
assets/                   logo gốc, danh sách gốc, ghi nguồn mô hình (CREDITS.md)
```

## 5. Làm tiếp ở đâu

Xem mục "Trạng thái" và "Còn thiếu từ chủ dự án" cuối `CLAUDE.md`. Việc lớn còn lại: đưa lên VPS (`deploy/YEU_CAU_VPS.md`) và thử trên điện thoại thật.
