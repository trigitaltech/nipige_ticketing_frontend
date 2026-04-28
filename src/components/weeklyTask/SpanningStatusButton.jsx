import { useState, useRef } from 'react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import StatusDropdownPortal from './StatusDropdownPortal';

const SpanningStatusButton = ({ ticket, onStatusChange }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  const triggerRef = useRef(null);
  const status = ticket.status || 'OPEN';
  const isDone = status === 'RESOLVED' || status === 'CLOSED';

  return (
    <div className="relative shrink-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              ref={triggerRef}
              className="w-[11px] h-[11px] rounded-[2px] border-[1.5px] flex items-center justify-center cursor-pointer"
              style={{
                borderColor: isDone ? '#16a34a' : '#94a3b8',
                background: isDone ? '#16a34a' : '#ffffff',
                color: '#ffffff',
              }}
              onClick={(e) => { e.stopPropagation(); setStatusOpen(v => !v); }}
            >
              {isDone && (
                <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    </div>
  );
};

export default SpanningStatusButton;
