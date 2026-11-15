# May Academy – Mùa Tri Ân 20/11

Website game 3D chạy trên trình duyệt để học sinh trường **May Academy** (MN – TH – THCS – THPT) tri ân thầy cô nhân ngày Nhà giáo Việt Nam 20/11/2026.

- **Hạn chót:** chạy ổn định cho toàn trường trước **18/11/2026**, trình chiếu/in quà ngày **20/11/2026**.
- **Ngôn ngữ:** giao diện và nội dung đều tiếng Việt. Trao đổi với chủ dự án bằng tiếng Việt.
- **Nguồn duyệt:** `C:\Users\Admin\Desktop\demo2011.docx` (13/11/2026). Mọi thứ trong file này đã được chủ dự án duyệt; thứ gì không có ở đây thì **hỏi trước khi làm**.

---

## 1. Nhận diện thương hiệu

| Thứ | Giá trị |
|---|---|
| Logo | `assets/brand/logo-may-academy.png` (1920×1920, nền trắng) |
| Xanh navy (chủ đạo) | `#0F2247` |
| Cam (nhấn) | `#E9973B` |
| Phụ | trắng `#FFFFFF`, vàng thu cho lá rơi/ánh nắng |

- Logo xuất hiện ở: màn hình vào game, biển cổng trường, cờ/băng rôn sân trường, khung ảnh kỷ niệm, bìa Sổ Tri Ân.
- Cần bản logo nền trong suốt cho texture 3D → tách nền trắng khi build (giữ file gốc).

## 2. Danh sách thầy cô (28 người = 28 cây)

Nguồn: bảng trong docx (`assets/brand/danh-sach-cac-co.jpeg`) + danh sách các thầy. Tên cây là **đề xuất của Claude**, chủ dự án có thể đổi. Ảnh chân dung chủ dự án gửi sau → để trống thì dùng ảnh khung mặc định (logo trường), **không** tự vẽ mặt người.

### Các cô (18)

| # | Họ tên | Cấp | Tổ/Bộ phận | Chức danh | Cây |
|---|---|---|---|---|---|
| 1 | Nguyễn Hồng Ngọc | | BGH | CEO | Cây Hải Đăng |
| 2 | Đỗ Hoài Giang | THCS | Ban Giám hiệu | Thành viên | Cây La Bàn |
| 3 | Mai Phương Linh | THCS | Tổ KHCN | Giáo viên | Cây Ngọn Đuốc |
| 4 | Mai Bảo Trinh | THCS | Tổ Tiếng Anh | Tổ trưởng | Cây Cánh Cửa |
| 5 | Nguyễn Thị Thu Huyền | THCS | Tổ Tiếng Anh | Giáo viên | Cây Cánh Diều |
| 6 | Nguyễn Hương Lan | THCS | Tổ Tiếng Anh | Giáo viên | Cây Chân Trời |
| 7 | Nghiêm Hồng Hạnh | THCS | Tổ Toán | Giáo viên | Cây Thước Kẻ |
| 8 | Đặng Thị Thu Hằng | THCS | Tổ Toán | Giáo viên | Cây Ngôi Sao |
| 9 | Nguyễn Bảo Uyên | THCS | Tổ Toán | Giáo viên | Cây Chìa Khoá |
| 10 | Trịnh Thị Thu Hà | THCS | Tổ Ngữ văn – Xã hội | Giáo viên | Cây Mực Tím |
| 11 | Vũ Thị Tươi | THCS | THCS | Giáo viên | Cây Trang Vở |
| 12 | Lê Cẩm Vân | THCS | THCS | Giáo viên | Cây Nét Chữ |
| 13 | Vũ Hải Yến | | Nhân sự | | Cây Cầu Nối |
| 14 | Lê Thu Trang | | Nhân sự | | Cây Bến Đỗ |
| 15 | Nguyễn Thị Thúy | | Giáo vụ | | Cây Giáo Án |
| 16 | Nguyễn Xuân Mai | | Khảo thí | | Cây Ánh Trăng |
| 17 | Khổng Thúy Hằng | | Giám thị | | Cây Trống Trường |
| 18 | Cô Huệ | | Thư viện | | Cây Sách Mở |

### Các thầy (10)

