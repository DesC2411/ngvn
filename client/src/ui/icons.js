// Bộ icon nét (24×24, stroke = currentColor). Chuỗi tĩnh, an toàn để innerHTML.
const S = (p, extra = '') =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;

export const ICON = {
  close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: S('<path d="M15 5l-7 7 7 7"/>'),
  help: S('<circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/>'),
  music: S('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  musicOff: S('<path d="M9 18V9m0-4 11-2v9"/><circle cx="6" cy="18" r="3"/><path d="M3 3l18 18"/>'),
  users: S('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>'),
  clock: S('<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>'),
  pen: S('<path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/>'),
  eraser: S('<path d="M7 20h13"/><path d="M4.5 14.5l9-9a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L13 18H8.5l-4-4z"/><path d="M9 10l5 5"/>'),
  undo: S('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  trash: S('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  sticker: S('<path d="M20 12a8 8 0 1 1-8-8h8v8z"/><path d="M20 12h-5a3 3 0 0 1-3-3V4"/>'),
  text: S('<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'),
  palette: S('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.4-1.9-.5-1.2.3-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7" r="1.2" fill="currentColor"/><circle cx="15" cy="7.5" r="1.2" fill="currentColor"/>'),
  sign: S('<path d="M3 17c3-1 4-9 6-9s-1 8 1 8 2-4 4-4 1 3 3 3 2-1 4-2"/><path d="M3 21h18"/>'),
  lock: S('<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>'),
  search: S('<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16"/>'),
  download: S('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  share: S('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>'),
  camera: S('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.8"/>'),
  check: S('<path d="M4.5 12.5l5 5L19.5 7"/>'),
  x: S('<path d="M7 7l10 10M17 7L7 17"/>'),
  eye: S('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
  tree: S('<path d="M12 21v-6"/><path d="M12 3a5 5 0 0 1 4.9 6A4 4 0 0 1 16 17H8a4 4 0 0 1-.9-8A5 5 0 0 1 12 3z"/>'),
  crane: S('<path d="M2 9l6 3 4-9 2 9 8-4-6 9H7z"/>'),
  board: S('<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M7 20l2-4M17 20l-2-4M7 9c2-2 3 2 5 0s3 2 5 0"/>'),
  mail: S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>'),
  photo: S('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'),
  quiz: S('<circle cx="12" cy="12" r="9.5"/><path d="M12 7v6M12 16.5v.5"/>'),
  trophy: S('<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z"/>'),
  shrine: S('<path d="M3 8l9-5 9 5"/><path d="M5 8v12M19 8v12M3 20h18M9 20v-6h6v6M5 11h14"/>'),
  gate: S('<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-9h10v9M12 12v9"/>'),
  hand: S('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5V4.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3 15.5a1.6 1.6 0 0 1 2.4-2l2.6 2.5"/>'),
  sparkle: S('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'),
  refresh: S('<path d="M20 11a8 8 0 0 0-14.8-4M4 4v4h4M4 13a8 8 0 0 0 14.8 4M20 20v-4h-4"/>'),
  user: S('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  map: S('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  heart: S('<path d="M12 20s-7.5-4.6-9-9.5C2 6.8 5.4 4 8.3 5.2 10 5.9 11 7.3 12 8.5c1-1.2 2-2.6 3.7-3.3C18.6 4 22 6.8 21 10.5 19.5 15.4 12 20 12 20z"/>'),
  incense: S('<path d="M12 21v-9M8 21v-7M16 21v-7M5 21h14"/><path d="M12 9c-1.5-1.5 1.5-2.5 0-4M8 11c-1-1 1-2 0-3M16 11c-1-1 1-2 0-3"/>'),
  redo: S('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
  up: S('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: S('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>'),
  minus: S('<path d="M5 12h14"/>'),
  rotate: S('<path d="M20 11a8 8 0 1 1-2.3-5.7L20 8M20 3v5h-5"/>'),
  alignL: S('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),
  alignC: S('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'),
  alignR: S('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'),
  frame: S('<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>'),
  type: S('<path d="M4 7V5h16v2M9 19h6M12 5v14"/><path d="M17 13h4M19 11v4"/>'),
  bow: S('<path d="M12 21v-5M8 7l4 4 4-4M7 4c1 3 3 4 5 4s4-1 5-4"/><circle cx="12" cy="13" r="2"/>'),
};

export function icon(name, cls = '') {
  const span = document.createElement('span');
  span.className = `ma-ic ${cls}`.trim();
  span.innerHTML = ICON[name] || '';
  return span;
}
