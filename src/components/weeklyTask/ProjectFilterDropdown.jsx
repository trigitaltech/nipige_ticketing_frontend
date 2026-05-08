import { useEffect, useMemo, useRef, useState } from 'react';

const ProjectFilterDropdown = ({ projects, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(v => !v);
  };

  const items = useMemo(
    () => (Array.isArray(projects) ? projects : []).map(p => ({
      id: String(p._id || p.id),
      name: p.name || p.projectName || 'Untitled',
    })),
    [projects]
  );

  const filtered = useMemo(
    () => items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const allSelected = selected.length === 0;
  const label = allSelected
    ? 'All Projects'
    : selected.length === 1
      ? (items.find(i => i.id === selected[0])?.name || '1 Project')
      : `${selected.length} Projects`;

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(v => v !== id));
    else onChange([...selected, id]);
  };

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className={`!h-[22px] inline-flex items-center gap-1 px-3 rounded-md border text-[12px] font-medium transition-colors min-w-[110px] max-w-[170px] shrink-0 cursor-pointer ${allSelected ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'border-[#3B2FB1]/30 bg-[#3B2FB1]/10 text-[#3B2FB1]'}`}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-[200] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-200 py-1 w-[220px]"
          style={{ top: panelPos.top, left: panelPos.left }}
        >
          <div className="px-2 pt-1 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search project…"
                className="flex-1 text-[12px] bg-transparent outline-none text-slate-700 placeholder-slate-400"
                autoFocus
              />
            </div>
          </div>
          <button
            type="button"
            className="w-full text-left px-3 py-[6px] text-[11px] font-semibold text-[#3B2FB1] hover:bg-slate-50 cursor-pointer border-b border-slate-100"
            onClick={() => onChange([])}
          >
            All Projects
          </button>
          <div className="max-h-[240px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-[12px] text-slate-400 text-center">No projects</div>
            ) : (
              filtered.map(opt => {
                const checked = selected.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2 px-3 py-[6px] text-[12px] cursor-pointer hover:bg-slate-50 text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(opt.id)}
                      className="w-[13px] h-[13px] accent-[#3B2FB1] cursor-pointer"
                    />
                    <span className="flex-1 truncate">{opt.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFilterDropdown;
