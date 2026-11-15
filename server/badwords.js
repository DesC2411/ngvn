// Bộ lọc từ tục/xúc phạm tiếng Việt.
// Nguyên tắc: so khớp theo TỪ (token), không so chuỗi con → "cặp sách", "buổi học",
// "các bạn", "lớn lên", "đeo kính", "du lịch" không bị chặn nhầm.
// Từ nào mất dấu sẽ trùng từ bình thường (lon/lớn, cac/các, buoi/buổi, deo/đeo…)
// thì CHỈ chặn dạng có dấu — trừ khi người viết cố lách (chèn dấu chấm, số thay chữ).

// Từ đơn có dấu (so trên dạng có dấu)
const ACCENT_WORDS = [
  'cặc', 'kặc', 'cặk', 'lồn', 'lìn', 'buồi', 'đụ', 'địt', 'đjt', 'đéo', 'đếch', 'đĩ', 'đỹ', 'cứt',
];

// Từ đơn không dấu, không trùng từ bình thường → chặn cả khi viết không dấu.
// Cố ý KHÔNG chặn: "vl" (= Vật lí), "cc" (= "các" khi nhắn tắt), "vô học" (= "vào học" giọng Nam).
const ASCII_WORDS = [
  'dm', 'dmm', 'dmml', 'dcm', 'dcmm', 'dcmn', 'dkm', 'dkmm', 'dmay', 'dume', 'duma', 'dmcs',
  'vcl', 'vkl', 'vll', 'vcc', 'clm', 'cmm', 'ccmm', 'cmnr', 'clgt',
  'dit', 'djt', 'loz', 'cak', 'kak', 'kac', 'cax', 'buoj',
  'fuck', 'fck', 'fuk', 'fucking', 'shit', 'bitch', 'dick', 'cunt', 'pussy', 'asshole', 'wtf', 'stfu',
];

// Dạng không dấu của từ nặng — chỉ chặn khi có dấu hiệu lách (số thay chữ, tách chữ bằng dấu chấm…)
const EVASION_ASCII = ['cac', 'lon', 'buoi', 'du', 'deo', 'di', 'dit', 'cut', 'dech', 'kac'];

// Cụm từ có dấu (so theo chuỗi token liên tiếp)
const ACCENT_PHRASES = [
  'đụ má', 'đù má', 'địt mẹ', 'mẹ mày', 'bố mày', 'con mẹ mày', 'con mẹ nó', 'đồ chó', 'thằng chó', 'con chó cái',
  'chó đẻ', 'chó má', 'óc chó', 'óc lợn', 'não lợn', 'não chó', 'đồ ngu', 'thằng ngu', 'con ngu', 'ngu như bò',
  'ngu như chó', 'ngu như lợn', 'ngu vãi', 'ngu học', 'súc vật', 'khốn nạn', 'mất dạy', 'đồ điên',
  'thằng điên', 'con điên', 'đồ khốn', 'thằng khốn', 'cút mẹ', 'vãi lồn', 'vãi cả lồn', 'đờ mờ', 'đê mờ',
  'mặt lồn', 'đồ đĩ', 'con đĩ', 'đồ rác rưởi', 'đồ mặt dày', 'cave',
];

// Cụm từ không dấu ít nhầm
const ASCII_PHRASES = ['du ma', 'dit me', 'oc cho', 'suc vat', 'khon nan', 'vai lon', 'con me may', 'dit con me'];

// Số / ký hiệu hay dùng thay chữ
const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '|': 'l' };

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').normalize('NFC');
}
function collapse(s) { return s.replace(/(.)\1+/gu, '$1'); } // "lồnnn" → "lồn"

const ACC_SET = new Set(ACCENT_WORDS);
const ASCII_SET = new Set(ASCII_WORDS);
const EVASION_SET = new Set(EVASION_ASCII);
const toTokens = (p) => p.split(' ');
const ACC_PH = ACCENT_PHRASES.map(toTokens);
const ASCII_PH = ASCII_PHRASES.map(toTokens);

// Tách thành danh sách token { w: dạng có dấu, a: dạng không dấu, sus: có dấu hiệu lách }
function tokenize(text) {
  const raw = String(text || '').normalize('NFC').toLowerCase();
  // Chỉ thay "số thay chữ" khi ký tự đó nằm giữa các chữ cái (l0n, đ1t, c4c) – tránh đổi "10 điểm"
  const out = [];
  const parts = raw.split(/[^\p{L}\p{M}\p{N}@$!|]+/u).filter(Boolean);
  for (const p of parts) {
    let sus = false;
    let w = p;
    if (/\p{L}/u.test(p) && /[0-9@$!|]/.test(p)) {
      w = p.replace(/[0-9@$!|]/g, (c) => LEET[c] ?? c);
      sus = true;
    }
    // "@" "$" "!" "|" đứng riêng là dấu tách
    w = w.replace(/[@$!|]/g, '');
    if (!w || !/\p{L}/u.test(w)) continue;
    out.push({ w, a: stripAccents(w), sus });
  }
  return out;
}

// Gộp các token 1 chữ cái liền nhau: "đ . m" → "đm", "c.ặ.c" → "cặc"
function joinSingles(tokens) {
  const res = [];
  let run = [];
  const flush = () => {
    if (run.length >= 2) {
      const w = run.map((t) => t.w).join('');
      res.push({ w, a: stripAccents(w), sus: true });
    } else res.push(...run);
    run = [];
  };
  for (const t of tokens) {
    if ([...t.w].length === 1) run.push(t);
    else { flush(); res.push(t); }
  }
  flush();
  return res;
}

function wordHit(t) {
  for (const w of [t.w, collapse(t.w)]) if (ACC_SET.has(w)) return true;
  for (const a of [t.a, collapse(t.a)]) {
    if (ASCII_SET.has(a)) return true;
    if (t.sus && EVASION_SET.has(a)) return true;
  }
  return false;
}

function phraseHit(list, key, phrases) {
  for (const ph of phrases) {
    outer: for (let i = 0; i + ph.length <= list.length; i++) {
      for (let j = 0; j < ph.length; j++) if (list[i + j][key] !== ph[j]) continue outer;
      return true;
    }
  }
  return false;
}

/** true nếu chuỗi có từ tục/xúc phạm */
export function hasBadWords(text) {
  if (!text) return false;
  const base = tokenize(text);
  for (const list of [base, joinSingles(base)]) {
    if (list.some(wordHit)) return true;
    if (phraseHit(list, 'w', ACC_PH)) return true;
    if (phraseHit(list, 'a', ASCII_PH)) return true;
  }
  return false;
}
