import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import '../../assets/Styles/Dropdown.css';
import { getAvatarColor, getInitials } from '../../utils/avatar';

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

const PortalMultiSelect = ({ options, value = [], onChange, placeholder = 'Search...', showAvatar = false }) => {
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
        className="w-full h-8 flex items-center justify-between px-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded-[3px] text-[13px] cursor-pointer gap-1.5 overflow-hidden"
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
          <div className="max-h-[220px] overflow-y-auto pb-1.5">
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

  const userOptions = (Array.isArray(users) ? users : []).map(user => ({
    value: user._id,
    label: `${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName || '',
  }));

  return (
    <div className="dropdown-wrapper" ref={wrapperRef}>
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
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="dropdown-panel">
            <div className="filter-dropdown-header">
              <span>Filters</span>
              <button className={`filter-dropdown-clear ${clearClicked ? 'clicked' : ''}`} onClick={handleClear}>
                Clear all
              </button>
            </div>
            <div className="filter-dropdown-rows">

              <div className="filter-row">
                <span className="filter-row-label">Status</span>
                <PortalMultiSelect
                  options={statusOptions}
                  value={Array.isArray(filters.status) ? filters.status : []}
                  onChange={v => handleChange('status', v)}
                  placeholder="Search status..."
                />
                <ClearFieldButton field="status" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Priority</span>
                <PortalMultiSelect
                  options={[1,2,3,4,5,6,7,8,9,10].map(n => ({ value: String(n), label: String(n) }))}
                  value={Array.isArray(filters.priority) ? filters.priority.map(String) : []}
                  onChange={v => handleChange('priority', v.map(Number))}
                  placeholder="Search priority..."
                />
                <ClearFieldButton field="priority" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Category</span>
                <PortalMultiSelect
                  options={categoryOptions}
                  value={Array.isArray(filters.category) ? filters.category : []}
                  onChange={v => handleChange('category', v)}
                  placeholder="Search category..."
                />
                <ClearFieldButton field="category" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Project</span>
                <PortalMultiSelect
                  options={projectOptions}
                  value={Array.isArray(filters.project) ? filters.project : []}
                  onChange={v => handleChange('project', v)}
                  placeholder="Search project..."
                />
                <ClearFieldButton field="project" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Assigned To</span>
                <PortalMultiSelect
                  options={usersLoading ? [] : userOptions}
                  value={Array.isArray(filters.assignTo) ? filters.assignTo : []}
                  onChange={v => handleChange('assignTo', v)}
                  placeholder="Search or enter email..."
                  showAvatar
                />
                <ClearFieldButton field="assignTo" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">From Date</span>
                <input type="date" value={filters.fromDate || ''} onChange={(e) => handleChange('fromDate', e.target.value)} />
                <ClearFieldButton field="fromDate" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">To Date</span>
                <input type="date" value={filters.toDate || ''} onChange={(e) => handleChange('toDate', e.target.value)} />
                <ClearFieldButton field="toDate" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Ticket ID</span>
                <input type="text" value={filters.orderId || ''} onChange={(e) => handleChange('orderId', e.target.value)} placeholder="Enter Task ID" />
                <ClearFieldButton field="orderId" />
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterDropdown;
