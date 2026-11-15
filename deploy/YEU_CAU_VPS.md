# VPS cần gì để chạy May Academy

Đo ngày 15/11/2026 trên bản production (`npm start`), giả lập 300 học sinh cùng đi lại, đứng gần nhau (trường hợp nặng nhất).

## 1. Số đo

| Thứ | Kết quả |
|---|---|
| RAM server lúc rảnh | ~72 MB |
| RAM server với 300 người | ~140 MB |
| CPU với 300 người | ~30% một nhân i5-14400F → trên VPS (nhân chậm hơn) ước 60–90% của 1 vCPU |
| Tải trang lần đầu mỗi học sinh | ~6 MB (bản build `dist/`, đã nén gzip khi gửi) |
| Mạng nhiều người chơi, mỗi học sinh nhận | ~36 KB/giây (≈ 130 MB mỗi giờ chơi) |
| Tổng mạng ra với 300 người | ~88 Mbit/giây |
| Ổ cứng | Code + build ~15 MB; dữ liệu thiệp/ảnh vẽ vài trăm MB là cùng |
| Giới hạn trong code | Tối đa 300 kết nối nhiều người chơi (`server/ws.js`, `MAX_CONN`) |

**Nút thắt là băng thông, không phải CPU hay RAM.**

## 2. Cấu hình đề xuất

| | Tối thiểu (≤ 100 em cùng lúc) | Khuyến nghị (đến 300 em cùng lúc) |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Ổ | 10 GB | 20 GB |
| Cổng mạng | 100 Mbit/s | ≥ 200 Mbit/s, không giới hạn lưu lượng hoặc ≥ 1 TB/tháng |
| Hệ điều hành | Ubuntu 22.04 / 24.04 (hoặc Debian 12) | như bên trái |
| Vị trí | Máy chủ ở Việt Nam (ping thấp cho học sinh) | như bên trái |

Bắt buộc thêm:
- **Tên miền + HTTPS** (Let's Encrypt). Không có HTTPS thì nhiều trình duyệt điện thoại chặn một số tính năng, và WebSocket phải đi qua `wss://`.
- Mở cổng 80 và 443.
- Node.js 22 LTS trở lên.

VPS đang chạy dịch vụ khác vẫn được, miễn còn trống ~300 MB RAM và băng thông đủ như trên.

## 3. Cách đưa lên (khung chung, làm thật sau khi xem VPS)

Theo `CLAUDE.md` mục 7: phải xem VPS trước (hệ điều hành, RAM, cổng đang dùng, đã có nginx/PM2 chưa) rồi mới cài.

```bash
# trên VPS
git clone https://github.com/DesC2411/ngvn.git /opt/may-academy
cd /opt/may-academy
npm ci
npm run build
cp .env.example .env    # điền ADMIN_KEY (mật khẩu dài, ngẫu nhiên), TRUST_PROXY=loopback, NODE_ENV=production
npm i -g pm2
pm2 start "npm start" --name may-academy
pm2 save && pm2 startup
```

nginx (cùng máy, phía trước Node):

```nginx
server {
    server_name tri-an.ten-mien-cua-truong.vn;
    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:8820;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

Rồi `certbot --nginx -d tri-an.ten-mien-cua-truong.vn` để có HTTPS.

Sao lưu: chép `data/db/` và `data/uploads/` mỗi tối (ví dụ cron + `tar`), nhất là tối 19/11 trước khi xuất Sổ Tri Ân.

## 4. Nếu băng thông không đủ

Có thể giảm mạng nhiều người chơi mà không đổi cách chơi: gửi 5 lần/giây thay vì 10, làm tròn toạ độ, chỉ gửi 15–20 người gần nhất. Ước giảm còn khoảng 1/4 (~9 KB/giây mỗi em). Chưa làm, chờ chủ dự án đồng ý.
