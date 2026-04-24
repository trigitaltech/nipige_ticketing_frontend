import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        color: '#3b82f6' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b' },
  RESOLVED:    { label: 'Resolved',    color: '#10b981' },
  BACKLOG:     { label: 'Backlog',     color: '#ef4444' },
  CLOSED:      { label: 'Closed',      color: '#64748b' },
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function memberColor(id) {
  let h = 0;
  for (const c of (id || '')) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

function MemberAvatar({ name, id, size = 24 }) {
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
}

const TaskRow = ({ ticket, today }) => {
  const subject = ticket.subject || ticket.title || 'Untitled';
  const status = ticket.status || 'OPEN';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  const assignName = ticket.assignTo?.name || ticket.assignTo?.username || '';
  const assignId = ticket.assignTo?._id || ticket.assignTo?.id || '';
  const dueDate = ticket.endDate ? new Date(ticket.endDate) : null;
  const daysLeft = dueDate ? Math.round((dueDate - today) / MS_PER_DAY) : null;
  const dueCls =
    daysLeft !== null && daysLeft < 0 ? 'text-rose-600'
    : daysLeft === 0 ? 'text-amber-600'
    : 'text-slate-400';
  const dueLabel =
    daysLeft === null ? ''
    : daysLeft < 0 ? `${-daysLeft}d overdue`
    : daysLeft === 0 ? 'Due today'
    : `in ${daysLeft}d`;

  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 px-1 -mx-1 rounded">
      {assignName && <MemberAvatar name={assignName} id={assignId} size={22} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          {ticket.ticketNo && (
            <span className="text-[10px] font-mono text-slate-400">#{ticket.ticketNo}</span>
          )}
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: cfg.color + '18', color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[12.5px] text-slate-800 truncate cursor-default">{subject}</div>
            </TooltipTrigger>
            <TooltipContent side="top">{subject}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {dueLabel && (
        <div className={`text-[10.5px] font-semibold shrink-0 ${dueCls}`}>{dueLabel}</div>
      )}
    </div>
  );
};

export default TaskRow;
