// Lớp gọi API cho trang học sinh. Xem docs/CONTRACT.md mục 3.
// Mã máy ngẫu nhiên: server giới hạn tần suất theo máy (cả lớp chung wifi = chung IP)
function clientId() {
  try {
    let id = localStorage.getItem('ma_cid');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('ma_cid', id); }
    return id;
  } catch {
    return (window.__ma_cid ||= Math.random().toString(36).slice(2) + Date.now().toString(36));
  }
}

async function request(method, url, body, teacherToken) {
  let res;
  const headers = { 'x-client-id': clientId() };
  if (teacherToken) headers['x-teacher-token'] = teacherToken;
  if (body) headers['Content-Type'] = 'application/json';
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Mất kết nối tới trường, bạn kiểm tra mạng rồi thử lại nhé.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* không phải JSON */ }
  if (!res.ok) throw new Error((data && data.error) || `Có lỗi xảy ra (${res.status}).`);
  return data;
}

export const api = {
  getState: () => request('GET', '/api/state'),
  getStats: () => request('GET', '/api/stats'),
  getCards: (teacherId) => request('GET', `/api/teachers/${encodeURIComponent(teacherId)}/cards`),
  postCard: (body) => request('POST', '/api/cards', body),
  postCrane: (body) => request('POST', '/api/cranes', body),
  postSignature: (body) => request('POST', '/api/signatures', body),
  postSecret: (body) => request('POST', '/api/secrets', body),
  getQuiz: () => request('GET', '/api/quiz'),
  answerQuiz: (body) => request('POST', '/api/quiz/answer', body),
  postVia: (body) => request('POST', '/api/via', body),

  // Chế độ thầy cô (CONTRACT mục 6)
  teacher: {
    me: (token) => request('GET', '/api/teacher/me', undefined, token),
    reply: (token, text) => request('POST', '/api/teacher/reply', { text }, token),
    saveQuiz: (token, questions) => request('PUT', '/api/teacher/quiz', { questions }, token),
    settings: (token, body) => request('POST', '/api/teacher/settings', body, token),
    mediaUrl: (token, url) => (!url || /[?&]token=/.test(url) ? url : `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`),
  },
};