| # | Họ tên | Bộ phận/Môn | Cây |
|---|---|---|---|
| 19 | Nguyễn Phúc Chính | BGH | Cây Lái Đò |
| 20 | Đỗ Đức Thành | *chưa rõ* | Cây Phấn Trắng |
| 21 | Trần Văn Thanh | *chưa rõ* | Cây Ngọn Nến |
| 22 | Nguyễn Đức Thảo | *chưa rõ* | Cây Gieo Hạt |
| 23 | Đào Bá Hiếu | *chưa rõ* | Cây Bục Giảng |
| 24 | Nguyễn Trường Chinh | *chưa rõ* | Cây Bảng Đen |
| 25 | Tô Nhật Linh | *chưa rõ* | Cây Mái Trường |
| 26 | Nguyễn Duy Đảng | *chưa rõ* | Cây Vầng Dương |
| 27 | Trần Thanh Chúc | *chưa rõ* | Cây Áo Trắng |
| 28 | Hoàng Công Đạt | *chưa rõ* | Cây Mùa Thu Vàng |

- Dữ liệu thật để trong `data/teachers.json` (id, họ tên, xưng hô Thầy/Cô, bộ phận, chức danh, tên cây, đường dẫn ảnh). Đổi người/ảnh/tên cây **chỉ sửa file này**, không sửa code.
- Tên hiển thị viết hoa chữ cái đầu (bảng gốc có chỗ viết HOA toàn bộ).

## 3. Bối cảnh 3D

Học sinh vào từ **cổng trường** rồi tự đi trong khuôn viên:

- **Cổng May Academy:** biển tên + logo, băng rôn "Chào mừng ngày Nhà giáo Việt Nam 20/11", đồng hồ đếm ngược.
- **Sân trường (giữa):** cột cờ, sân khấu (dùng làm **Góc chụp ảnh kỷ niệm**), bảng "Lớp tri ân nhiều nhất".
- **Dãy lớp học (phía trên):** trước dãy là **Bảng đen ký tên tập thể**.
- **Vườn Tri Ân (bên trái, mở rộng thành vòng cung):** 28 cây, mỗi cây có biển tên (tên cây + Thầy/Cô …). Chia 2 lối: lối các cô, lối các thầy.
- **Góc Xin Vía (bên phải, phía trên):** miếu nhỏ dễ thương, tượng "Thần Điểm 10".
- **Hồ hạc giấy (bên phải, phía dưới).**
- Không khí: lá vàng rơi, nắng chiều, nhạc nền nhẹ bật/tắt được (chỉ dùng nhạc không bản quyền hoặc tự làm).

## 4. Tính năng đã duyệt

### 4.1 Nhân vật & điều khiển
- Vào game: nhập **tên + lớp**, chọn nhân vật (nam/nữ, đồng phục). Không thu thêm thông tin cá nhân nào khác.
- Máy tính: WASD/mũi tên, Shift chạy, kéo chuột xoay camera, E tương tác.
- Điện thoại: joystick ảo, vuốt xoay camera, nút "Tương tác". **Điện thoại là ưu tiên số 1** (phần lớn học sinh vào bằng điện thoại).
- Đến gần điểm hoạt động → hiện nút hành động.

### 4.2 Vườn Tri Ân – viết thiệp (hoạt động chính)
1. Bấm cây → bảng thông tin: ảnh, tên, bộ phận, số thiệp, lời hồi âm (nếu có).
2. "Viết thiệp": chọn mẫu (4–6 mẫu), viết lời chúc, vẽ tay (bút màu, tẩy), sticker, ký tên hoặc ẩn danh.
3. Gửi → thiệp vào **hàng chờ duyệt** → được duyệt mới thành phong bì/quả châu treo trên cây, ai cũng bấm đọc được.
4. Mốc: 10 thiệp cây ra hoa · 30 thiệp cây phát sáng · 50 thiệp pháo hoa.

### 4.3 Hồ hạc giấy
Gấp hạc + ghi lời cảm ơn ngắn → thả xuống hồ, hạc trôi trên mặt nước. Bộ đếm mục tiêu "1.000 con hạc của cả trường". Lời trên hạc cũng qua duyệt.

### 4.4 Bảng đen ký tên tập thể
Mỗi học sinh ký một chữ ký phấn (vẽ tay hoặc gõ tên) lên tấm bảng lớn. Bảng tự dồn chữ ký, phóng to xem được.

