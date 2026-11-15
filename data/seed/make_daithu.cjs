// Sinh data/seed/daithu.json: lời chúc viết sẵn (không ghi tên) cho 2 cây đại thụ.
// Chạy: node data/seed/make_daithu.cjs
// {x} = ông/bà, {X} = Ông/Bà. Chỉ chúc chung, không nói điều gì về đời tư/vai trò của hai người.
const fs = require('fs');
const path = require('path');

const WISHES = [
  'Chúc {x} luôn mạnh khoẻ, vui vẻ và bình an.',
  'Chúng con kính chúc {x} sống lâu trăm tuổi, lúc nào cũng tươi cười.',
  'Mỗi lần nghĩ tới {x}, chúng con thấy ấm lòng. Con cảm ơn {x} nhiều lắm!',
  'Chúc {x} một ngày 20/11 thật nhiều niềm vui và hoa tươi.',
  '{X} ơi, chúng con thương {x} nhiều! Chúc {x} luôn khoẻ mạnh.',
  'Kính chúc {x} phúc như Đông Hải, thọ tỉ Nam Sơn.',
  'Chúc {x} ăn ngon, ngủ ngon, đi đâu cũng có người thương.',
  'Chúng con hứa sẽ chăm ngoan, học giỏi để {x} vui lòng.',
  'Con cảm ơn {x} vì những điều tốt đẹp {x} đã dành cho chúng con.',
  'Chúc {x} lúc nào cũng trẻ trung, minh mẫn và yêu đời.',
  'Gửi {x} một bông hoa thật to từ tất cả chúng con!',
  'Chúc {x} mỗi sáng thức dậy đều thấy nắng đẹp và tin vui.',
  'Con mong {x} luôn khoẻ để chúng con được gặp {x} thật nhiều lần nữa.',
  'Một lời cảm ơn nhỏ nhưng chân thành nhất gửi tới {x}.',
  'Chúc {x} sức khoẻ dồi dào, tinh thần thật thoải mái.',
  'Chúng con kính chúc {x} an khang, thịnh vượng, vạn sự như ý.',
  'Chúc {x} luôn được bao quanh bởi tiếng cười và tình thương.',
  '{X} là cây đại thụ che mát cho chúng con. Con cảm ơn {x}!',
  'Chúc {x} trời trong nắng ấm, lòng luôn thảnh thơi.',
  'Mong {x} luôn hạnh phúc như những ngày đẹp nhất.',
  'Chúc {x} một mùa tri ân thật ý nghĩa và đong đầy yêu thương.',
  'Chúng con gửi {x} thật nhiều cái ôm ấm áp!',
  'Chúc {x} khoẻ như cây tùng, vững như cây bách.',
  'Kính chúc {x} mạnh khoẻ, sống vui, sống khoẻ mỗi ngày.',
  'Con chúc {x} lúc nào cũng có trà ngon, sách hay và người thương bên cạnh.',
  'Chúc {x} luôn bình yên như buổi sáng mùa thu.',
  'Chúng con biết ơn {x} nhiều lắm. Chúc {x} thật nhiều sức khoẻ!',
  'Một bông hồng, một lời chúc, một tấm lòng biết ơn gửi tới {x}.',
  'Chúc {x} cười thật nhiều, vì nụ cười của {x} làm chúng con vui.',
  'Kính chúc {x} tuổi mới thêm sức, ngày mới thêm vui.',
  'Chúc {x} mãi là chỗ dựa vững chãi, mát lành như cây đại thụ này.',
  'Con chúc {x} mọi điều tốt đẹp nhất trên đời.',
  'Chúng con kính chúc {x} và gia đình luôn mạnh khoẻ, hạnh phúc.',
  'Chúc {x} luôn có những ngày thật nhẹ nhàng và bình an.',
  'Cảm ơn {x} đã là một phần thật đẹp của May Academy.',
  'Chúc {x} một năm mới (sớm sớm) thật nhiều may mắn!',
  'Con gửi {x} lời chúc ngọt như kẹo, ấm như nắng.',
  'Kính chúc {x} luôn vui khoẻ để còn xem chúng con lớn lên.',
  'Chúc {x} đi đâu cũng gặp điều may, về nhà gặp niềm vui.',
  'Chúc {x} trăm năm vẫn tươi, nghìn năm vẫn xanh như cây cổ thụ.',
  'Chúng con yêu {x}! Chúc {x} 20/11 thật vui.',
  'Chúc {x} mỗi ngày đều là một ngày đáng nhớ.',
  'Con chúc {x} khoẻ mạnh, an vui, mọi việc đều thuận lợi.',
  'Mong những lời chúc nhỏ trên cây này mang tới {x} thật nhiều niềm vui.',
  'Kính chúc {x} một đời an nhiên, hạnh phúc trọn vẹn.',
];

const TEMPLATES = ['cuc', 'phan', 'sach', 'la-thu', 'sen', 'sao'];
const STICKERS = ['hoa', 'tim', 'sao', 'sach', 'but', 'hac', 'la', 'tao', 'no', 'huy-hieu', 'mat-troi', 'bong-bay'];

// ngẫu nhiên có hạt giống → chạy lại ra cùng kết quả
let seed = 20112026;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (a) => a[Math.floor(rnd() * a.length)];

function cardsFor(xung) {
  const X = xung[0].toUpperCase() + xung.slice(1);
  return WISHES.map((w, i) => {
    // sticker chỉ ở góc phải trên + hai góc dưới (chữ "Kính gửi…" và lời chúc nằm ở nửa trên bên trái)
    const SPOTS = [[0.86, 0.09], [0.14, 0.88], [0.86, 0.88]];
    const n = 1 + Math.floor(rnd() * 3);
    const start = Math.floor(rnd() * 3);
    const stickers = Array.from({ length: n }, (_, k) => {
      const [sx, sy] = SPOTS[(start + k) % 3];
      return {
        id: pick(STICKERS),
        x: +(sx + (rnd() - 0.5) * 0.04).toFixed(2),
        y: +(sy + (rnd() - 0.5) * 0.04).toFixed(2),
        s: +(0.6 + rnd() * 0.25).toFixed(2),
        r: Math.round(-20 + rnd() * 40),
      };
    });
    return { i, message: w.replaceAll('{x}', xung).replaceAll('{X}', X), template: pick(TEMPLATES), stickers };
  });
}

const out = { d01: cardsFor('ông'), d02: cardsFor('bà') };
fs.writeFileSync(path.join(__dirname, 'daithu.json'), JSON.stringify(out, null, 1));
console.log('d01', out.d01.length, 'd02', out.d02.length);
