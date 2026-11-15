// Câu chúc vui theo môn cho Góc Xin Vía. Vui, lành mạnh, hợp học sinh.
import { norm } from './dom.js';

export const VIA_LINES = {
  'Toán': [
    'Phương trình nào cũng ra nghiệm đẹp, không ai hỏi điều kiện xác định.',
    'Vẽ hình tới đâu, đường phụ hiện ra tới đó.',
    'Bấm máy tính một lần là ra, không phải bấm lại lần hai.',
    'Đề bảo chứng minh, bạn chứng minh xong còn dư giờ dò lại.',
    'Số π có dài mấy cũng không làm khó được bạn.',
    'Bài hình không phải vẽ lại tới lần thứ ba.',
    'Chia hết mọi bài khó, phần dư toàn là điểm cộng.',
  ],
  'Ngữ văn': [
    'Mở bài trôi chảy, thân bài mượt mà, kết bài khiến thầy cô gật gù.',
    'Bút không tắc mực, ý không tắc đường.',
    'Đọc đề một lần là hiểu ngay tác giả muốn nói gì.',
    'Dẫn chứng tự nhớ, trích thơ không sai một chữ.',
    'Viết đủ dài mà tay không mỏi.',
    'Phân tích nhân vật sâu tới mức nhân vật cũng phải ngạc nhiên.',
    'Chữ đẹp như in, thầy cô chấm mà cứ muốn đọc thêm.',
  ],
  'Tiếng Anh': [
    'Nghe một lần là hiểu, không cần nói "Pardon?" lần nào.',
    'Động từ bất quy tắc tự xếp hàng ngay ngắn trong đầu.',
    'Nói tiếng Anh trôi chảy, nghe như phát thanh viên.',
    'Từ mới gặp một lần là nhớ cả nghĩa lẫn cách phát âm.',
    'Điền "a", "an", "the" chỗ nào trúng chỗ đó.',
    'Đọc hiểu đoạn dài mà như đọc truyện tranh.',
    'Chia thì đúng từng câu, không thì nào bị lạc.',
  ],
  'Vật lí': [
    'Đổi đơn vị không bao giờ sót một số 0.',
    'Lực nào cũng phân tích được, trừ lực hút của chiếc giường sáng thứ Hai.',
    'Công thức tự đứng đúng chỗ, không phải lật vở tìm.',
    'Mạch điện nào cũng sáng đèn, kể cả mạch suy nghĩ lúc làm bài.',
    'Tốc độ làm bài nhanh, gia tốc điểm số còn nhanh hơn.',
    'Ba định luật Newton đều đứng về phía bạn.',
  ],
  'Hoá học': [
    'Cân bằng phương trình nhanh như cân bằng thời gian biểu.',
    'Bảng tuần hoàn nhớ trọn, không sót nguyên tố nào.',
    'Phản ứng nào cũng xảy ra đúng như bạn dự đoán.',
    'Tính số mol một lần là đúng, không phải làm lại.',
    'Gặp bài khó, bạn chính là chất xúc tác.',
    'Hoá trị thuộc lòng như số điện thoại nhà mình.',
  ],
  'Sinh học': [
    'Sơ đồ lai nào cũng ra đúng tỉ lệ kiểu hình.',
    'Tên các bào quan tự hiện ra như người quen.',
    'Ti thể cung cấp đủ năng lượng cho cả buổi kiểm tra.',
    'Nhớ đủ các kì nguyên phân, giảm phân mà không lẫn.',
    'Bài di truyền khó cỡ nào cũng giải mã được.',
    'Vẽ tế bào đẹp như tranh triển lãm.',
  ],
  'Lịch sử': [
    'Mốc thời gian tự xếp hàng, không ngày tháng nào đi lạc.',
    'Nhớ tên trận đánh nhanh như nhớ tên bạn cùng bàn.',
    'Ý nghĩa lịch sử viết ra đủ ý, không thiếu dòng nào.',
    'Đọc bài một lần, nhớ cả nguyên nhân lẫn kết quả.',
    'Học Sử như xem phim, mà điểm thì như phim có hậu.',
    'Làm bài mạch lạc, đúng trình tự như dòng chảy lịch sử.',
  ],
  'Địa lí': [
    'Mở Atlat ra trang nào cũng đúng trang cần tìm.',
    'Vẽ biểu đồ thẳng tắp, chú giải đầy đủ, không quên tên biểu đồ.',
    'Nhận xét bảng số liệu tròn ý, tròn điểm.',
    'Xác định phương hướng chuẩn, cả trên bản đồ lẫn trên đường học tập.',
    'Nhớ tên sông, tên núi nhanh như nhớ đường về nhà.',
    'Khí hậu vùng nào cũng được, miễn điểm của bạn luôn nắng đẹp.',
  ],
  'Tin học': [
    'Code chạy ngay lần đầu, không quên một dấu chấm phẩy nào.',
    'Vòng lặp nào cũng có điểm dừng, chỉ điểm cao là lặp mãi.',
    'Gặp lỗi là tìm ra ngay, như có kính lúp trong đầu.',
    'Gõ phím nhanh mà không gõ nhầm chữ nào.',
    'Thuật toán nghĩ ra là đúng, chạy lại còn nhanh.',
    'Máy tính không treo, đầu óc cũng không treo.',
  ],
  'KHTN': [
    'Thí nghiệm nào cũng ra đúng kết quả, không đổ giọt hoá chất nào.',
    'Lí, Hoá, Sinh gặp nhau trong một đề cũng không làm khó được bạn.',
    'Quan sát tinh như kính hiển vi, ghi chép gọn như sách giáo khoa.',
    'Đơn vị đo nhớ đủ, đổi đơn vị không sai.',
    'Câu vận dụng thực tế trả lời trôi như kể chuyện.',
    'Tò mò đúng lúc, giải thích đúng bài.',
  ],
  'GDCD': [
    'Tình huống nào cũng xử lí đúng mực, vừa lòng cả thầy cô lẫn đáp án.',
    'Nhớ khái niệm trọn câu, không thiếu một chữ.',
    'Học bài nào thấm bài đó, sống tử tế thêm một chút.',
    'Nêu ví dụ thực tế hay tới mức thầy cô muốn kể lại cho lớp khác.',
    'Câu trắc nghiệm nào cũng chọn đúng ngay lần đầu.',
    'Hiểu rõ quyền và nghĩa vụ, nhất là nghĩa vụ đạt điểm cao.',
  ],
};

