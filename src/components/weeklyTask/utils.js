import { HOUR_HEIGHT, FULL_MONTHS } from './constants';

export const sanitizeTimeInput = (val) => val.replace(/[^\dhHmM\s]/g, '');

export const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

export const getWeekDates = (base) => {
  const date = new Date(base);
  const day = date.getDay();
  const sun = new Date(date);
  sun.setDate(date.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    return d;
  });
};

export const formatWeekRange = (dates) => {
  const s = dates[0], e = dates[6];
  if (s.getMonth() === e.getMonth())
    return `${FULL_MONTHS[s.getMonth()]} ${s.getDate()} – ${e.getDate()}`;
  return `${FULL_MONTHS[s.getMonth()]} ${s.getDate()} – ${FULL_MONTHS[e.getMonth()]} ${e.getDate()}`;
};

export const fmt12 = (date) => {
  const h = date.getHours(), m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const pad2 = (value) => String(value).padStart(2, '0');

export const toDateTimeLocalValue = (baseDate, mins) => {
  const date = new Date(baseDate);
  date.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

export const formatHourLabel = (h) => {
  if (h === 0) return '';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

export const yToMins = (y) => {
  const raw = (y / HOUR_HEIGHT) * 60;
  return Math.max(0, Math.min(Math.round(raw / 15) * 15, 24 * 60 - 1));
};

export const minsToLabel = (totalMins) => {
  const clamped = Math.max(0, Math.min(totalMins, 24 * 60 - 1));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const parseEstimateHours = (str) => {
  if (!str) return 1;
  const h = str.match(/(\d+)\s*h/i);
  const m = str.match(/(\d+)\s*m/i);
  const total = (h ? Number(h[1]) : 0) + (m ? Number(m[1]) : 0) / 60;
  return total > 0 ? total : 1;
};

export const isOffDay = (date) => {
  const d = date.getDay();
  return d === 0 || d === 6;
};

export const isAllDayTicket = (ticket) => {
  if (!ticket?.startDate) return false;
  if (!ticket?.endDate) return true;
  const start = new Date(ticket.startDate);
  const end = new Date(ticket.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return (end - start) > 8 * 3_600_000;
};

export const createEmptyWeekData = () =>
  Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, { projectNames: '', workDescription: '', time: '', status: '' }]));

export const getUserName = (u) =>
  u?.authentication?.userName ||
  `${u?.name?.first || ''} ${u?.name?.last || ''}`.trim() ||
  u?.authentication?.email || 'Unknown';

export const packLanes = (events) => {
  if (!events.length) return [];
  const sorted = [...events].sort((a, b) =>
    a.startCol !== b.startCol ? a.startCol - b.startCol : a.endCol - b.endCol
  );
  const laneEndCols = [];
  return sorted.map(event => {
    let lane = 0;
    while (lane < laneEndCols.length && laneEndCols[lane] >= event.startCol) lane++;
    laneEndCols[lane] = event.endCol;
    return { ...event, laneIdx: lane };
  });
};
