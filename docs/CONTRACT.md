# Hợp đồng giao tiếp giữa các phần (đọc kỹ trước khi code)

Luật chung của dự án nằm ở `../CLAUDE.md`. File này là **giao diện cố định** giữa 4 phần làm song song. Không đổi tên hàm/endpoint/trường dữ liệu ở đây. Nếu thật sự cần đổi, ghi rõ trong báo cáo cuối để người ghép sửa.

## 0. Phân quyền file (ai sửa gì)

| Phần | Được sửa |
|---|---|
| A. Server | `server/**`, `.env.example` |
| B. Thế giới 3D | `client/src/world/**`, `client/src/net.js`, `client/public/models/**`, `assets/models/**` |
| C. Giao diện học sinh | `client/src/ui/**`, `client/src/styles/**`, `client/public/ui/**` |
| D. Quản trị/Thầy cô/Sổ | `client/admin.html`, `client/teacher.html`, `client/book.html`, `client/src/admin/**` |
| Người ghép (chính) | `client/index.html`, `client/src/main.js`, `client/src/api.js`, `package.json`, `vite.config.js`, `data/**`, `docs/**`, `CLAUDE.md` |

- **Không chạy `npm install`.** Các gói đã có: `three@0.170`, `express@4`, `ws@8`, `compression`, `dotenv`, `cross-env`, `vite@6` (dev). Cần thêm gói thì ghi trong báo cáo, người ghép cài.
- Tiếng Việt có dấu đầy đủ ở mọi chữ hiển thị.
- Màu: navy `#0F2247`, cam `#E9973B`, trắng. Logo: `/brand/logo.png` (1920² nền trắng), `/brand/logo-round.png` (1024², nền trong suốt – dùng cho texture 3D/khung ảnh), `/brand/logo-256.png`.

## 1. Chạy

- `npm run dev` → `node server/index.js` cổng **8820** (biến `PORT`). Ở dev, server gắn Vite middleware (`createServer({ server: { middlewareMode: true }, appType: 'mpa' })`) nên trang + API + WebSocket cùng một cổng.
- Production (`NODE_ENV=production`): server phục vụ `dist/` (đã `vite build`).
- Trang: `/` (game), `/admin.html`, `/teacher.html?token=...`, `/book.html?teacher=t01` (hoặc `teacher=all`).

## 2. Dữ liệu gốc

- `data/teachers.json`: `[{ id:"t01", title:"Cô"|"Thầy", name, level, dept, role, tree, photo }]` (28 người, `photo` rỗng = chưa có ảnh → dùng logo).
- `data/config.json`: `{ schoolName, eventDate, submissionsCloseAt, autoApprove, subjects[], classes[] }`.
- Dữ liệu sinh ra lưu ở `data/db/*.json` + ảnh ở `data/uploads/` (server tự tạo, không commit).

## 3. REST API (JSON, tiền tố `/api`)

Lỗi: HTTP 4xx/5xx với `{ error: "Thông điệp tiếng Việt cho người dùng" }`.
Trạng thái nội dung: `"pending" | "approved" | "hidden"`. Học sinh chỉ thấy `approved`.

### Công khai
| Method | Đường dẫn | Vào | Ra |
|---|---|---|---|
| GET | `/api/state` | – | `{ config, teachers:[TeacherPublic], stats:Stats, cranes:[Crane] (≤300 mới nhất), signatures:[Signature] (≤500) }` |
| GET | `/api/stats` | – | `Stats` |
| GET | `/api/teachers/:id/cards` | – | `[Card]` đã duyệt, mới nhất trước |
| POST | `/api/cards` | `{ teacherId, from, cls, anonymous, message, template, drawing?, stickers? }` | `{ ok:true, id, status }` |
| POST | `/api/cranes` | `{ from, cls, message, color }` | `{ ok:true, id, status }` |
| POST | `/api/signatures` | `{ name, cls, drawing? }` (không có drawing thì hiển thị tên) | `{ ok:true, id, status }` |
| POST | `/api/secrets` | `{ teacherId, from, cls, anonymous, message }` | `{ ok:true, id }` |
| GET | `/api/quiz` | – | `[{ teacherId, questions:[{ id, q, options:[4 chuỗi] }] }]` (không lộ đáp án; chỉ thầy cô có câu hỏi) |
| POST | `/api/quiz/answer` | `{ questionId, choice }` | `{ correct, answer }` |
| POST | `/api/via` | `{ subject }` | `{ subject, mine:null, subjectTotal, total }` |

