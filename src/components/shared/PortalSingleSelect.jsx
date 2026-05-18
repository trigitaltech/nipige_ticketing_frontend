import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAvatarColor, getInitials } from '../../utils/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const Avatar = ({ label, size = 24 }) => (
  <span
    className="shrink-0 rounded-full flex items-center justify-center text-white font-semibold"
    style={{ width: size, height: size, fontSize: size * 0.4, background: getAvatarColor(label) }}
  >
    {getInitials(label)}
  </span>
);

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Checkmark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5449D6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PortalSingleSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  showAvatar = false,
  triggerClassName,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

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
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 300;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setDropdownStyle({ top: rect.top - dropdownHeight - 4, left: rect.left, width: Math.max(rect.width, 230) });
      } else {
        setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 230) });
      }
    }
    setOpen(o => !o);
    if (open) setSearch('');
  };

  const handleSelect = (optValue) => {
    onChange(optValue === value ? '' : optValue);
    setOpen(false);
    setSearch('');
  };

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={triggerClassName || 'w-full h-8 flex items-center justify-between px-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-[3px] text-[13px] cursor-pointer gap-1.5 overflow-hidden'}
      >
        {!selectedOption ? (
          <span className="text-slate-400 truncate">{placeholder}</span>
        ) : (
          <span className="text-[#5449D6] font-medium truncate">{selectedOption.label}</span>
        )}
        <ChevronDown />
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
                placeholder="Search..."
                className="flex-1 text-[13px] bg-transparent outline-none text-slate-700 placeholder-slate-400"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="h-[220px]">
            <div className="pb-1.5">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-slate-400 text-center">No results found</div>
              ) : (
                filtered.map(opt => {
                  const selected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      {showAvatar && <Avatar label={opt.label} size={28} />}
                      <span className={`flex-1 text-left truncate ${showAvatar ? 'font-medium' : ''} text-slate-700`}>
                        {opt.label}
                      </span>
                      {selected && <Checkmark />}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PortalSingleSelect;
