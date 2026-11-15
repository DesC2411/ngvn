// Danh sách điểm hoạt động (dùng cho trợ giúp, cổng trường) + bản đồ nhỏ.
export const ZONE_GUIDE = [
  { kind: 'tree', icon: 'tree', name: 'Vườn Tri Ân', where: 'Bên trái · vòng cung 28 cây', desc: 'Viết thiệp, vẽ tay, dán sticker tặng thầy cô.', at: [38, 128] },
  { kind: 'crane', icon: 'crane', name: 'Hồ hạc giấy', where: 'Bên phải · phía dưới', desc: 'Gấp hạc, ghi lời cảm ơn rồi thả xuống hồ.', at: [262, 190] },
  { kind: 'chalkboard', icon: 'board', name: 'Bảng đen ký tên', where: 'Trước dãy lớp học', desc: 'Ký một chữ ký phấn lên tấm bảng chung.', at: [160, 64] },
  { kind: 'secret', icon: 'mail', name: 'Hộp "Lời chưa nói"', where: 'Hòm thư đỏ cạnh cửa dãy lớp', desc: 'Gửi riêng một lời chưa dám nói.', at: [226, 40] },
  { kind: 'photo', icon: 'camera', name: 'Góc chụp ảnh', where: 'Sân khấu giữa sân', desc: 'Tạo dáng, chọn khung, tải ảnh kỷ niệm.', at: [160, 122] },
  { kind: 'quiz', icon: 'quiz', name: 'Đố vui về thầy cô', where: 'Bảng gỗ cạnh sân khấu', desc: 'Bạn hiểu thầy cô bao nhiêu?', at: [202, 140] },
  { kind: 'leaderboard', icon: 'trophy', name: 'Bảng lớp tri ân', where: 'Bảng điện tử ở sân', desc: 'Lớp nào tri ân nhiều nhất?', at: [120, 154] },
  { kind: 'shrine', icon: 'shrine', name: 'Góc Xin Vía', where: 'Bên phải · phía trên', desc: 'Thắp hương, vái Thần Điểm 10 xin vía.', at: [270, 66] },
  { kind: 'gate', icon: 'gate', name: 'Cổng trường', where: 'Phía dưới', desc: 'Lời chào và đồng hồ đếm ngược tới 20/11.', at: [160, 228] },
];

export function miniMapSVG() {
  let trees = '';
  for (let i = 0; i < 28; i++) {
    const a = ((125 + (110 * i) / 27) * Math.PI) / 180;
    const x = 168 + 132 * Math.cos(a);
    const y = 128 + 104 * Math.sin(a);
    trees += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#5FA463"/>`;
  }
  const markers = ZONE_GUIDE.map(
    (z, i) => `<g transform="translate(${z.at[0]} ${z.at[1]})"><circle r="9.5" fill="#0F2247" stroke="#fff" stroke-width="2"/><text y="3.6" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">${i + 1}</text></g>`,
  ).join('');
  return `<svg class="ma-map" viewBox="0 0 320 250" role="img" aria-label="Bản đồ nhỏ khuôn viên May Academy" font-family="Be Vietnam Pro, system-ui, sans-serif">
    <rect x="2" y="2" width="316" height="246" rx="18" fill="#EAF2E3" stroke="#D3E2C8" stroke-width="2"/>
    <g stroke="#F1E3CC" stroke-width="12" stroke-linecap="round" fill="none">
      <path d="M160 238 L160 60"/><path d="M160 140 C 120 140 80 130 52 128"/><path d="M160 140 C 210 140 240 170 252 186"/><path d="M160 90 C 210 90 250 80 268 70"/>
    </g>
    <path d="M60 40 C 30 80 30 180 64 220" stroke="#D8E8CC" stroke-width="22" fill="none" stroke-linecap="round"/>
    ${trees}
    <rect x="98" y="12" width="124" height="30" rx="5" fill="#C9D4E8" stroke="#9FB0CF"/><text x="160" y="31" text-anchor="middle" font-size="10" fill="#0F2247" font-weight="600">Dãy lớp học</text>
    <rect x="138" y="56" width="44" height="6" rx="2" fill="#2E5143"/>
    <circle cx="160" cy="140" r="44" fill="#F1E3CC"/>
    <rect x="142" y="112" width="36" height="16" rx="3" fill="#F6C98C" stroke="#E9973B"/>
    <path d="M160 156 L160 176" stroke="#5D6B85" stroke-width="2"/><path d="M160 156 L172 160 L160 164Z" fill="#E5484D"/>
    <ellipse cx="262" cy="196" rx="46" ry="28" fill="#A9D3E8" stroke="#8CC1DB"/>
    <path d="M254 66 L270 54 L286 66 Z" fill="#C9353D"/><rect x="258" y="66" width="24" height="14" fill="#F3D9A4"/>
    <path d="M140 238 L140 220 L180 220 L180 238" stroke="#0F2247" stroke-width="4" fill="none"/><rect x="138" y="214" width="44" height="7" rx="2" fill="#E9973B"/>
    <text x="14" y="22" font-size="9.5" font-weight="600" fill="#3E7D52">Vườn Tri Ân</text>
    ${markers}
  </svg>`;
}
