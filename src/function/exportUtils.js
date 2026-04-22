const escapeCsvCell = (value) => {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatDateIST = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
};

const sanitizeFilename = (name) =>
  String(name || 'export').replace(/[^a-z0-9\-_]+/gi, '_');

export const downloadCsv = ({ filename, headers, rows }) => {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');

  const BOM = String.fromCharCode(0xFEFF);
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${sanitizeFilename(filename)}_${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getUserFieldName = (ticket, field) => {
  const val = ticket?.[field];
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.name || val.email || '';
};

const getProjectNameFromTicket = (ticket, projectNameById) => {
  const raw = ticket?.project;
  let id = '';
  let name = '';
  if (typeof raw === 'string') {
    id = raw;
  } else if (raw && typeof raw === 'object') {
    id = raw.id || raw._id || raw.projectId || '';
    name = raw.name || raw.projectName || raw.title || '';
  }
  if (!name && id && projectNameById) {
    name = projectNameById.get(String(id)) || '';
  }
  return name || ticket?.projectName || '';
};

const getCategoryNameFromTicket = (ticket, categoryNameById) => {
  const raw = ticket?.category;
  let id = '';
  let name = '';
  if (typeof raw === 'string') {
    if (categoryNameById?.has(raw)) {
      name = categoryNameById.get(raw) || '';
    } else {
      name = raw;
    }
  } else if (raw && typeof raw === 'object') {
    id = raw._id || raw.id || '';
    name = raw.name || raw.title || '';
  }
  if (!name && id && categoryNameById) {
    name = categoryNameById.get(String(id)) || '';
  }
  return name || ticket?.categoryName || '';
};

const buildLookup = (list, nameKeys = ['name', 'projectName', 'title']) => {
  const map = new Map();
  (Array.isArray(list) ? list : []).forEach((item) => {
    const id = String(item?._id || item?.id || '').trim();
    if (!id) return;
    const name = nameKeys.map((k) => item?.[k]).find(Boolean) || '';
    map.set(id, name);
  });
  return map;
};

export const exportTicketsToCsv = (tickets, { filename, projects = [], categories = [] } = {}) => {
  const projectNameById = buildLookup(projects, ['name', 'projectName', 'title']);
  const categoryNameById = buildLookup(categories, ['name', 'title']);

  const headers = [
    'S. No.', 'Ticket No', 'Subject', 'Status', 'Priority', 'Severity',
    'Category', 'Project', 'Assigned To', 'Reported To',
    'Start Date', 'End Date', 'Estimate Time', 'Track Time',
    'Created At', 'Description',
  ];

  const rows = (tickets || []).map((ticket, index) => [
    index + 1,
    ticket.ticketNo || '',
    ticket.subject || ticket.title || '',
    ticket.status || '',
    ticket.priority ?? '',
    ticket.severity || '',
    getCategoryNameFromTicket(ticket, categoryNameById),
    getProjectNameFromTicket(ticket, projectNameById),
    getUserFieldName(ticket, 'assignTo'),
    getUserFieldName(ticket, 'reportedTo'),
    formatDateIST(ticket.startDate),
    formatDateIST(ticket.endDate),
    ticket.estimateTime || '',
    ticket.trackTime || '',
    formatDateIST(ticket.createdAt),
    ticket.description || '',
  ]);

  downloadCsv({ filename, headers, rows });
};