Kiểu dữ liệu:
```
TeacherPublic = { id, title, name, dept, role, tree, photo, reply: string|null, cardCount, hasQuiz }
Card      = { id, teacherId, from, cls, anonymous, message, template, drawingUrl|null, stickers:[{ id, x, y, s, r }], createdAt }
             // anonymous=true → from = "Một bạn học sinh", cls = ""
Crane     = { id, from, cls, message, color, createdAt }
Signature = { id, name, cls, drawingUrl|null, createdAt }
Stats     = { cards, cranes, signatures, via, viaBySubject:{ [subject]: n }, perTeacher:{ [id]: n },
              leaderboard:[{ cls, score, cards, cranes, signatures }] (top 10), eventDate, submissionsOpen }
```

Giới hạn & kiểm tra (server bắt buộc làm):
- `drawing`: data URL `image/png|jpeg|webp`, ≤ 600 KB sau giải mã. Lưu file, trả `drawingUrl` dạng `/media/<uuid>.<ext>`; `/media/*` chỉ trả ảnh của nội dung **approved** (admin xem được tất cả qua `/api/admin/media/<file>`).
- `message`: thiệp ≤ 600 ký tự, hạc ≤ 120, lời chưa nói ≤ 1000. `from` ≤ 40, `cls` ≤ 12.
- Bộ lọc từ bậy tiếng Việt (có và không dấu, viết tắt phổ biến) → 400 `{ error: "Lời nhắn có từ chưa phù hợp, bạn sửa lại nhé." }`.
- Giới hạn tần suất theo IP: mỗi loại ≤ 5 lần/phút, `/api/via` ≤ 30 lần/phút.
- Sau `submissionsCloseAt` → 403 `{ error: "Đã hết hạn gửi, cảm ơn bạn!" }` (trừ `/api/via`, `/api/quiz/answer`).
- `autoApprove=true` thì cards/cranes/signatures vào thẳng `approved`. Secrets luôn chỉ thầy cô đọc.

### Quản trị (header `x-admin-key: <ADMIN_KEY trong .env>`)
| Method | Đường dẫn | Vào | Ra |
|---|---|---|---|
| GET | `/api/admin/queue?type=cards\|cranes\|signatures\|secrets&status=pending\|approved\|hidden\|all` | – | `[item]` (item gồm mọi trường + `status`, `ip`, `drawingUrl` trỏ `/api/admin/media/...`) |
| POST | `/api/admin/moderate` | `{ type, id, action:"approve"\|"hide"\|"delete" }` | `{ ok:true }` |
| POST | `/api/admin/moderate-bulk` | `{ type, ids:[...], action }` | `{ ok:true, n }` |
| GET | `/api/admin/teachers` | – | `[TeacherPublic + { token, teacherUrl, pendingCards, secrets }]` |
| POST | `/api/admin/teachers/:id/token` | – | `{ token, teacherUrl }` (tạo lại mã) |
| GET | `/api/admin/settings` / POST | `{ autoApprove?, submissionsCloseAt? }` | config hiện tại |
| GET | `/api/admin/book/:teacherId` (`all` = tất cả) | – | `{ teachers:[{ teacher:TeacherPublic, cards:[Card] (approved, drawingUrl dùng /api/admin/media), secrets:[...] chỉ khi thầy cô cho phép }] }` |
| GET | `/api/admin/media/:file` | – | ảnh bất kể trạng thái |
| GET | `/api/admin/export` | – | tải toàn bộ DB dạng JSON |

Admin key cũng nhận qua `?key=` cho `/api/admin/media/*` (để thẻ `<img>` dùng được).

### Thầy cô (header `x-teacher-token: <token>`)
| Method | Đường dẫn | Vào | Ra |
|---|---|---|---|
| GET | `/api/teacher/me` | – | `{ teacher:TeacherPublic, cards:[Card], secrets:[{ id, from, cls, anonymous, message, createdAt }], quiz:[{ id, q, options, answer }], reply, includeSecretsInBook }` |
| POST | `/api/teacher/reply` | `{ text }` (≤ 300) | `{ ok:true }` |
| PUT | `/api/teacher/quiz` | `{ questions:[{ q, options:[4], answer:0..3 }] }` (≤ 3 câu) | `{ ok:true }` |
| POST | `/api/teacher/settings` | `{ includeSecretsInBook: bool }` | `{ ok:true }` |

