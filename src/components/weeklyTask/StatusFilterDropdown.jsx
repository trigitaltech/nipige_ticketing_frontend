import { useEffect, useRef, useState } from 'react';
import { TICKET_STATUS_OPTIONS } from './constants';

const StatusFilterDropdown = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const all = TICKET_STATUS_OPTIONS.map(o => o.value);
  const allSelected = selected.length === all.length;
  const noneSelected = selected.length === 0;
  const label = allSelected
    ? 'All Statuses'
    : noneSelected
      ? 'No Status'
      : `${selected.length} Status${selected.length === 1 ? '' : 'es'}`;

  const toggle = (value) => {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`h-[22px] px-3 rounded-full inline-flex items-center gap-1.5 text-[12px] font-medium border cursor-pointer transition-colors ${allSelected ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-[#3B2FB1]/10 border-[#3B2FB1]/30 text-[#3B2FB1]'}`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="7" y1="12" x2="17" y2="12"/>
          <line x1="10" y1="18" x2="14" y2="18"/>
        </svg>
        {label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[26px] z-[200] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-200 py-1 min-w-[170px]">
          <button
            type="button"
            className="w-full text-left px-3 py-[6px] text-[11px] font-semibold text-[#3B2FB1] hover:bg-slate-50 cursor-pointer border-b border-slate-100"
            onClick={() => onChange(allSelected ? [] : all)}
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
          {TICKET_STATUS_OPTIONS.map(opt => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-[6px] text-[12px] cursor-pointer hover:bg-slate-50 text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className="w-[13px] h-[13px] accent-[#3B2FB1] cursor-pointer"
                />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: opt.dotColor }} />
                <span className="flex-1">{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusFilterDropdown;
