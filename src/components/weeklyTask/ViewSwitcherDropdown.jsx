import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { VIEW_OPTIONS } from './constants';

const ViewSwitcherDropdown = ({ viewMode, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="h-[22px] border border-slate-200 rounded-md bg-white inline-flex items-center gap-1 text-slate-700 cursor-pointer text-[12px] font-medium px-3 transition-colors hover:bg-slate-50"
        onClick={() => setOpen(v => !v)}
      >
        {VIEW_OPTIONS.find(o => o.value === viewMode)?.label ?? 'Week'}
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[26px] z-[200] bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 py-1 w-[148px]">
          {VIEW_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`w-full flex items-center justify-between px-3 py-[7px] text-[13px] cursor-pointer transition-colors border-0 ${
                opt.value === viewMode
                  ? 'text-[#3B2FB1] font-semibold bg-[#3B2FB1]/[0.06]'
                  : 'text-slate-600 font-normal bg-transparent hover:bg-slate-50'
              }`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
              <kbd className="text-[10px] text-slate-400 bg-slate-100 rounded-[4px] px-[5px] py-[1px] font-mono leading-none">
                {opt.shortcut}
              </kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewSwitcherDropdown;
