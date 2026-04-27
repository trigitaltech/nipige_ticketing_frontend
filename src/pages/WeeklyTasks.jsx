import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchWeeklyTasks } from '../redux/weeklyTaskSlice';
import { updateTicket, updateTicketStatusOptimistic } from '../redux/ticketSlice';
import { fetchProjects } from '../redux/projectSlice';
import { fetchUsers } from '../redux/userSlice';
import { Loader2, ChevronLeft, ChevronRight, Plus, X, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const HOUR_HEIGHT = 40;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_OPTIONS = [
  { value: 'On Going',    label: 'On Going' },
  { value: 'Completed',   label: 'Completed' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'On Hold',     label: 'On Hold' },
];

const sanitizeTimeInput = (val) => val.replace(/[^\dhHmM\s]/g, '');

const STATUS_CHIP = {
  'On Going':    { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  'Completed':   { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
  'Not Started': { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  'On Hold':     { bg: '#fce7f3', color: '#9f1239', border: '#fda4af' },
};

const isTicketAssignedToUser = (ticket, user) => {
  const ticketAssigneeId = ticket?.assignTo?._id || ticket?.assignTo?.id || '';
  const userId = user?._id || '';
  const ticketAssigneeEmail = ticket?.assignTo?.email || ticket?.assignTo?.authentication?.email || '';
  const userEmail = user?.authentication?.email || '';

  return Boolean(
    (ticketAssigneeId && userId && String(ticketAssigneeId) === String(userId)) ||
    (ticketAssigneeEmail && userEmail && ticketAssigneeEmail === userEmail)
  );
};

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const getWeekDates = (base) => {
  const date = new Date(base);
  const day = date.getDay();
  const mon = new Date(date);
  mon.setDate(date.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
};

const formatWeekRange = (dates) => {
  const s = dates[0], e = dates[6];
  if (s.getFullYear() === e.getFullYear()) {
    if (s.getMonth() === e.getMonth())
      return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
    return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${MONTHS[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
};

const fmt12 = (date) => {
  const h = date.getHours(), m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const pad2 = (value) => String(value).padStart(2, '0');
const toDateTimeLocalValue = (baseDate, mins) => {
  const date = new Date(baseDate);
  date.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const formatHourLabel = (h) => {
  if (h === 0) return '';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

const yToMins = (y) => {
  const raw = (y / HOUR_HEIGHT) * 60;
  return Math.max(0, Math.min(Math.round(raw / 15) * 15, 24 * 60 - 1));
};

const minsToLabel = (totalMins) => {
  const clamped = Math.max(0, Math.min(totalMins, 24 * 60 - 1));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const parseEstimateHours = (str) => {
  if (!str) return 1;
  const h = str.match(/(\d+)\s*h/i);
  const m = str.match(/(\d+)\s*m/i);
  const total = (h ? Number(h[1]) : 0) + (m ? Number(m[1]) : 0) / 60;
  return total > 0 ? total : 1;
};

const isAllDayTicket = (ticket) => {
  if (!ticket?.startDate || !ticket?.endDate) return false;
  const start = new Date(ticket.startDate);
  const end = new Date(ticket.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return (end - start) > 8 * 3_600_000;
};

const createEmptyWeekData = () =>
  Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, { projectNames: '', workDescription: '', time: '', status: '' }]));

// ─── Event card ──────────────────────────────────────────────────────────────
const TicketEventCard = ({ ticket, onOpen, onStatusChange }) => {
  const isDone = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
  const start = new Date(ticket.startDate);
  const top = (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT;

  let heightPx;
  if (ticket.endDate) {
    const end = new Date(ticket.endDate);
    const hrs = Math.max((end - start) / 3_600_000, 0.5);
    heightPx = hrs * HOUR_HEIGHT;
  } else {
    heightPx = parseEstimateHours(ticket.estimateTime) * HOUR_HEIGHT;
  }
  heightPx = Math.max(heightPx, 28);

  const timeStr = ticket.endDate
    ? `${fmt12(start)} – ${fmt12(new Date(ticket.endDate))}`
    : fmt12(start);
  const isShort = heightPx <= 44;

  return (
    <button
      type="button"
      data-wt-event=""
      className={`absolute left-[3px] right-[3px] w-[calc(100%-6px)] rounded-lg py-[5px] px-[7px] overflow-hidden border-0 flex items-start gap-[5px] cursor-pointer transition-[filter] text-left appearance-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-[#3B2FB1] focus-visible:outline-offset-1 ${isDone ? 'bg-teal-100 text-teal-900' : 'bg-pink-100 text-pink-900'}`}
      style={{ top: `${top}px`, height: `${heightPx}px` }}
      title={ticket.subject}
      onClick={() => onOpen(ticket)}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              className={`w-[13px] h-[13px] rounded-[3px] border-[1.5px] shrink-0 mt-px flex items-center justify-center ${isDone ? 'bg-teal-500 border-teal-500 text-white opacity-100' : 'border-current opacity-60'}`}
              onClick={(e) => { e.stopPropagation(); onStatusChange(ticket); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onStatusChange(ticket); } }}
            >
              {isDone && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{isDone ? 'Completed' : 'Mark as complete'}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="flex-1 min-w-0">
        {isShort ? (
          <span className={`text-[11.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis block${isDone ? ' line-through opacity-60' : ''}`}>
            {ticket.subject}
            <span className={`font-normal text-[10.5px]${isDone ? ' opacity-[0.65]' : ' opacity-[0.65]'}`}> {timeStr}</span>
          </span>
        ) : (
          <>
            <div className={`text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis${isDone ? ' line-through opacity-60' : ''}`}>{ticket.subject}</div>
            <div className={`text-[10.5px] opacity-75 mt-0.5 whitespace-nowrap${isDone ? ' line-through opacity-60' : ''}`}>{timeStr}</div>
          </>
        )}
      </div>
    </button>
  );
};

// ─── Day edit modal ───────────────────────────────────────────────────────────
const DayModal = ({ dayIndex, date, data, projects, initialTime, onSave, onClose }) => {
  const [form, setForm] = useState({ ...data, time: initialTime || data.time });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 bg-slate-900/[0.32] flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] w-[400px] max-w-[92vw] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between py-[15px] px-[18px] border-b border-slate-100">
          <span className="text-sm font-bold text-slate-900">
            {DAY_NAMES[date.getDay()]}, {MONTHS[date.getMonth()]} {date.getDate()}
          </span>
          <button
            className="w-7 h-7 rounded-md border-0 bg-slate-100 flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-200 transition-colors"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        <div className="py-4 px-[18px] flex flex-col gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em] mb-1">Project</label>
            <Select value={form.projectNames} onValueChange={v => set('projectNames', v)}>
              <SelectTrigger className="h-9 text-[13px] w-full"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {Array.isArray(projects) && projects.map(p => {
                  const name = p.name || 'Untitled';
                  return <SelectItem key={p._id || p.id} value={name}>{name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em] mb-1">Work Description</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg py-2 px-2.5 text-[13px] resize-y outline-none text-slate-700 bg-slate-50 focus:border-[#3B2FB1] focus:shadow-[0_0_0_2px_rgba(59,47,177,0.12)]"
              placeholder="Describe work done..."
              value={form.workDescription}
              onChange={e => set('workDescription', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2.5">
            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em] mb-1">Time</label>
              <input
                className="w-full h-9 border border-slate-200 rounded-lg px-2.5 text-[13px] outline-none text-slate-700 bg-slate-50 focus:border-[#3B2FB1] focus:shadow-[0_0_0_2px_rgba(59,47,177,0.12)]"
                placeholder="e.g. 2h 30m"
                value={form.time}
                onChange={e => set('time', sanitizeTimeInput(e.target.value))}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em] mb-1">Status</label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="h-9 text-[13px] w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 py-3 px-[18px] border-t border-slate-100">
          <button
            className="h-[34px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer inline-flex items-center transition-colors bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="h-[34px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer border-0 inline-flex items-center transition-colors bg-[#3B2FB1] text-white hover:bg-[#2d2490]"
            onClick={() => onSave(dayIndex, form)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── User single-select dropdown (matches FilterDropdown style) ───────────────
const getUserName = (u) =>
  u?.authentication?.userName ||
  `${u?.name?.first || ''} ${u?.name?.last || ''}`.trim() ||
  u?.authentication?.email || 'Unknown';

const avatarColors = [
  '#5449D6', '#0880EA', '#f59e0b', '#299764', '#e11d48',
  '#7c3aed', '#0891b2', '#c2410c', '#15803d', '#9333ea',
];
const getAvatarColor = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};
const getInitials = (label) => {
  if (!label) return '?';
  const parts = label.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
};
const UserAvatar = ({ name, size = 22 }) => (
  <span
    className="shrink-0 rounded-full flex items-center justify-center text-white font-semibold"
    style={{ width: size, height: size, fontSize: size * 0.4, background: getAvatarColor(name) }}
  >
    {getInitials(name)}
  </span>
);

const UserCombobox = ({ users, selectedUserId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedUser = Array.isArray(users) && users.find(u => String(u._id) === selectedUserId);
  const selectedName = selectedUser ? getUserName(selectedUser) : null;

  const filtered = Array.isArray(users)
    ? users.filter(u => getUserName(u).toLowerCase().includes(search.toLowerCase()))
    : [];

  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = Math.max(rect.width, 230);
      const dropdownHeight = 300;
      const spaceBelow = window.innerHeight - rect.bottom;
      const left = Math.min(rect.left, window.innerWidth - dropdownWidth - 8);
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setDropdownStyle({ top: rect.top - dropdownHeight - 4, left, width: dropdownWidth });
      } else {
        setDropdownStyle({ top: rect.bottom + 4, left, width: dropdownWidth });
      }
    }
    setOpen(o => !o);
    if (open) setSearch('');
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="h-8 flex items-center justify-between px-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-lg text-[13px] cursor-pointer gap-1.5 overflow-hidden min-w-[130px]"
      >
        {selectedName ? (
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            <UserAvatar name={selectedName} size={20} />
            <span className="text-[#5449D6] font-medium truncate">{selectedName}</span>
          </div>
        ) : (
          <span className="text-slate-400 flex-1">All</span>
        )}
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] overflow-hidden"
          style={dropdownStyle}
        >
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search user…"
                className="flex-1 text-[13px] bg-transparent outline-none text-slate-700 placeholder-slate-400"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[220px] overflow-y-auto pb-1.5">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-slate-400 text-center">No results found</div>
            ) : (
              filtered.map(u => {
                const id = String(u._id);
                const isSelected = id === selectedUserId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { onSelect(id); setOpen(false); setSearch(''); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <UserAvatar name={getUserName(u)} size={28} />
                    <span className="flex-1 text-left truncate font-medium text-slate-700">{getUserName(u)}</span>
                    {isSelected && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5449D6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const WeeklyTasks = ({ onOpenCreateModal }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { projects } = useSelector(s => s.projects);
  const { tickets } = useSelector(s => s.tickets);
  const { tasks: weeklyTasks, loading: fetchingTasks } = useSelector(s => s.weeklyTasks);
  const { users } = useSelector(s => s.users);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState(createEmptyWeekData());
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [editingDay, setEditingDay] = useState(null);
  const [drag, setDrag] = useState(null);

  const gridRef = useRef(null);
  const dragRef = useRef(null);

  const currentUser = user?.response?.user || user;
  const weekDates = getWeekDates(currentDate);
  const today = new Date();

  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = 9 * HOUR_HEIGHT;
  }, []);

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);
  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  useEffect(() => {
    if (currentUser?._id && !selectedUserId)
      setSelectedUserId(String(currentUser._id));
  }, [currentUser, selectedUserId]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return currentUser;
    return (Array.isArray(users) && users.find(u => String(u._id) === selectedUserId)) || currentUser;
  }, [users, selectedUserId, currentUser]);

  const assignedTickets = useMemo(
    () => Array.isArray(tickets)
      ? tickets.filter(ticket => isTicketAssignedToUser(ticket, selectedUser))
      : [],
    [tickets, selectedUser]
  );

  useEffect(() => {
    if (!selectedUserId) return;
    setWeekData(createEmptyWeekData());
    dispatch(fetchWeeklyTasks({
      userId: selectedUserId,
      weekStartDate: weekDates[0].toISOString(),
      weekEndDate: weekDates[6].toISOString(),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, currentDate, selectedUserId]);

  useEffect(() => {
    const nd = createEmptyWeekData();
    let found = null;
    if (Array.isArray(weeklyTasks) && weeklyTasks.length > 0) {
      const ws = weekDates[0].toISOString().split('T')[0];
      found = weeklyTasks.find(t =>
        t.weekStartDate && new Date(t.weekStartDate).toISOString().split('T')[0] === ws
      ) ?? weeklyTasks[0];
      if (found?.entries) {
        found.entries.forEach(entry => {
          const idx = weekDates.findIndex(d => isSameDay(d, new Date(entry.date)));
          if (idx !== -1) nd[idx] = { projectNames: entry.projectNames || '', workDescription: entry.workDescription || '', time: entry.time || '', status: entry.status || '' };
        });
      }
    }
    weekDates.forEach((date, i) => {
      const d = nd[i];
      if (!d.projectNames && !d.workDescription && !d.time && !d.status) {
        const t = assignedTickets.find(t =>
          t.startDate &&
          isSameDay(new Date(t.startDate), date) &&
          isAllDayTicket(t)
        );
        if (t) nd[i] = { projectNames: t.project?.name || '', workDescription: t.subject || '', time: t.estimateTime || '', status: '' };
      }
    });
    setWeekData(nd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyTasks, assignedTickets]);

  // ── Drag logic ──────────────────────────────────────────────────────────────
  const getGridY = useCallback((clientY) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(
      clientY - rect.top + (gridRef.current?.scrollTop || 0),
      24 * HOUR_HEIGHT
    ));
  }, []);

  const handleColMouseDown = useCallback((e, dayIndex) => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-wt-event]')) return;
    e.preventDefault();
    const y = getGridY(e.clientY);
    const state = { dayIndex, startY: y, endY: y };
    dragRef.current = state;
    setDrag(state);
  }, [getGridY]);

  const handleDragCreate = useCallback((dayIndex, startMins, endMins) => {
    if (typeof onOpenCreateModal !== 'function') return;

    const baseDate = weekDates[dayIndex];
    if (!baseDate) return;

    onOpenCreateModal({
      startDate: toDateTimeLocalValue(baseDate, startMins),
      endDate: toDateTimeLocalValue(baseDate, endMins),
      timeEstimateMs: Math.max(endMins - startMins, 0) * 60 * 1000,
      assignTo: currentUser?._id ? {
        id: currentUser._id,
        name: currentUser?.authentication?.userName || `${currentUser?.name?.first || ''} ${currentUser?.name?.last || ''}`.trim(),
        email: currentUser?.authentication?.email,
        userType: currentUser?.category,
        phone: currentUser?.authentication?.phone,
      } : null,
    });
  }, [currentUser, onOpenCreateModal, weekDates]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      const y = Math.max(0, Math.min(
        (() => {
          const rect = gridRef.current?.getBoundingClientRect();
          if (!rect) return dragRef.current.endY;
          return e.clientY - rect.top + (gridRef.current?.scrollTop || 0);
        })(),
        24 * HOUR_HEIGHT
      ));
      const next = { ...dragRef.current, endY: y };
      dragRef.current = next;
      setDrag({ ...next });
    };

    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      setDrag(null);

      const minY = Math.min(d.startY, d.endY);
      const maxY = Math.max(d.startY, d.endY);

      let startMins, endMins;
      if (maxY - minY < HOUR_HEIGHT / 4) {
        startMins = yToMins(d.startY);
        endMins   = Math.min(startMins + 60, 24 * 60 - 1);
      } else {
        startMins = yToMins(minY);
        endMins   = yToMins(maxY);
        if (endMins - startMins <= 0) return;
      }

      handleDragCreate(d.dayIndex, startMins, endMins);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [handleDragCreate]);
  // ────────────────────────────────────────────────────────────────────────────

  const navigateWeek = useCallback((dir) => {
    setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + dir * 7); return d; });
  }, []);

  const handleDaySave = (idx, data) => {
    setWeekData(prev => ({ ...prev, [idx]: data }));
    setEditingDay(null);
  };

  const handleModalClose = () => {
    setEditingDay(null);
  };

  const ticketsForDay = (date) =>
    assignedTickets.filter(t => t.startDate && isSameDay(new Date(t.startDate), date));

  const handleOpenTicket = useCallback((ticket) => {
    const id = ticket?._id || ticket?.id;
    if (id) navigate(`/tickets/${id}`, { state: { from: '/weekly-tasks' } });
  }, [navigate]);

  const handleMarkComplete = useCallback((ticket) => {
    const ticketId = ticket._id || ticket.id;
    if (!ticketId || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return;
    dispatch(updateTicketStatusOptimistic({ ticketId, newStatus: 'RESOLVED' }));
    dispatch(updateTicket({ ticketId, ticketData: { ...ticket, status: 'RESOLVED' } }));
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[14px] pb-3 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <button
            className="h-[28px] w-[28px] border border-slate-200 rounded-lg bg-white inline-flex items-center justify-center text-slate-500 cursor-pointer transition-colors hover:bg-slate-100"
            onClick={() => navigateWeek(-1)}
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-[15px] font-bold text-slate-800 px-1">{formatWeekRange(weekDates)}</h2>
          <button
            className="h-[28px] w-[28px] border border-slate-200 rounded-lg bg-white inline-flex items-center justify-center text-slate-500 cursor-pointer transition-colors hover:bg-slate-100"
            onClick={() => navigateWeek(1)}
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="h-[28px] border border-slate-200 rounded-lg bg-white inline-flex items-center justify-center text-slate-500 cursor-pointer text-[13px] font-medium px-4 transition-colors hover:bg-slate-100"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-[5px]">
          <UserCombobox users={users} selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="h-[28px] min-w-[28px] rounded-lg inline-flex items-center justify-center cursor-pointer transition-colors bg-[#3B2FB1] border border-[#3B2FB1] text-white hover:bg-[#2d2490]"
                  onClick={() => handleDragCreate(Math.floor(weekDates.findIndex(d => isSameDay(d, today)) >= 0 ? weekDates.findIndex(d => isSameDay(d, today)) : 0), 540, 1080)}
                >
                  <Plus size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Create new task</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Day header row */}
        <div className="grid grid-cols-[58px_repeat(7,1fr)] border-b border-slate-200 shrink-0 bg-white">
          <div className="border-r border-slate-200 text-[10px] font-bold text-slate-400 tracking-[0.06em] flex items-center justify-center">IST</div>
          {weekDates.map((date, i) => {
            const isToday = isSameDay(date, today);
            return (
              <div key={i} className="flex flex-col items-center pt-[9px] pb-[7px] border-r border-slate-100 last:border-r-0">
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.09em] mb-[5px]">{DAY_NAMES[date.getDay()].toUpperCase()}</span>
                <span className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm font-semibold${isToday ? ' bg-[#3B2FB1] text-white' : ' text-slate-700'}`}>
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* All-day / work-log row */}
        <div className="grid grid-cols-[58px_repeat(7,1fr)] border-b border-slate-200 min-h-[46px] shrink-0">
          <div className="border-r border-slate-200 text-[10px] text-slate-400 flex items-center justify-center font-semibold tracking-[0.04em]">All-day</div>
          {weekDates.map((_, i) => {
            const d = weekData[i];
            const has = d?.projectNames || d?.workDescription || d?.time || d?.status;
            const chip = STATUS_CHIP[d?.status] || STATUS_CHIP['Not Started'];
            return (
              <div key={i} className="border-r border-slate-100 py-[5px] px-1 flex items-center last:border-r-0">
                {has ? (
                  <button
                    className="w-full border border-transparent rounded-[6px] py-1 px-2 text-[11px] text-left cursor-pointer flex flex-col gap-px transition-[filter] hover:brightness-[0.94]"
                    style={{ background: chip.bg, color: chip.color, borderColor: chip.border }}
                    onClick={() => setEditingDay(i)}
                  >
                    <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{d.projectNames || d.workDescription || 'Work log'}</span>
                    {d.time && <span className="text-[10px] opacity-[0.72]">{d.time}</span>}
                  </button>
                ) : (
                  <button
                    className="w-[22px] h-[22px] border-[1.5px] border-dashed border-slate-300 rounded-[5px] flex items-center justify-center text-slate-400 cursor-pointer bg-transparent m-auto transition-colors hover:border-[#3B2FB1] hover:text-[#3B2FB1]"
                    onClick={() => handleDragCreate(i, 540, 1080)}
                    title="Create task"
                  >
                    <Plus size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Scrollable time grid */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={gridRef}>
          <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>

            {/* Hour lines + labels */}
            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 flex items-start pointer-events-none" style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                <span className="w-[58px] shrink-0 text-[10.5px] text-slate-400 text-right pr-[10px] -translate-y-[7px] whitespace-nowrap border-r border-slate-200 self-stretch">{formatHourLabel(h)}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            ))}

            {/* Day columns with events */}
            <div className="absolute inset-0 left-[58px] grid grid-cols-7">
              {weekDates.map((date, i) => {
                const isDraggingThisCol = drag?.dayIndex === i;
                const dragTop    = drag ? Math.min(drag.startY, drag.endY) : 0;
                const dragHeight = drag ? Math.abs(drag.endY - drag.startY) : 0;
                const dragStartMins = drag ? yToMins(Math.min(drag.startY, drag.endY)) : 0;
                const dragEndMins   = drag ? yToMins(Math.max(drag.startY, drag.endY)) : 0;

                return (
                  <div
                    key={i}
                    className={`relative border-r border-slate-100 cursor-crosshair select-none last:border-r-0${isSameDay(date, today) ? ' bg-[rgba(59,47,177,0.02)]' : ''}`}
                    onMouseDown={e => handleColMouseDown(e, i)}
                  >
                    {ticketsForDay(date).map(ticket => (
                      <TicketEventCard
                        key={ticket._id || ticket.id}
                        ticket={ticket}
                        onOpen={handleOpenTicket}
                        onStatusChange={handleMarkComplete}
                      />
                    ))}

                    {/* Drag selection overlay */}
                    {isDraggingThisCol && dragHeight > 4 && (
                      <div
                        className="absolute left-0.5 right-0.5 bg-[rgba(59,47,177,0.12)] border-2 border-[#3B2FB1] rounded-[7px] pointer-events-none z-[6] overflow-hidden min-h-1"
                        style={{ top: dragTop, height: dragHeight }}
                      >
                        <span className="block text-[10px] font-bold text-[#3B2FB1] py-[3px] px-[6px] whitespace-nowrap">
                          {minsToLabel(dragStartMins)} – {minsToLabel(dragEndMins)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Day edit modal */}
      {editingDay !== null && (
        <DayModal
          dayIndex={editingDay}
          date={weekDates[editingDay]}
          data={weekData[editingDay]}
          projects={projects}
          initialTime=""
          onSave={handleDaySave}
          onClose={handleModalClose}
        />
      )}

      {/* Loading overlay */}
      {fetchingTasks && (
        <div className="absolute inset-0 bg-white/[0.65] flex items-center justify-center z-[100] text-[#3B2FB1]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}
    </div>
  );
};

export default WeeklyTasks;
