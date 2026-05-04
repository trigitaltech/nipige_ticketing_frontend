import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchWeeklyTasks, fetchWeeklyTickets, updateWeeklyTicketStatusOptimistic } from '../redux/weeklyTaskSlice';
import { updateTicket } from '../redux/ticketSlice';
import { fetchProjects } from '../redux/projectSlice';
import { fetchUsers } from '../redux/userSlice';
import { getProjectMembersAPI } from '../services/projectApi';
import { Loader2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import usePersistentState from '../hooks/usePersistentState';

import { HOUR_HEIGHT, HOURS, FULL_DAY_NAMES, MONTHS, FULL_MONTHS, STATUS_CHIP } from '../components/weeklyTask/constants';
import {
  isSameDay, getWeekDates, formatWeekRange, toDateTimeLocalValue,
  formatHourLabel, yToMins, minsToLabel, isAllDayTicket, createEmptyWeekData,
} from '../components/weeklyTask/utils';
import DayModal from '../components/weeklyTask/DayModal';
import UserCombobox from '../components/weeklyTask/UserCombobox';
import ViewSwitcherDropdown from '../components/weeklyTask/ViewSwitcherDropdown';
import MonthView from '../components/weeklyTask/MonthView';
import MonthTicketChip from '../components/weeklyTask/MonthTicketChip';
import TicketEventCard from '../components/weeklyTask/TicketEventCard';

const WeeklyTasks = ({ onOpenCreateModal }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { projects } = useSelector(s => s.projects);
  const { tasks: weeklyTasks, loading: fetchingTasks, weeklyTickets } = useSelector(s => s.weeklyTasks);
  const { users } = useSelector(s => s.users);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState(createEmptyWeekData());
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [editingDay, setEditingDay] = useState(null);
  const [drag, setDrag] = useState(null);
  const [expandedAllDay, setExpandedAllDay] = useState(null);
  const [showClosed, setShowClosed] = usePersistentState('weeklyTasks.showClosed', false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [viewMode, setViewMode] = usePersistentState('weeklyTasks.viewMode', 'week');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const gridRef = useRef(null);
  const dragRef = useRef(null);

  const currentUser = user?.response?.user || user;
  const weekDates = getWeekDates(currentDate);
  const today = new Date();
  const displayDates = viewMode === 'day' ? [currentDate] : weekDates;
  const dateRangeLabel = viewMode === 'day'
    ? `${FULL_DAY_NAMES[currentDate.getDay()]}, ${FULL_MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}`
    : viewMode === 'month'
      ? `${FULL_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : formatWeekRange(weekDates);

  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = 9 * HOUR_HEIGHT;
  }, []);

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);
  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  useEffect(() => {
    if (currentUser?._id && !selectedUserId)
      setSelectedUserId(String(currentUser._id));
  }, [currentUser, selectedUserId]);

  useEffect(() => {
    setExpandedAllDay(null);
  }, [currentDate]);

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
    if (!selectedProjectId) {
      setProjectMembers([]);
      return;
    }
    getProjectMembersAPI(selectedProjectId).then((res) => {
      const { owner, members = [] } = res?.data || {};
      const all = [];
      if (owner) all.push(owner);
      members.forEach(m => all.push(m));
      setProjectMembers(all.map(m => ({
        _id: m.id,
        authentication: { userName: m.name, email: m.email },
      })));
    }).catch(() => setProjectMembers([]));
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchWeeklyTickets({ project: selectedProjectId }));
    } else if (selectedUserId) {
      dispatch(fetchWeeklyTickets({ assignTo: selectedUserId }));
    }
  }, [dispatch, selectedUserId, selectedProjectId]);

  useEffect(() => {
    const nd = createEmptyWeekData();
    if (Array.isArray(weeklyTasks) && weeklyTasks.length > 0) {
      const ws = weekDates[0].toISOString().split('T')[0];
      const found = weeklyTasks.find(t =>
        t.weekStartDate && new Date(t.weekStartDate).toISOString().split('T')[0] === ws
      ) ?? weeklyTasks[0];
      if (found?.entries) {
        found.entries.forEach(entry => {
          const idx = weekDates.findIndex(d => isSameDay(d, new Date(entry.date)));
          if (idx !== -1) nd[idx] = { projectNames: entry.projectNames || '', workDescription: entry.workDescription || '', time: entry.time || '', status: entry.status || '' };
        });
      }
    }
    setWeekData(nd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyTasks, weeklyTickets]);

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

    const baseDate = displayDates[dayIndex];
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
  }, [currentUser, onOpenCreateModal, displayDates]);

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
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'day') d.setDate(d.getDate() + dir);
      else if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
      else d.setDate(d.getDate() + dir * 7);
      return d;
    });
  }, [viewMode]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 'd' || e.key === 'D') setViewMode('day');
      else if (e.key === 'w' || e.key === 'W') setViewMode('week');
      else if (e.key === 'm' || e.key === 'M') setViewMode('month');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleDaySave = (idx, data) => {
    setWeekData(prev => ({ ...prev, [idx]: data }));
    setEditingDay(null);
  };

  const matchesProject = (t) => {
    if (!selectedProjectId) return true;
    const raw = t.project;
    const pid = typeof raw === 'string' ? raw : (raw?.id || raw?._id || raw?.projectId || '');
    return String(pid) === String(selectedProjectId);
  };

  const toCalendarDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const ticketsForDay = (date) =>
    (Array.isArray(weeklyTickets) ? weeklyTickets : []).filter(t => {
      if (!t.startDate || isAllDayTicket(t)) return false;
      if (!(showClosed || (t.status !== 'RESOLVED' && t.status !== 'CLOSED'))) return false;
      if (!matchesProject(t)) return false;
      const startMs = toCalendarDay(new Date(t.startDate));
      const viewMs = toCalendarDay(date);
      if (viewMs < startMs) return false;
      if (t.endDate) {
        const endMs = toCalendarDay(new Date(t.endDate));
        if (viewMs > endMs) return false;
      } else {
        // no end date — show only on start day in the time grid
        if (!isSameDay(new Date(t.startDate), date)) return false;
      }
      return true;
    });

  const allDayTicketsForDay = (date) =>
    (Array.isArray(weeklyTickets) ? weeklyTickets : []).filter(t => {
      if (!t.startDate || !isAllDayTicket(t)) return false;
      if (!(showClosed || (t.status !== 'RESOLVED' && t.status !== 'CLOSED'))) return false;
      if (!matchesProject(t)) return false;
      const startMs = toCalendarDay(new Date(t.startDate));
      const viewMs = toCalendarDay(date);
      if (viewMs < startMs) return false;
      if (t.endDate) {
        const endMs = toCalendarDay(new Date(t.endDate));
        if (viewMs > endMs) return false;
      }
      // no end date → show on startDate and all future days
      return true;
    });

  const handleOpenTicket = useCallback((ticket) => {
    const id = ticket?._id || ticket?.id;
    if (id) navigate(`/tickets/${id}`, { state: { from: '/weekly-tasks' } });
  }, [navigate]);

  const handleMarkComplete = useCallback((ticket, newStatus = 'RESOLVED') => {
    const ticketId = ticket._id || ticket.id;
    if (!ticketId) return;
    dispatch(updateWeeklyTicketStatusOptimistic({ ticketId, newStatus }));
    dispatch(updateTicket({ ticketId, ticketData: { ...ticket, status: newStatus } }));
  }, [dispatch]);

  return (
    <div className="flex flex-col bg-white overflow-hidden relative border border-slate-200 rounded-xl mx-2 mb-2" style={{ height: 'calc(100% - 0.5rem)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-1.5 h-[22px]">
          <button
            className="h-[22px] border border-slate-200 rounded-md bg-white inline-flex items-center justify-center text-slate-700 cursor-pointer text-[12px] font-medium px-3 transition-colors hover:bg-slate-50"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
          <ViewSwitcherDropdown viewMode={viewMode} onChange={setViewMode} />
          <div className="flex items-center">
            <button
              className="h-[22px] w-[22px] bg-white inline-flex items-center justify-center text-slate-500 cursor-pointer transition-colors hover:bg-slate-50 border-r border-slate-200"
              onClick={() => navigateWeek(-1)}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              className="h-[22px] w-[22px] bg-white inline-flex items-center justify-center text-slate-500 cursor-pointer transition-colors hover:bg-slate-50"
              onClick={() => navigateWeek(1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <span className="text-[14px] font-semibold text-slate-800 ml-1">{dateRangeLabel}</span>
        </div>
        <div className="flex items-center gap-[5px]">
          <Select value={selectedProjectId || '__all__'} onValueChange={(v) => setSelectedProjectId(v === '__all__' ? '' : v)}>
            <SelectTrigger className="!h-[22px] !py-0 border border-slate-200 rounded-md bg-white text-slate-700 text-[12px] font-medium px-3 shadow-none focus:ring-0 focus-visible:ring-0 w-auto min-w-[110px] max-w-[170px] gap-1">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Projects</SelectItem>
              {Array.isArray(projects) && projects.map((p) => {
                const pid = p._id || p.id;
                return <SelectItem key={pid} value={pid}>{p.name || p.projectName || 'Untitled'}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowClosed(v => !v)}
                  className={`h-[22px] px-3 rounded-full inline-flex items-center gap-1.5 text-[12px] font-medium border cursor-pointer transition-colors ${showClosed ? 'bg-[#3B2FB1]/10 border-[#3B2FB1]/30 text-[#3B2FB1]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                  </svg>
                  Closed
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Show closed tasks</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <UserCombobox users={selectedProjectId ? projectMembers : users} selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
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

      {/* Calendar body */}
      <div className="flex flex-1 min-h-0">

      {viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          weeklyTickets={weeklyTickets}
          showClosed={showClosed}
          onOpenTicket={handleOpenTicket}
          onStatusChange={handleMarkComplete}
        />
      ) : (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* Day header row — week view only */}
        {viewMode === 'week' && (
        <div className="grid border-b border-slate-200 shrink-0 bg-white" style={{ gridTemplateColumns: `52px repeat(${displayDates.length}, 1fr)` }}>
          <div className="border-r border-slate-200" />
          {displayDates.map((date, i) => {
            const isToday = isSameDay(date, today);
            return (
              <div key={i} className="flex flex-col items-center pt-2 pb-2 border-r border-slate-100 last:border-r-0">
                <span className={`text-[12px] font-medium mb-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {FULL_DAY_NAMES[date.getDay()]}
                </span>
                <span className={`text-[12px] font-medium ${isToday ? 'text-red-500' : 'text-slate-500'}`}>
                  {date.getDate()} {MONTHS[date.getMonth()]}
                </span>
              </div>
            );
          })}
        </div>
        )}

        {/* All-day / work-log row */}
        <div className="grid border-b border-slate-200 min-h-[36px] shrink-0" style={{ gridTemplateColumns: `52px repeat(${displayDates.length}, 1fr)` }}>
          <div className="border-r border-slate-200 text-[10px] text-slate-400 flex items-center justify-center font-medium">All day</div>
          {displayDates.map((date, i) => {
            const d = weekData[i];
            const has = d?.projectNames || d?.workDescription || d?.time || d?.status;
            const chip = STATUS_CHIP[d?.status] || STATUS_CHIP['Not Started'];
            const allDayTix = allDayTicketsForDay(date);
            const isEmpty = !has && allDayTix.length === 0;
            const MAX_VISIBLE = 2;
            const isExpanded = !!expandedAllDay;
            const visibleTix = isExpanded ? allDayTix : allDayTix.slice(0, MAX_VISIBLE);
            const hiddenCount = allDayTix.length - MAX_VISIBLE;
            return (
              <div key={i} className="border-r border-slate-100 py-[4px] px-1 flex flex-col gap-[3px] last:border-r-0 min-h-[36px] min-w-0">
                {visibleTix.map(ticket => (
                  <MonthTicketChip
                    key={ticket._id || ticket.id}
                    ticket={ticket}
                    onOpen={handleOpenTicket}
                    onStatusChange={handleMarkComplete}
                  />
                ))}
                {!isExpanded && hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedAllDay(true)}
                    className="text-left text-[10px] font-medium text-slate-400 hover:text-slate-600 hover:underline cursor-pointer px-1 leading-none py-[2px]"
                  >
                    +{hiddenCount} more
                  </button>
                )}
                {isExpanded && allDayTix.length > MAX_VISIBLE && (
                  <button
                    type="button"
                    onClick={() => setExpandedAllDay(null)}
                    className="text-left text-[10px] font-medium text-slate-400 hover:text-slate-600 hover:underline cursor-pointer px-1 leading-none py-[2px]"
                  >
                    less
                  </button>
                )}
                {has && (
                  <button
                    className="w-full border border-transparent rounded-[6px] py-1 px-2 text-[11px] text-left cursor-pointer flex flex-col gap-px transition-[filter] hover:brightness-[0.94]"
                    style={{ background: chip.bg, color: chip.color, borderColor: chip.border }}
                    onClick={() => d.ticketId ? handleOpenTicket({ _id: d.ticketId }) : setEditingDay(i)}
                  >
                    <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{d.projectNames || d.workDescription || 'Work log'}</span>
                    {d.time && <span className="text-[10px] opacity-[0.72]">{d.time}</span>}
                  </button>
                )}
                {isEmpty && (
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

            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 flex items-start pointer-events-none" style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                <span className="w-[52px] shrink-0 text-[10.5px] text-slate-400 text-right pr-[10px] -translate-y-[7px] whitespace-nowrap border-r border-slate-200 self-stretch">{formatHourLabel(h)}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
            ))}

            <div className="absolute inset-0 left-[52px] grid" style={{ gridTemplateColumns: `repeat(${displayDates.length}, 1fr)` }}>
              {displayDates.map((date, i) => {
                const isToday = isSameDay(date, today);
                const isDraggingThisCol = drag?.dayIndex === i;
                const dragTop    = drag ? Math.min(drag.startY, drag.endY) : 0;
                const dragHeight = drag ? Math.abs(drag.endY - drag.startY) : 0;
                const dragStartMins = drag ? yToMins(Math.min(drag.startY, drag.endY)) : 0;
                const dragEndMins   = drag ? yToMins(Math.max(drag.startY, drag.endY)) : 0;
                const nowTop = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

                return (
                  <div
                    key={i}
                    className="relative border-r border-slate-100 cursor-crosshair select-none last:border-r-0"
                    onMouseDown={e => handleColMouseDown(e, i)}
                  >
                    {isToday && (
                      <div
                        className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                        style={{ top: nowTop }}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                        <div className="flex-1 h-[1.5px] bg-red-500" />
                      </div>
                    )}

                    {ticketsForDay(date).map(ticket => (
                      <TicketEventCard
                        key={ticket._id || ticket.id}
                        ticket={ticket}
                        onOpen={handleOpenTicket}
                        onStatusChange={handleMarkComplete}
                      />
                    ))}

                    {isDraggingThisCol && dragHeight > 4 && (
                      <div
                        className="absolute left-0.5 right-0.5 bg-[rgba(59,47,177,0.12)] border border-[#3B2FB1]/40 rounded-[7px] pointer-events-none z-[6] overflow-hidden min-h-1"
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
      )}

      </div>{/* end Calendar body */}

      {editingDay !== null && (
        <DayModal
          dayIndex={editingDay}
          date={weekDates[editingDay]}
          data={weekData[editingDay]}
          projects={projects}
          initialTime=""
          onSave={handleDaySave}
          onClose={() => setEditingDay(null)}
        />
      )}

      {fetchingTasks && (
        <div className="absolute inset-0 bg-white/[0.65] flex items-center justify-center z-[100] text-[#3B2FB1]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}
    </div>
  );
};

export default WeeklyTasks;