### 4.5 Hộp "Lời chưa nói" – gửi riêng từng thầy cô
- Chọn thầy cô → viết điều chưa dám nói (cảm ơn muộn, xin lỗi…), có thể ẩn danh.
- **Riêng tư:** chỉ đúng thầy cô đó đọc được (qua trang riêng của thầy cô), **không** treo công khai, không hiện trong Sổ Tri Ân nếu thầy cô không muốn.
- Ban tổ chức vẫn lọc nội dung xấu, nhưng không đăng ra ngoài.

### 4.6 Góc chụp ảnh kỷ niệm
Nhân vật đứng trước phông 20/11 trên sân khấu, chọn tư thế/khung (có logo trường) → chụp → tải ảnh về máy.

### 4.7 Đố vui "Bạn hiểu thầy cô bao nhiêu"
- Mỗi thầy cô 2–3 câu vui (câu cửa miệng, sở thích…). **Câu hỏi do thầy cô tự nhập** trên trang riêng hoặc chủ dự án gửi; Claude **không bịa** thông tin về người thật.
- Thầy cô nào chưa có câu hỏi thì ẩn khỏi đố vui.

### 4.8 Thầy cô hồi âm
Mỗi thầy cô có **trang riêng** (link + mã truy cập do quản trị cấp): đọc thiệp, đọc "Lời chưa nói", nhập câu đố, viết một lời hồi âm chung → hiện trên biển cây.

### 4.9 Góc Xin Vía (vui, KHÔNG donate)
- Chủ dự án chốt: **"vào vái xin vía thôi"** → giữ đơn giản: chọn môn → vái (hoạt cảnh chắp tay, khói hương) → nhận vía kèm một câu chúc vui theo môn. Có bộ đếm vía của mình và của cả trường.
- Không hòm công đức, không tiền ảo, không mua bán. Dòng nhỏ: *"Vía để vui, ôn bài mới là chính."*
- Gieo quẻ, gõ mõ, bùa tải về… **chưa duyệt**: hỏi trước nếu muốn thêm.

### 4.10 Duyệt thiệp (bắt buộc)
- Trang quản trị (mật khẩu): hàng chờ thiệp/hạc/lời chưa nói → duyệt, ẩn, xoá; xem theo thầy cô, theo lớp.
- Bộ lọc từ bậy tiếng Việt chặn trước; ảnh vẽ tay luôn qua duyệt.
- Quản trị cấp mã/link trang riêng cho từng thầy cô.

### 4.11 Sổ Tri Ân (PDF)
Gom thiệp **đã duyệt** của từng thầy cô thành một file PDF đẹp (bìa logo + tên cây + ảnh thầy cô, mỗi trang vài thiệp kèm hình vẽ) để in tặng ngày 20/11. Xuất từng người hoặc cả 28 người một lần.

### 4.12 Đếm ngược + bảng "Lớp tri ân nhiều nhất"
Đồng hồ đếm ngược tới 20/11 ở cổng và trên giao diện. Bảng xếp hạng lớp theo số thiệp + hạc + chữ ký đã duyệt.

### 4.13 Nhiều người chơi
- Thấy học sinh khác đi lại trong trường (vị trí + tên + lớp trên đầu), không có chat tự do (tránh phải kiểm duyệt trực tiếp).
- WebSocket, gửi vị trí ~10 lần/giây, chỉ đồng bộ người ở gần; giới hạn số nhân vật hiển thị cùng lúc trên điện thoại.
- Chủ dự án có VPS: **nếu build xong thấy nặng quá thì báo lại** trước khi đưa lên, kèm số liệu (RAM/CPU/băng thông ước tính theo số người).

### Không làm (chưa duyệt)
Bồn hoa tri ân, thả đèn lồng, chế độ trình chiếu màn hình lớn, chat. Muốn thêm thì hỏi.

## 5. Đồ hoạ

