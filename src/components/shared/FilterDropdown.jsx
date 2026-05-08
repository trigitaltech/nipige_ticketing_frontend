import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { getAvatarColor, getInitials } from '../../utils/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getProjectMembersAPI } from '../../services/projectApi';

const Avatar = ({ label, size = 24 }) => (
  <span
    className="shrink-0 rounded-full flex items-center justify-center text-white font-semibold"
    style={{ width: size, height: size, fontSize: size * 0.4, background: getAvatarColor(label) }}
  >
    {getInitials(label)}
  </span>
);

const Checkmark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5449D6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const PortalMultiSelect = ({ options, value = [], onChange, placeholder = 'Search...', showAvatar = false, triggerClassName }) => {
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

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOptions = options.filter(o => value.includes(o.value));
  const toggleOne = (v) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  return (
    <div className="relative flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={triggerClassName || "w-full h-8 flex items-center justify-between px-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-[3px] text-[13px] cursor-pointer gap-1.5 overflow-hidden"}
      >
        {value.length === 0 ? (
          <span className="text-slate-400">All</span>
        ) : showAvatar ? (
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            <div className="flex items-center -space-x-1.5">
              {selectedOptions.slice(0, 3).map(o => <Avatar key={o.value} label={o.label} size={20} />)}
            </div>
            <span className="text-[#5449D6] font-medium text-[12px] shrink-0">{value.length} selected</span>
          </div>
        ) : (
          <span className="text-[#5449D6] font-medium truncate">{value.length === 1 ? selectedOptions[0]?.label : `${value.length} selected`}</span>
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
                placeholder={placeholder}
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
                  const checked = value.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleOne(opt.value)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      {showAvatar && <Avatar label={opt.label} size={28} />}
                      <span className={`flex-1 text-left truncate ${showAvatar ? 'font-medium' : ''} text-slate-700`}>
                        {opt.label}
                      </span>
                      {checked && <Checkmark />}
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

const FilterDropdown = ({ filters, onFilterChange, onClearFilters, categories, projects = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const [clearClicked, setClearClicked] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const selectedProjects = Array.isArray(filters.project) ? filters.project : [];

  const filtersRef = useRef(filters);
  const onFilterChangeRef = useRef(onFilterChange);
  filtersRef.current = filters;
  onFilterChangeRef.current = onFilterChange;

  useEffect(() => {
    if (selectedProjects.length === 0) {
      setProjectMembers([]);
      return;
    }
    setMembersLoading(true);
    Promise.all(selectedProjects.map(pid => getProjectMembersAPI(pid).catch(() => null)))
      .then(results => {
        const seen = new Set();
        const merged = [];
        results.forEach(res => {
          const { owner, members = [] } = res?.data || {};
          const all = owner ? [owner, ...members] : members;
          all.forEach(m => {
            const id = m.id || m._id;
            if (id && !seen.has(id)) {
              seen.add(id);
              merged.push(m);
            }
          });
        });
        setProjectMembers(merged);
        const validIds = new Set(merged.map(m => m.id || m._id));
        const currentAssignTo = Array.isArray(filtersRef.current.assignTo) ? filtersRef.current.assignTo : [];
        const stillValid = currentAssignTo.filter(id => validIds.has(id));
        if (stillValid.length !== currentAssignTo.length) {
          onFilterChangeRef.current({ ...filtersRef.current, assignTo: stillValid });
        }
      })
      .finally(() => setMembersLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.project]);

  const activeFilterCount = [
    Array.isArray(filters.status) ? filters.status.length > 0 : !!filters.status,
    Array.isArray(filters.priority) ? filters.priority.length > 0 : (filters.priority !== null && filters.priority !== undefined && filters.priority !== ''),
    Array.isArray(filters.category) ? filters.category.length > 0 : !!filters.category,
    Array.isArray(filters.project) ? filters.project.length > 0 : !!filters.project,
    Array.isArray(filters.assignTo) ? filters.assignTo.length > 0 : !!filters.assignTo,
    !!filters.fromDate,
    !!filters.toDate,
    !!filters.orderId,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const handleChange = (field, value) => onFilterChange({ ...filters, [field]: value });

  const handleClear = () => {
    setClearClicked(false);
    requestAnimationFrame(() => {
      setClearClicked(true);
      onClearFilters();
      setTimeout(() => setClearClicked(false), 350);
    });
  };

  const isFieldActive = (field) => {
    const v = filters[field];
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && v !== '';
  };

  const clearField = (field) => {
    const emptyValue = field === 'priority' ? null : Array.isArray(filters[field]) ? [] : '';
    handleChange(field, emptyValue);
  };

  const ClearFieldButton = ({ field }) => {
    const active = isFieldActive(field);
    return (
      <button
        type="button"
        onClick={() => active && clearField(field)}
        tabIndex={active ? 0 : -1}
        className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${active ? 'text-slate-400 hover:text-white hover:bg-slate-500 cursor-pointer opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    );
  };

  const statusOptions = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'BACKLOG', label: 'Backlog' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  const categoryOptions = (Array.isArray(categories) ? categories : []).map(cat => ({
    value: cat._id,
    label: cat.name,
  }));

  const projectOptions = (Array.isArray(projects) ? projects : []).map(proj => ({
    value: proj._id || proj.id,
    label: proj.name || proj.projectName || 'Untitled Project',
  }));

  const userOptions = selectedProjects.length > 0
    ? projectMembers.map(m => ({
        value: m.id || m._id,
        label: m.name || m.authentication?.userName || '',
      }))
    : (Array.isArray(users) ? users : []).map(u => ({
        value: u._id,
        label: `${u.name?.first || ''} ${u.name?.last || ''}`.trim() || u.authentication?.userName || '',
      }));

  return (
    <div className="relative inline-flex" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
        style={{
          border: isOpen || hasActiveFilters ? '1px solid #3B82F6' : '1px solid #E5E7EB',
          backgroundColor: isOpen || hasActiveFilters ? '#EFF6FF' : 'white',
          color: isOpen || hasActiveFilters ? '#3B82F6' : '#475569',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 2h14L9.5 8.5V13l-3 1.5V8.5L1 2z" />
        </svg>
        <span>{hasActiveFilters ? `${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Filter'}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+4px)] right-0 bg-white border border-[#DFE1E6] rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-[1000] min-w-[280px] max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-[#EBECF0]">
              <span className="text-[12px] font-semibold text-[#5E6C84] uppercase tracking-[0.5px]">Filters</span>
              <button
                className={`text-[12px] text-[#0052CC] bg-transparent border-none cursor-pointer px-2.5 py-1 rounded font-medium hover:bg-[#DEEBFF] hover:text-[#0747A6] active:bg-[#B3D4FF] active:scale-[0.96] outline-none transition-all ${clearClicked ? 'bg-[#B3D4FF] scale-[0.95]' : ''}`}
                onClick={handleClear}
              >
                Clear all
              </button>
            </div>
            <div className="py-1.5">

              <div className="flex items-center px-3.5 py-1.5 gap-2">
                <span className="text-[13px] text-[#5E6C84] font-medium min-w-[80px] shrink-0">Status</span>
                <PortalMultiSelect
                  options={statusOptions}
                  value={Array.isArray(filters.status) ? filters.status : []}
                  onChange={v => handleChange('status', v)}
                  placeholder="Search status..."
                />
                <ClearFieldButton field="status" />
              </div>

              <div className="flex items-center px-3.5 py-1.5 gap-2">
                <span className="text-[13px] text-[#5E6C84] font-medium min-w-[80px] shrink-0">Priority</span>
                <PortalMultiSelect
                  options={[1,2,3,4,5,6,7,8,9,10].map(n => ({ value: String(n), label: String(n) }))}
                  value={Array.isArray(filters.priority) ? filters.priority.map(String) : []}
                  onChange={v => handleChange('priority', v.map(Number))}
                  placeholder="Search priority..."
                />
                <ClearFieldButton field="priority" />
              </div>

              <div className="flex items-center px-3.5 py-1.5 gap-2">
                <span className="text-[13px] text-[#5E6C84] font-medium min-w-[80px] shrink-0">Category</span>
                <PortalMultiSelect
                  options={categoryOptions}
                  value={Array.isArray(filters.category) ? filters.category : []}
                  onChange={v => handleChange('category', v)}
                  placeholder="Search category..."
                />
                <ClearFieldButton field="category" />
              </div>

              <div className="flex items-center px-3.5 py-1.5 gap-2">
                <span className="text-[13px] text-[#5E6C84] font-medium min-w-[80px] shrink-0">Project</span>
                <PortalMultiSelect
                  options={projectOptions}
                  value={Array.isArray(filters.project) ? filters.project : []}
                  onChange={v => handleChange('project', v)}
                  placeholder="Search project..."
                />
                <ClearFieldButton field="project" />
              </div>

              <div className="flex items-center px-3.5 py-1.5 gap-2">
                <span className="text-[13px] text-[#5E6C84] font-medium min-w-[80px] shrink-0">Assigned To</span>
                <PortalMultiSelect
                  options={(usersLoading || membersLoading) ? [] : userOptions}
                  value={Array.isArray(filters.assignTo) ? filters.assignTo : []}
                  onChange={v => handleChange('assignTo', v)}
                  placeholder="Search or enter email..."
                  showAvatar
                />
                <ClearFieldButton field="assignTo" />
              </div>

              <div className="flex items-center px-3.5 py-1.5 gap-2">
                <span className="text-[13px] text-[#5E6C84] font-medium min-w-[80px] shrink-0">From Date</span>
                <input
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => handleChange('fromDate', e.target.value)}
                  className="flex-1 py-1.5 px-2 border border-[#DFE1E6] rounded text-[13px] text-[#172B4D] bg-[#FAFBFC] outline-none"
                />
                <ClearFieldButton field="fromDate" />
              </div>

              <div className="flex items-center px-3.5 py-1.5 gap-2">
                <span className="text-[13px] text-[#5E6C84] font-medium min-w-[80px] shrink-0">To Date</span>
                <input
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => handleChange('toDate', e.target.value)}
                  className="flex-1 py-1.5 px-2 border border-[#DFE1E6] rounded text-[13px] text-[#172B4D] bg-[#FAFBFC] outline-none"
                />
                <ClearFieldButton field="toDate" />
              </div>

              <div className="flex items-center px-3.5 py-1.5 gap-2">
                <span className="text-[13px] text-[#5E6C84] font-medium min-w-[80px] shrink-0">Ticket ID</span>
                <input
                  type="text"
                  value={filters.orderId || ''}
                  onChange={(e) => handleChange('orderId', e.target.value)}
                  placeholder="Enter Task ID"
                  className="flex-1 py-1.5 px-2 border border-[#DFE1E6] rounded text-[13px] text-[#172B4D] bg-[#FAFBFC] outline-none"
                />
                <ClearFieldButton field="orderId" />
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { PortalMultiSelect };
export default FilterDropdown;