Ảnh trong trang thầy cô dùng `/api/teacher/media/:file?token=...` (chỉ ảnh thuộc thầy cô đó).

## 4. WebSocket `/ws` (nhiều người chơi)

JSON mỗi gói. Client → server:
- `{ t:"join", name, cls, look:{ gender:"nam"|"nu", outfit:0..3 } }`
- `{ t:"pos", x, z, ry, anim:"idle"|"walk"|"run"|"wave"|"bow" }` (≤ 10 lần/giây, server bỏ gói dày hơn)

Server → client:
- `{ t:"welcome", id }`
- `{ t:"players", list:[{ id, name, cls, look, x, z, ry, anim }] }` 10 lần/giây, mỗi client chỉ nhận **≤ 30 người gần nhất** (trừ chính mình)
- `{ t:"leave", id }`
- `{ t:"online", n }` mỗi 5 giây
- `{ t:"update", kind:"cards"|"cranes"|"signatures"|"via"|"reply"|"settings", teacherId? }` khi có nội dung được duyệt/thay đổi → client gọi lại `/api/state` (debounce 2 giây)

Server: ping/pong 30 giây, tối đa 300 kết nối (vượt thì đóng với lý do "Trường đang đông, bạn thử lại sau nhé").

## 5. Giao diện module phía client

`client/src/main.js` (người ghép) nối các phần như sau, **giữ đúng chữ ký**:

```js
// ui/index.js (C) export:
createUI({ root, api }) -> ui
  ui.showLoading(progress0to1, text?)   ui.hideLoading()
  ui.showLogin(config) -> Promise<profile>   // profile = { name, cls, look:{ gender, outfit } }, lưu localStorage 'ma_profile'
  ui.attach({ world, state, profile, net })   // gọi sau khi world sẵn sàng
  ui.applyState(state)                  // dữ liệu mới từ /api/state
  ui.setPrompt(zone|null)               // hiện/ẩn nút hành động khi đứng gần
  ui.openZone(zone)                     // mở bảng hoạt động; khi mở phải gọi world.setInputEnabled(false), đóng thì true
  ui.setOnline(n)

// world/index.js (B) export:
createWorld({ container, teachers, profile, onProgress, onInteract, onNearChange }) -> Promise<world>
  world.applyState(state)        // số thiệp mỗi cây → quả châu/hoa/phát sáng; hạc trên hồ; chữ ký trên bảng; đếm ngược
  world.setInputEnabled(bool)
  world.playEffect(name, data?)  // "incense" (khói hương ở miếu), "bow" (nhân vật vái), "crane" ({color}: hạc mới thả xuống hồ),
                                 // "card" ({teacherId}: phong bì bay lên cây), "signature", "fireworks" ({teacherId?}), "confetti"
  world.capturePhoto({ pose:"wave"|"heart"|"peace"|"bow" }) -> Promise<string dataURL 1080x1350>
                                 // camera quay về nhân vật đứng ở sân khấu, phông 20/11, ẩn người chơi khác nếu chắn
  world.getPlayerState() -> { x, z, ry, anim }
  world.upsertRemote(p) / world.removeRemote(id)   // net.js gọi
  world.dispose()

// net.js (B) export:
connectNet({ profile, world, onOnline, onUpdate }) -> { close() }   // tự kết nối lại, gửi pos 10 Hz

// api.js (người ghép) export: api.getState(), api.getStats(), api.getCards(teacherId), api.postCard(body),
//   api.postCrane(body), api.postSignature(body), api.postSecret(body), api.getQuiz(), api.answerQuiz(body), api.postVia(body)
//   Mỗi hàm ném Error(message tiếng Việt từ server) khi lỗi.
```

### Mã vùng (zone) – world phát qua `onNearChange(zone)` / `onInteract(zone)`
`zone = { id, kind, label, teacherId? }`

