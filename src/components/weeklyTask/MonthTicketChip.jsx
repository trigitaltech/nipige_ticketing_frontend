import { useState, useRef } from 'react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { TICKET_STATUS_CONFIG } from './constants';
import StatusDropdownPortal from './StatusDropdownPortal';
import UserAvatar from './UserAvatar';

const MonthTicketChip = ({ ticket, onOpen, onStatusChange }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  const triggerRef = useRef(null);
  const status = ticket.status || 'OPEN';
  const cfg = TICKET_STATUS_CONFIG[status] || TICKET_STATUS_CONFIG.OPEN;
  const isDone = status === 'RESOLVED' || status === 'CLOSED';
  const chkBorder = isDone ? '#16a34a' : '#94a3b8';
  const chkBg = isDone ? '#16a34a' : '#ffffff';
  const assigneeName = ticket.assignTo?.name || ticket.assignTo?.username || ticket.assignTo?.email || '';

  return (
    <div
      className="w-full min-w-0 overflow-hidden flex items-center gap-[4px] text-[10.5px] font-medium px-1 h-[20px] rounded-[4px] cursor-pointer hover:opacity-90 leading-tight"
      style={{ background: cfg.cardBg, color: cfg.cardText }}
      onClick={() => { if (statusOpen) { setStatusOpen(false); return; } onOpen(ticket); }}
      title={ticket.subject}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              ref={triggerRef}
              role="button"
              className="w-[13px] h-[13px] rounded-[3px] border-[1.5px] flex items-center justify-center shrink-0"
              style={{ borderColor: chkBorder, background: chkBg, color: 'white' }}
              onClick={(e) => { e.stopPropagation(); setStatusOpen(v => !v); }}
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
        <StatusDropdownPortal
          anchorRef={triggerRef}
          status={status}
          onSelect={(val) => { onStatusChange(ticket, val); setStatusOpen(false); }}
          onClose={() => setStatusOpen(false)}
        />
      )}

      {assigneeName && (
        <span title={assigneeName} className="shrink-0">
          <UserAvatar name={assigneeName} size={14} />
        </span>
      )}

      <span className="truncate flex-1">{ticket.subject}</span>
    </div>
  );
};

export default MonthTicketChip;
