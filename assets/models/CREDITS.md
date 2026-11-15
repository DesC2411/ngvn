# Nguồn mô hình 3D

Tất cả mô hình dùng trong thế giới 3D đều là **CC0 1.0 (Creative Commons Zero – public domain)**, tác giả **Kenney** (www.kenney.nl) và **Quaternius** (quaternius.com).
Mỗi gói có file `License.txt` ghi rõ: *"License: (Creative Commons Zero, CC0) http://creativecommons.org/publicdomain/zero/1.0/ — You can use this content for personal, educational, and commercial purposes."* (ghi công không bắt buộc, vẫn ghi để cảm ơn tác giả).

Tải ngày 13/11/2026 từ trang OpenGameArt của Kenney (bản gốc giống hệt bản trên kenney.nl). Gói gốc + License.txt để ở `assets/models/_downloads/<gói>/`. File dùng thật nằm ở `client/public/models/<nhóm>/` (giữ nguyên tên file gốc; texture `Textures/colormap.png` đi kèm từng nhóm).

| Gói (phiên bản) | Tác giả | Link | Giấy phép | Dùng cho | Thư mục |
|---|---|---|---|---|---|
| Mini Characters (2.0) | Kenney | https://kenney.nl/assets/mini-characters-1 · https://opengameart.org/content/mini-character-1 | CC0 | Nhân vật học sinh (character-male-e/f, character-female-e/f – có sẵn hoạt ảnh idle/walk/sprint…), tượng "Thần Điểm 10" (character-male-b mạ vàng) | `characters/` |
| Nature Kit (2.1) | Kenney | https://kenney.nl/assets/nature-kit · https://opengameart.org/content/nature-kit | CC0 | 28 cây Vườn Tri Ân + cây nền (bản `_fall` mùa thu), bụi, hoa, cỏ, đá bờ hồ, lá súng, cầu gỗ, bệ đá | `nature/` |
| Fantasy Town Kit (2.0) | Kenney | https://kenney.nl/assets/fantasy-town-kit · https://opengameart.org/content/fantasy-town-kit | CC0 | Mái miếu, cột gỗ, bậc đá, ván gỗ (mặt sau biển), hàng rào bụi cây, đèn | `town/` |
| Graveyard Kit (5.0) | Kenney | https://kenney.nl/assets/graveyard-kit · https://opengameart.org/content/graveyard-kit | CC0 | Trụ cổng, hàng rào sắt, bàn thờ đá, lư hương (urn), nến, đèn lồng, cột đèn, ghế | `graveyard/` |
| Holiday Kit | Kenney | https://kenney.nl/assets/holiday-kit · https://opengameart.org/content/holiday-kit | CC0 | Dây đèn màu, đèn lồng treo, sàn gỗ sân khấu, hộp quà đỏ (hòm "Lời chưa nói"), ghế công viên | `holiday/` |
| Modular Buildings | Kenney | https://kenney.nl/assets/modular-buildings · https://opengameart.org/content/modular-buildings | CC0 | Dãy lớp học (ghép mô-đun tường cửa sổ/cửa ra vào/mái) | `buildings/` |
| Stylized Nature MegaKit (bản Standard, miễn phí) | Quaternius | https://quaternius.com/packs/stylizednaturemegakit.html · https://opengameart.org/content/stylized-nature-megakit | CC0 (License_Standard.txt) | 28 cây Vườn Tri Ân (CommonTree_2–5, tô màu thu), 2 Đại Thụ (Pine_1, CommonTree_3 phóng to), bụi hoa dưới gốc (Bush_Common_Flowers). Texture thu nhỏ còn 256–512 px, bỏ normal map | `quaternius/` |
| City Kit (Commercial) (2.1) | Kenney | https://kenney.nl/assets/city-kit-commercial · https://opengameart.org/content/city-kit-commercial | CC0 | Nhà phố xa làm phông nền | `city/` |

Các gói đã tải nhưng chưa dùng (vẫn CC0, để trong `_downloads`): City Kit Suburban, Furniture Kit.

## Phần tự làm bằng code (không phải mô hình tải về)
- Hạc giấy: đa giác phẳng kiểu origami (`client/src/world/lake.js`).
- Chi tiết phụ: mặt hồ (shader gợn sóng), lối đi lát gạch, cột cờ, khăn quàng/viền cổ trên nhân vật, quả châu, phong bì, bông hoa trên cây, lá rơi, pháo hoa.
- Chữ trên biển/băng rôn/bảng: CanvasTexture; logo lấy từ `client/public/brand/logo-round.png`.

Tổng dung lượng `client/public/models`: khoảng **4,3 MB** (Kenney ~2,4 MB + Quaternius ~1,9 MB; nhân vật chỉ tải mô hình nào cần).
