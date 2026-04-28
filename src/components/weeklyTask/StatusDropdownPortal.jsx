import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TICKET_STATUS_OPTIONS } from './constants';

const StatusDropdownPortal = ({ anchorRef, status, onSelect, onClose }) => {
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
        e.stopPropagation();
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-200 py-1 min-w-[140px]"
      style={{ top: pos.top, left: pos.left }}
      onClick={e => e.stopPropagation()}
    >
      {TICKET_STATUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`w-full flex items-center gap-2 px-3 py-[6px] text-[12px] cursor-pointer transition-colors hover:bg-slate-50 text-slate-700 border-0 bg-transparent ${opt.value === status ? 'font-semibold' : 'font-normal'}`}
          onClick={(e) => { e.stopPropagation(); onSelect(opt.value); }}
        >
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: opt.dotColor }} />
          {opt.label}
        </button>
      ))}
    </div>,
    document.body
  );
};

export default StatusDropdownPortal;
