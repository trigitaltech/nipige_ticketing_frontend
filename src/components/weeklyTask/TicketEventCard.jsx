import { useState, useEffect, useRef } from 'react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { HOUR_HEIGHT, TICKET_STATUS_CONFIG, TICKET_STATUS_OPTIONS } from './constants';
import { fmt12, parseEstimateHours } from './utils';
import StatusDropdownPortal from './StatusDropdownPortal';
import UserAvatar from './UserAvatar';

const TicketEventCard = ({ ticket, onOpen, onStatusChange }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  const dropdownRef = useRef(null);
  const status = ticket.status || 'OPEN';

  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setStatusOpen(false);
        e.stopPropagation();
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [statusOpen]);

  const cfg = TICKET_STATUS_CONFIG[status] || TICKET_STATUS_CONFIG.OPEN;
  const isDone = status === 'RESOLVED' || status === 'CLOSED';
  const evtChkBorder = isDone ? '#16a34a' : '#94a3b8';
  const evtChkBg = isDone ? '#16a34a' : '#ffffff';

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
  const assigneeName = ticket.assignTo?.name || ticket.assignTo?.username || ticket.assignTo?.email || '';

  return (
    <div
      data-wt-event=""
      role="button"
      tabIndex={0}
      className="absolute left-[3px] right-[3px] w-[calc(100%-6px)] rounded-lg py-[5px] px-[7px] overflow-visible flex items-start gap-[5px] cursor-pointer transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-[#3B2FB1] focus-visible:outline-offset-1"
      style={{ top: `${top}px`, height: `${heightPx}px`, background: cfg.cardBg, color: cfg.cardText }}
      title={ticket.subject}
      onClick={() => { if (statusOpen) { setStatusOpen(false); return; } onOpen(ticket); }}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(ticket); if (e.key === 'Escape') setStatusOpen(false); }}
    >
      <div className="relative shrink-0 mt-px">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                role="button"
                tabIndex={0}
                className="w-[13px] h-[13px] rounded-[3px] border-[1.5px] flex items-center justify-center"
                style={{ borderColor: evtChkBorder, background: evtChkBg, color: 'white' }}
                onClick={(e) => { e.stopPropagation(); setStatusOpen(v => !v); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setStatusOpen(v => !v); } }}
              >
                {isDone && (
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">Change status</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {statusOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 top-[18px] z-[300] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-200 py-1 min-w-[140px]"
            onClick={e => e.stopPropagation()}
          >
            {TICKET_STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`w-full flex items-center gap-2 px-3 py-[6px] text-[12px] cursor-pointer transition-colors hover:bg-slate-50 text-slate-700 border-0 bg-transparent ${opt.value === status ? 'font-semibold' : 'font-normal'}`}
                onClick={(e) => { e.stopPropagation(); onStatusChange(ticket, opt.value); setStatusOpen(false); }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: opt.dotColor }} />
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {assigneeName && (
        <span title={assigneeName} className="shrink-0 mt-px">
          <UserAvatar name={assigneeName} size={14} />
        </span>
      )}

      <div className="flex-1 min-w-0 overflow-hidden">
        {isShort ? (
          <span className="text-[11.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis block">
            {ticket.subject}
            <span className="font-normal text-[10.5px] opacity-[0.65]"> {timeStr}</span>
          </span>
        ) : (
          <>
            <div className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{ticket.subject}</div>
            <div className="text-[10.5px] opacity-75 mt-0.5 whitespace-nowrap">{timeStr}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketEventCard;
