import { useState, useRef, useEffect } from 'react';

const ICON_MAP = {
  folder:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>,
  users:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  filter:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
  flag:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><path d="M4 22V15"/></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  search:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
};

const BRAND = '#3B2FB1';

/**
 * Multi-select dropdown with optional inline search.
 *
 * Props:
 *   label        – string shown as the field label (e.g. "Member")
 *   icon         – key from ICON_MAP for the trigger icon
 *   options      – [{ id, label, dot?, sub?, shortLabel? }]
 *   selected     – string[] of selected ids
 *   onChange     – (ids: string[]) => void
 *   width        – min-width of the trigger (default 200)
 *   searchable   – show search box inside dropdown (default false)
 */
const MultiSelectDropdown = ({
  label,
  icon,
  options,
  selected,
  onChange,
  width = 200,
  searchable = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!open) setQuery('');
  }, [open, searchable]);

  const all = selected.length === 0;

  const labelText = all
    ? `All ${label.toLowerCase()}`
    : selected.length === 1
      ? (options.find(o => o.id === selected[0])?.shortLabel ||
         options.find(o => o.id === selected[0])?.label ||
         selected[0])
      : `${selected.length} ${label.toLowerCase()}`;

  const toggle = (id) => {
    onChange(selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id]);
  };

  const visibleOptions = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref} style={{ minWidth: width }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full inline-flex items-center gap-2 px-3 h-9 border rounded-lg text-[12.5px] font-medium bg-white transition-all
          ${open
            ? 'border-[#3B2FB1] ring-2 ring-[#3B2FB1]/15 shadow-sm'
            : 'border-slate-200 hover:border-slate-300'}`}
      >
        {icon && <span className="text-slate-400">{ICON_MAP[icon]}</span>}
        <span className="text-slate-400 text-[10.5px] uppercase tracking-wider font-semibold shrink-0">{label}</span>
        <span className={`truncate flex-1 text-left ${all ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>
          {labelText}
        </span>
        {!all && (
          <span
            className="shrink-0 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
            style={{ background: BRAND }}
          >
            {selected.length}
          </span>
        )}
        <span className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          {ICON_MAP.chevron}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-full min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">

          {/* Search input */}
          {searchable && (
            <div className="px-2.5 pt-2.5 pb-1.5 border-b border-slate-100">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {ICON_MAP.search}
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  className="w-full pl-7 pr-2.5 py-1.5 text-[12px] border border-slate-200 rounded-md bg-slate-50 outline-none focus:border-[#3B2FB1] focus:ring-1 focus:ring-[#3B2FB1]/20 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1">
            {/* Clear / All button — hide when searching */}
            {!query && (
              <>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="w-full text-left px-3 py-1.5 text-[12.5px] hover:bg-slate-50 font-semibold"
                  style={{ color: BRAND }}
                >
                  All ({options.length})
                </button>
                <div className="border-t border-slate-100 my-0.5" />
              </>
            )}

            {visibleOptions.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-slate-400 text-center">No results</div>
            ) : (
              visibleOptions.map(o => {
                const checked = !query && (all || selected.includes(o.id)) || selected.includes(o.id);
                return (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => toggle(o.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] hover:bg-slate-50 text-left"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                        ${checked
                          ? 'border-[#3B2FB1] bg-[#3B2FB1]'
                          : 'border-slate-300 bg-white'}`}
                    >
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                      )}
                    </span>
                    {o.dot && <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: o.dot }} />}
                    <span className="truncate flex-1 text-slate-700">{o.label}</span>
                    {o.sub && <span className="text-[10.5px] text-slate-400 shrink-0">{o.sub}</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