- Dùng **mô hình 3D low-poly CC0** (ví dụ Kenney, Quaternius, Poly Pizza bản CC0) cho tòa nhà, cây, nhân vật, đồ vật. **Không** dựng hình chính bằng khối hộp/cầu đơn giản. Chủ dự án chê đồ tự vẽ bằng code nhìn thô.
- Ghi nguồn + giấy phép từng mô hình vào `assets/models/CREDITS.md`. Chỉ nhận CC0 (hoặc giấy phép tương đương cho dùng thoải mái), không lấy mô hình của game có sẵn.
- Ưu tiên nhẹ: gộp/nén GLB (Draco/meshopt), texture ≤ 1024px, giữ tổng tải lần đầu càng nhỏ càng tốt cho điện thoại cấu hình yếu và mạng 4G.
- Ảnh thầy cô chỉ dùng ảnh thật chủ dự án gửi.

## 6. Kỹ thuật (định hướng)

- **Frontend:** Three.js (ES modules), không bắt buộc framework; build bằng Vite.
- **Backend:** Node.js (có sẵn Node 24 trên máy dev) + WebSocket cho nhiều người chơi + SQLite lưu thiệp, hạc, chữ ký, vía, lời chưa nói, hồi âm, câu đố.
- **Ảnh vẽ tay/ảnh thiệp:** lưu file nén (WebP/JPEG, giới hạn dung lượng), không nhét base64 lớn vào DB.
- **Cấu hình:** `data/teachers.json` (danh sách), `.env` (mật khẩu quản trị, cổng, ngày mở/khoá nhận thiệp). Không commit mật khẩu.
- **Chống spam:** giới hạn số thiệp/hạc mỗi người mỗi phút, captcha **không** dùng (học sinh nhỏ tuổi), dựa vào duyệt.
- Cấu trúc thư mục dự kiến:

```
may-academy-2011/
  CLAUDE.md
  assets/brand/        logo, danh sách gốc
  assets/models/       GLB CC0 + CREDITS.md
  assets/teachers/     ảnh chân dung (chủ dự án gửi)
  data/teachers.json
  client/              Three.js + giao diện
  server/              Node: API, WebSocket, SQLite, xuất PDF
  admin/               trang quản trị + trang riêng thầy cô
  deploy/              ghi chú & file cấu hình triển khai
```

## 7. Triển khai lên VPS

**Sau khi build xong, chưa đưa lên ngay.** Làm theo thứ tự:
1. Hỏi chủ dự án cách truy cập VPS (SSH, tài khoản, có tên miền chưa). Không tự đoán, không tự cài lên máy chủ khi chưa được đồng ý.
2. **Xem cấu hình VPS trước:** hệ điều hành, CPU, RAM, ổ trống, băng thông; đã có Node, nginx/Caddy, Docker, PM2 chưa; cổng nào đang dùng (VPS có thể đang chạy dịch vụ khác, không được làm hỏng).
3. Dựa vào cấu hình đó chọn cách tải lên (copy bản build + `npm ci`, hoặc Docker), chạy nền bằng PM2/systemd, đặt sau nginx/Caddy có HTTPS.
4. Ước tính sức chịu tải nhiều người chơi trên VPS đó. Nếu không đủ thì **báo chủ dự án** kèm phương án (giảm số người hiển thị, tắt nhiều người chơi, thuê thêm).
5. Ghi lại từng bước vào `deploy/HUONG_DAN.md` để lần sau làm lại được.
6. Chạy thử với 1 lớp trước khi mở toàn trường.

## 8. Lịch làm (còn 7 ngày)

| Ngày | Việc |
|---|---|
| 13/11 | Chốt nội dung (file này) |
| 14/11 | Tìm mô hình CC0, dựng khuôn viên, nhân vật đi lại, điều khiển điện thoại |
| 15/11 | Vườn Tri Ân 28 cây + viết/vẽ thiệp + server lưu + duyệt |
| 16/11 | Hạc giấy, bảng đen, Xin Vía, Lời chưa nói, chụp ảnh |
| 17/11 | Nhiều người chơi, trang thầy cô (hồi âm, câu đố), đếm ngược, xếp hạng lớp, Sổ Tri Ân PDF |
| 18/11 | Xem VPS → triển khai → thử 1 lớp → mở toàn trường |
| 19/11 | Khoá nhận thiệp buổi tối, xuất & in Sổ Tri Ân |
| 20/11 | Ngày lễ |