| id | kind | label (nút) | Ở đâu |
|---|---|---|---|
| `gate` | `gate` | "Xem đếm ngược" | Cổng trường |
| `tree:t01`…`tree:t28` | `tree` | "Treo thiệp tặng Cô Nguyễn Hồng Ngọc" | Vườn Tri Ân (vòng cung bên trái, lối các cô t01–t18, lối các thầy t19–t28) |
| `crane-lake` | `crane` | "Thả hạc giấy" | Hồ bên phải phía dưới |
| `chalkboard` | `chalkboard` | "Ký tên lên bảng" | Trước dãy lớp học |
| `secret-box` | `secret` | "Gửi lời chưa nói" | Hòm thư đỏ cạnh cửa dãy lớp học |
| `photo-stage` | `photo` | "Chụp ảnh kỷ niệm" | Sân khấu giữa sân |
| `quiz-board` | `quiz` | "Đố vui về thầy cô" | Bảng gỗ cạnh sân khấu |
| `leaderboard` | `leaderboard` | "Bảng lớp tri ân" | Bảng điện tử ở sân |
| `shrine` | `shrine` | "Vào xin vía" | Miếu nhỏ bên phải phía trên |

Mốc cây: `cardCount ≥ 10` ra hoa, `≥ 30` phát sáng, `≥ 50` pháo hoa (một lần mỗi phiên khi vượt mốc).

## 6. Chế độ THẦY CÔ vào thế giới (thêm 14/11)

Chủ dự án: thầy cô cũng được vào chính thế giới 3D, đi xem cây của mình có ai chúc, đọc tin ẩn danh… Thầy cô ít thời gian → **phải có chỉ dẫn**: biết cây mình ở đâu, chỗ nào đọc tin nhắn, có nút tự đi tới.

### 6.1 Luồng
- Link riêng gửi thầy cô đổi thành **`/?teacher=<token>`** (server trả `teacherUrl` dạng này). `teacher.html?token=` vẫn giữ làm "bản xem nhanh dạng danh sách".
- `main.js` (người ghép): thấy `?teacher=` → lưu token vào localStorage `ma_teacher_token`, xoá token khỏi thanh địa chỉ (`history.replaceState` về `/?gv=1`), gọi `api.teacher.me(token)`. Token sai → `ui.showLoading(0, 'Link không đúng hoặc đã được đổi…')`. Đúng → **bỏ qua màn đăng nhập học sinh**, gọi `ui.showTeacherWelcome(me)` → Promise (màn chào "Kính chào Thầy …", tóm tắt: X thiệp, Y lời chưa nói; nút "Vào trường").
- Profile thầy cô: `{ role:'teacher', teacherId, token, name:'Thầy Đào Bá Hiếu', cls:'', look:{ gender: title==='Cô'?'nu':'nam', outfit:3 } }`. Học sinh: `role:'student'` (mặc định khi thiếu).

### 6.2 Điểm hoạt động của thầy cô
| Việc | Ở đâu | Bảng mở ra |
|---|---|---|
| Xem thiệp mình nhận | **Cây của mình** `tree:<teacherId>` | toàn bộ thiệp đã duyệt (tên + lớp người gửi, xem to, lật) + ô **Hồi âm** + nút **Soạn câu đố** |
| Đọc lời chưa nói (ẩn danh) | **Hòm thư đỏ** `secret-box` | danh sách lời chưa nói đã duyệt **của riêng mình** + công tắc "Cho vào Sổ Tri Ân" |
| Xem cây đồng nghiệp | `tree:<id khác>` | xem thiệp (chỉ đọc), có thể viết thiệp tặng đồng nghiệp (gửi như học sinh, `from` = tên thầy cô) |
| Hạc, bảng đen, vía, chụp ảnh, đố vui, xếp hạng | như học sinh | như học sinh (tên = tên thầy cô, `cls` = "GV") |

### 6.3 Chỉ dẫn (bắt buộc)
- HUD thầy cô có thẻ **"Việc của Thầy/Cô"** (thu gọn được) gồm 3 bước có dấu tích: ① Đến **Cây <tên cây>** đọc thiệp ② Đến **Hòm thư đỏ** đọc lời chưa nói ③ Viết lời hồi âm (tuỳ chọn: soạn câu đố). Mỗi bước có 2 nút: **"Chỉ đường"** (`world.setGuide(zoneId)`) và **"Đi tới ngay"** (`world.autoWalkTo(zoneId)` rồi tự mở bảng).
- Vào trường xong tự bật chỉ đường tới cây của mình.

