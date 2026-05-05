import { useState } from 'react';
import { TICKET_STATUS_CONFIG, MONTH_MAX_VISIBLE } from './constants';
import { isSameDay, packLanes, isOffDay } from './utils';
import MonthTicketChip from './MonthTicketChip';
import SpanningStatusButton from './SpanningStatusButton';
import UserAvatar from './UserAvatar';

const MonthView = ({ currentDate, weeklyTickets, statusFilter, onOpenTicket, onStatusChange }) => {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = `${year}-${month}`;
  const [expandedState, setExpandedState] = useState({ key: monthKey, rows: new Set() });
  const expandedRows = expandedState.key === monthKey ? expandedState.rows : new Set();
  const addExpandedRow = (rowIdx) => setExpandedState(prev => ({
    key: monthKey,
    rows: new Set([...(prev.key === monthKey ? prev.rows : []), rowIdx]),
  }));

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(1 - startOffset);

  const allCells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const totalRows = allCells[35].getMonth() !== month ? 5 : 6;
  const cells = allCells.slice(0, totalRows * 7);
  const weeks = Array.from({ length: totalRows }, (_, r) => cells.slice(r * 7, r * 7 + 7));

  const allTickets = Array.isArray(weeklyTickets) ? weeklyTickets : [];
  const allowedStatuses = Array.isArray(statusFilter) ? statusFilter : [];
  const isVisible = (t) => allowedStatuses.includes(t.status || 'OPEN');
  const isSpanningTicket = (t) => {
    if (!t.startDate || !t.endDate) return false;
    const s = new Date(t.startDate);
    const e = new Date(t.endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    return !isSameDay(s, e);
  };

  const singleDayForDate = (date) =>
    isOffDay(date) ? [] :
    allTickets.filter(t =>
      t.startDate &&
      isSameDay(new Date(t.startDate), date) &&
      !isSpanningTicket(t) &&
      isVisible(t)
    );

  const getWeekSpanning = (weekDates) => {
    const ws = new Date(weekDates[0]); ws.setHours(0, 0, 0, 0);
    const we = new Date(weekDates[6]); we.setHours(23, 59, 59, 999);
    return allTickets
      .filter(t => {
        if (!isSpanningTicket(t) || !isVisible(t)) return false;
        const s = new Date(t.startDate);
        const e = new Date(t.endDate);
        return s <= we && e >= ws;
      })
      .map(t => {
        const s = new Date(t.startDate);
        const e = new Date(t.endDate);
        let startCol = 0, endCol = 6;
        weekDates.forEach((d, i) => {
          if (isSameDay(d, s)) startCol = i;
          if (isSameDay(d, e)) endCol = i;
        });
        if (s < ws) startCol = 0;
        if (e > we) endCol = 6;
        return { ticket: t, startCol, endCol, startsBeforeWeek: s < ws, endsAfterWeek: e > we };
      });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="grid shrink-0 border-b border-slate-200" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center py-[7px] text-[11px] font-semibold text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div>
          {weeks.map((weekDates, rowIdx) => {
            const spanning = getWeekSpanning(weekDates);
            const spanningWithLanes = packLanes(spanning);
            const rowExpanded = expandedRows.has(rowIdx);

            return (
              <div
                key={rowIdx}
                className="relative border-b border-slate-100 last:border-b-0"
                style={rowExpanded ? { minHeight: '128px' } : { height: '128px' }}
              >
                <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {weekDates.map((date, ci) => (
                    <div
                      key={ci}
                      className={`border-r border-slate-100 last:border-r-0 ${date.getMonth() !== month ? 'bg-slate-50/60' : isOffDay(date) ? 'bg-slate-50/70' : ''}`}
                    />
                  ))}
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {weekDates.map((date, ci) => {
                    const dayTix = singleDayForDate(date);
                    const cellSpanning = spanningWithLanes.filter(e =>
                      e.startCol <= ci && e.endCol >= ci && (rowExpanded || e.laneIdx < MONTH_MAX_VISIBLE)
                    );
                    const cellOccupied = cellSpanning.length > 0
                      ? Math.max(...cellSpanning.map(e => e.laneIdx)) + 1
                      : 0;
                    const cellTopPad = 36 + cellOccupied * 22;
                    const chipsLimit = Math.max(0, MONTH_MAX_VISIBLE - cellOccupied);
                    const visibleChips = rowExpanded ? dayTix : dayTix.slice(0, chipsLimit);
                    const hiddenChips = rowExpanded ? 0 : Math.max(0, dayTix.length - chipsLimit);
                    const hiddenSpanning = rowExpanded ? 0 : spanningWithLanes.filter(
                      e => e.startCol <= ci && e.endCol >= ci && e.laneIdx >= MONTH_MAX_VISIBLE
                    ).length;
                    const totalHidden = hiddenChips + hiddenSpanning;
                    return (
                      <div key={ci} className="px-1 pb-1.5 flex flex-col gap-[2px] overflow-hidden" style={{ paddingTop: `${cellTopPad}px` }}>
                        {visibleChips.map(ticket => (
                          <MonthTicketChip
                            key={ticket._id || ticket.id}
                            ticket={ticket}
                            onOpen={onOpenTicket}
                            onStatusChange={onStatusChange}
                          />
                        ))}
                        {!rowExpanded && totalHidden > 0 && (
                          <button
                            type="button"
                            className="text-[10px] text-slate-400 pl-1 font-medium text-left cursor-pointer border-0 bg-transparent hover:text-slate-600 transition-colors"
                            onClick={() => addExpandedRow(rowIdx)}
                          >
                            +{totalHidden} more
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="absolute top-0 left-0 right-0 grid pointer-events-none" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {weekDates.map((date, ci) => {
                    const isToday = isSameDay(date, today);
                    const inMonth = date.getMonth() === month;
                    return (
                      <div key={ci} className="p-1.5">
                        <span className={`w-[22px] h-[22px] inline-flex items-center justify-center text-[12px] font-semibold rounded-full ${
                          isToday ? 'bg-[#3B2FB1] text-white' : inMonth ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {date.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {spanningWithLanes.length > 0 && (
                  <div className="absolute left-0 right-0" style={{ top: '36px', zIndex: 1 }}>
                    {spanningWithLanes
                      .filter(e => rowExpanded || e.laneIdx < MONTH_MAX_VISIBLE)
                      .map(({ ticket, startCol, endCol, startsBeforeWeek, endsAfterWeek, laneIdx }) => {
                        const cfg = TICKET_STATUS_CONFIG[ticket.status || 'OPEN'] || TICKET_STATUS_CONFIG.OPEN;
                        const borderRadius = !startsBeforeWeek && !endsAfterWeek ? '4px'
                          : !startsBeforeWeek ? '4px 0 0 4px'
                          : !endsAfterWeek ? '0 4px 4px 0'
                          : '0';
                        const lx = startsBeforeWeek ? 0 : 3;
                        const rx = endsAfterWeek ? 0 : 3;
                        return (
                          <div
                            key={ticket._id || ticket.id}
                            className="absolute h-[20px] flex items-center gap-1.5 px-1.5 cursor-pointer overflow-visible transition-[filter] hover:brightness-95 select-none"
                            style={{
                              top: `${laneIdx * 22}px`,
                              left: `calc(${(startCol / 7) * 100}% + ${lx}px)`,
                              width: `calc(${((endCol - startCol + 1) / 7) * 100}% - ${lx + rx}px)`,
                              background: cfg.cardBg,
                              color: cfg.cardText,
                              borderRadius,
                            }}
                            onClick={() => onOpenTicket(ticket)}
                            title={ticket.subject}
                          >
                            <SpanningStatusButton ticket={ticket} onStatusChange={onStatusChange} />
                            {(() => {
                              const an = ticket.assignTo?.name || ticket.assignTo?.username || ticket.assignTo?.email || '';
                              return an ? (
                                <span title={an} className="shrink-0">
                                  <UserAvatar name={an} size={14} />
                                </span>
                              ) : null;
                            })()}
                            <span className="text-[11px] font-medium truncate">{ticket.subject}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthView;