### Trạng thái (13/11 tối)
- Bản đầu đủ mục 4 đã ghép và chạy: `npm run dev` → http://localhost:8820 (game), `/admin.html`, `/teacher.html?token=…`, `/book.html?teacher=t01`. Mật khẩu quản trị ở `.env` (ADMIN_KEY).
- Hợp đồng giữa các phần: `docs/CONTRACT.md`. Server tự kiểm thử: `node server/selftest.js`. Trang thử riêng: `/world-test.html`, `/ui-test.html`, thêm `?mock=1` cho admin/teacher/book.
- Mô hình: Kenney CC0 (`assets/models/CREDITS.md`), 2,4 MB trong `client/public/models`. `assets/models/_downloads` (171 MB) chỉ là gói gốc, không đưa lên VPS.
- Giới hạn gửi bài tính theo máy (`x-client-id`) để cả lớp chung wifi không bị chặn; IP chỉ có trần cao.
- 14/11: thầy cô vào chính thế giới 3D qua link `/?teacher=<token>` (CONTRACT mục 6): màn chào, thẻ "Việc của Thầy/Cô", vệt sáng chỉ đường, nút "Đi tới ngay", đọc thiệp ở cây mình, đọc lời chưa nói ở Hòm thư đỏ, hồi âm + câu đố; nhân vật người lớn có huy hiệu vàng. Đã sửa: leo bậc (sân khấu, miếu, hiên, bến hồ), z-fighting bảng chữ, lối vườn rộng 4 m, bến gỗ hồ, camera chui vào tán cây, màn chờ hiện lại khi có bạn chơi mới.
- 14/11 chiều: nhảy (Space/nút Nhảy), thanh hướng dẫn phím đầu trang, bỏ chữ giới thiệu; Xin Vía thành thanh nhỏ + nhân vật quỳ vái trên chiếu (world.startPrayer/endPrayer); trình làm thiệp gần toàn màn hình (14 mẫu, 47 sticker, font/màu/cỡ chữ, ô chữ thêm, 6 loại bút); cây Quaternius CC0 + đèn nháy; **2 Đại thụ** d01 Ông Nguyễn Tiến Phú / d02 Bà Vũ Hải Vân ở sân cuối vườn, 45 lời chúc sẵn/cây từ `data/seed/make_daithu.cjs` (seed không tính xếp hạng, không ký tên). Lưu ý hiệu năng: ~326k tam giác lúc vào game → phải thử điện thoại tầm trung trước 18/11.
- 14/11 tối: thêm con đường ngoài cổng + **Trường MAY thật** bên phải (world/realschool.js, phỏng theo Google Maps Lô 18 KĐT Định Công: chữ U, sân cỏ, sân xanh dương, dãy 4 tầng trắng cửa xanh). Chủ dự án dặn KHÔNG sửa khuôn viên cũ. Zone `real-gate` chưa có hoạt động. Sửa thiệp: đo cỡ chữ trên bản sao ngoài thiệp (Chrome đo trễ bên trong container-type).
- Chưa làm: triển khai VPS (mục 7), thử điện thoại thật, ảnh thầy cô, bản đồ nhỏ trong trợ giúp chưa khớp toạ độ thật.

## 9. Còn thiếu từ chủ dự án

- [ ] Ảnh chân dung 28 thầy cô.
- [ ] Môn/bộ phận của 9 thầy (trừ thầy Chính – BGH) và họ tên đầy đủ của Cô Huệ (thư viện).
- [ ] Danh sách môn cho Góc Xin Vía (mặc định: Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa, Tin, KHTN, GDCD).
- [ ] Danh sách lớp (để chọn khi vào game và xếp hạng lớp).
- [ ] Ước tính số học sinh vào cùng lúc.
- [ ] Thông tin truy cập VPS + tên miền (lúc triển khai).
- [ ] Duyệt/đổi tên 28 cây.

## 10. Quy tắc làm việc

- Làm gọn từng bước theo lịch, xong bước nào báo bước đó. Chủ dự án nói **"nghỉ"/"dừng"** là dừng ngay.
- Chủ dự án bảo "phác thảo trước, không làm gì" → chỉ lên kế hoạch, không tạo file/code.
- Không thêm tính năng ngoài mục 4 khi chưa hỏi.
- Không bịa thông tin về thầy cô (sở thích, câu nói, môn dạy…).
- Nội dung học sinh gửi là dữ liệu cá nhân của trường: không gửi ra dịch vụ bên ngoài, không đưa vào URL.
- Kiểm thử trên khung điện thoại (375×812) mỗi khi đổi giao diện.