### 6.4 Bổ sung API world (B)
```
world.setGuide(zoneId|null)        // vệt sáng/mũi tên trên mặt đất từ người chơi tới zone + cột sáng/biển "Cây của Thầy" phía trên đích; tự tắt khi tới nơi
world.autoWalkTo(zoneId) -> Promise<boolean>   // nhân vật tự đi theo lối (không xuyên vật), bấm phím/joystick thì huỷ (resolve false); tới nơi resolve true
world.getZone(zoneId) -> zone|null  // có x, z
world.highlightTree(teacherId)     // cây của thầy cô: viền sáng vàng nhẹ + lấp lánh, biển tên nổi bật
```
Nhân vật thầy cô: trông **người lớn** hơn học sinh (cao hơn ~15%, lễ phục: thầy vest navy, cô áo trắng/áo dài màu nhạt nếu làm được), tên nổi trên đầu có **huy hiệu vàng "Thầy/Cô"**. Áp dụng cả cho người chơi khác qua WS (`look.role === 'teacher'`).

### 6.5 Bổ sung WS / API (A)
- `join` thêm `teacherToken?`. Server kiểm token → đặt `name` = "Thầy/Cô <họ tên>", `cls` = "GV", `look.role = 'teacher'` (không tin tên do client gửi). Không có/sai token → `look.role = 'student'` (client không tự nhận là thầy cô được).
- `players[]` mỗi người có `look.role`.
- `/api/admin/teachers` → `teacherUrl` = `/?teacher=<token>`, thêm `listUrl` = `/teacher.html?token=<token>`.

### 6.6 Bổ sung api.js (người ghép)
`api.teacher.me(token)`, `api.teacher.reply(token, text)`, `api.teacher.saveQuiz(token, questions)`, `api.teacher.settings(token, body)`, `api.teacher.mediaUrl(token, drawingUrl)` (đã có `?token` thì giữ nguyên).

## 7. Đại thụ + thiệp trang trí nhiều hơn (thêm 14/11)

### 7.1 Hai cây đại thụ
- `data/teachers.json` có thêm 2 mục `special: "daithu"`: `d01` **Ông Nguyễn Tiến Phú** (cây "Đại Thụ Tùng Bách"), `d02` **Bà Vũ Hải Vân** ("Đại Thụ Phúc Thọ"). `title` là "Ông"/"Bà" (không phải Thầy/Cô) → mọi chỗ lọc theo title phải loại `special` ra trước.
- Đặt ở **cuối Vườn Tri Ân**, to nhất vườn. Học sinh treo thêm thiệp như cây thường.
- Lời chúc viết sẵn: `data/seed/daithu.json` = `{ d01: [{ i, message, template, stickers }], d02: [...] }` (45 lời/cây, sinh bằng `data/seed/make_daithu.cjs`). Server nạp lúc khởi động, **không trùng lặp** (id cố định `seed-d01-<i>`), trạng thái `approved`, `seed: true`, `from: ""`, `cls: ""`, `anonymous: false`.
- Thiệp seed: `Card.seed = true` → **không hiện chữ ký** người gửi; không tính vào bảng xếp hạng lớp; có tính vào `cardCount`/`perTeacher`.
- Đại thụ không có trang thầy cô/hồi âm/câu đố, không có trong danh sách chọn "Lời chưa nói" và "Đố vui". Admin vẫn xem/duyệt/xuất Sổ được.

### 7.2 Thiệp: thêm trường trang trí (tuỳ chọn, thiệp cũ không có vẫn hiển thị đúng)
```
Card.style  = { font, color, size, align, frame, bg }   // chuỗi ngắn (≤ 40 ký tự mỗi giá trị), do UI định nghĩa
Card.texts  = [{ t, x, y, s, r, color, font }]          // ≤ 8 ô chữ thêm, t ≤ 80 ký tự (qua bộ lọc từ bậy), x,y 0..1
Card.stickers ≤ 60
```
Server: kiểm kiểu + độ dài, lưu nguyên, trả lại trong mọi API thiệp (công khai, admin, thầy cô, sổ). `cardRender.js` vẽ đủ style/texts/frame ở mọi nơi.
