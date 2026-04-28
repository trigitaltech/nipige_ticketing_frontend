export const HOUR_HEIGHT = 40;
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const STATUS_OPTIONS = [
  { value: 'On Going',    label: 'On Going' },
  { value: 'Completed',   label: 'Completed' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'On Hold',     label: 'On Hold' },
];

export const STATUS_CHIP = {
  'On Going':    { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  'Completed':   { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
  'Not Started': { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  'On Hold':     { bg: '#fce7f3', color: '#9f1239', border: '#fda4af' },
};

export const TICKET_STATUS_CONFIG = {
  OPEN:        { cardBg: '#D6E8FF', cardText: '#0c60b7', dotColor: '#0880EA', label: 'Open' },
  IN_PROGRESS: { cardBg: '#FDECD4', cardText: '#b45309', dotColor: '#f59e0b', label: 'In Progress' },
  RESOLVED:    { cardBg: '#C9F0DC', cardText: '#1a7a52', dotColor: '#299764', label: 'Resolved' },
  CLOSED:      { cardBg: '#E2E4E7', cardText: '#4b5563', dotColor: '#656F7D', label: 'Closed' },
  BACKLOG:     { cardBg: '#EBE0DA', cardText: '#8a6a5e', dotColor: '#a18072', label: 'Backlog' },
};

export const TICKET_STATUS_OPTIONS = [
  { value: 'OPEN',        label: 'Open',        dotColor: '#0880EA' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotColor: '#f59e0b' },
  { value: 'RESOLVED',    label: 'Resolved',    dotColor: '#299764' },
  { value: 'BACKLOG',     label: 'Backlog',     dotColor: '#a18072' },
  { value: 'CLOSED',      label: 'Closed',      dotColor: '#656F7D' },
];

export const VIEW_OPTIONS = [
  { value: 'day',   label: 'Day',   shortcut: 'D' },
  { value: 'week',  label: 'Week',  shortcut: 'W' },
  { value: 'month', label: 'Month', shortcut: 'M' },
];

export const MONTH_MAX_VISIBLE = 3;