export const VIA_GENERIC = [
  'Đề ra trúng phần bạn vừa ôn tối qua.',
  'Bút không hết mực, máy tính không hết pin, đầu óc không hết ý.',
  'Làm bài bình tĩnh, nộp bài tự tin.',
  'Câu khó hoá dễ, câu dễ chắc điểm.',
  'Ôn đâu chắc đó, thi đâu trúng đó.',
  'Điểm 10 đang trên đường tới.',
];

// Đổi tên môn tuỳ biến (config.subjects) về khoá chuẩn.
const ALIAS = [
  ['gdcd', 'GDCD'], ['giao duc cong dan', 'GDCD'], ['khtn', 'KHTN'], ['khoa hoc tu nhien', 'KHTN'],
  ['toan', 'Toán'], ['van', 'Ngữ văn'], ['anh', 'Tiếng Anh'], ['dia', 'Địa lí'], ['su', 'Lịch sử'],
  ['sinh', 'Sinh học'], ['hoa', 'Hoá học'], ['tin', 'Tin học'], ['ly', 'Vật lí'], ['li', 'Vật lí'],
];

export function viaLinesFor(subject) {
  if (VIA_LINES[subject]) return VIA_LINES[subject];
  const words = norm(subject).split(' ');
  const joined = words.join(' ');
  for (const [k, v] of ALIAS) {
    if (k.includes(' ') ? joined.includes(k) : words.includes(k)) return VIA_LINES[v];
  }
  return VIA_GENERIC;
}
