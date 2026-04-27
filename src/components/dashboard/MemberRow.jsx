const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        color: '#3b82f6' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b' },
  RESOLVED:    { label: 'Resolved',    color: '#10b981' },
  BACKLOG:     { label: 'Backlog',     color: '#ef4444' },
  CLOSED:      { label: 'Closed',      color: '#64748b' },
};

function memberColor(id) {
  let h = 0;
  for (const c of (id || '')) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

const MemberAvatar = ({ name, id, size = 26 }) => {
  const initials = (name || '?').split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: memberColor(id || name) }}
      title={name}
    >
      {initials}
    </div>
  );
};

const MemberRow = ({ id, name, tickets, today }) => {
  const total = Math.max(tickets.length, 1);
  const segs = Object.entries(STATUS_CONFIG)
    .map(([key, cfg]) => ({ label: cfg.label, color: cfg.color, value: tickets.filter(t => t.status === key).length }))
    .filter(s => s.value > 0);
  const overdue = tickets.filter(t => {
    if (t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
    return t.endDate && new Date(t.endDate) < today;
  }).length;

  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-1.5">
        <MemberAvatar name={name} id={id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between">
            <div className="text-[12.5px] font-semibold text-slate-800 truncate">{name}</div>
            <div className="flex items-center gap-2 text-[11px] shrink-0">
              <span className="text-slate-400 tabular-nums">{tickets.length}</span>
              {overdue > 0 && <span className="text-rose-600 font-semibold">{overdue} overdue</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="ml-[34px] flex h-2 rounded-full overflow-hidden bg-slate-100">
        {segs.map((s, i) => (
          <div key={i} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
    </div>
  );
};

export const ApiMemberRow = ({ row }) => {
  const total = Math.max(Number(row.total_tasks), 1);
  const segs = [
    { label: 'Open',        color: STATUS_CONFIG.OPEN.color,        value: Number(row.open_tasks) },
    { label: 'In Progress', color: STATUS_CONFIG.IN_PROGRESS.color,  value: Number(row.in_progress_tasks) },
    { label: 'Resolved',    color: STATUS_CONFIG.RESOLVED.color,     value: Number(row.resolved_tasks) },
    { label: 'Backlog',     color: STATUS_CONFIG.BACKLOG.color,      value: Number(row.backlog_tasks) },
    { label: 'Closed',      color: STATUS_CONFIG.CLOSED.color,       value: Number(row.closed_tasks) },
  ].filter(s => s.value > 0);
  const overdue = Number(row.overdue_tasks);

  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-1.5">
        <MemberAvatar name={row.assignto_name} id={row.assignto_id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between">
            <div className="text-[12.5px] font-semibold text-slate-800 truncate">{row.assignto_name}</div>
            <div className="flex items-center gap-2 text-[11px] shrink-0">
              <span className="text-slate-400 tabular-nums">{row.total_tasks}</span>
              {overdue > 0 && <span className="text-rose-600 font-semibold">{overdue} overdue</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="ml-[34px] flex h-2 rounded-full overflow-hidden bg-slate-100">
        {segs.map((s, i) => (
          <div key={i} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
    </div>
  );
};

export default MemberRow;
