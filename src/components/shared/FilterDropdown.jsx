import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import '../../assets/Styles/Dropdown.css';

const ALL = '__all__';

const FilterDropdown = ({ filters, onFilterChange, onClearFilters, categories, projects = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { users, loading: usersLoading } = useSelector((state) => state.users);

  const [clearClicked, setClearClicked] = useState(false);

  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.category,
    filters.project,
    filters.assignTo,
    filters.fromDate,
    filters.toDate,
    filters.orderId,
  ].filter((v) => v !== null && v !== undefined && v !== '').length;
  const hasActiveFilters = activeFilterCount > 0;

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleSelectChange = (field, value) => {
    const resolved = value === ALL ? '' : value;
    handleChange(field, resolved);
  };

  const handlePriorityChange = (value) => {
    const resolved = value === ALL ? null : parseInt(value, 10);
    handleChange('priority', resolved);
  };

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
    return v !== null && v !== undefined && v !== '';
  };

  const clearField = (field) => {
    const emptyValue = field === 'priority' ? null : '';
    handleChange(field, emptyValue);
  };

  const ClearFieldButton = ({ field }) => {
    const active = isFieldActive(field);
    return (
      <button
        type="button"
        onClick={() => active && clearField(field)}
        aria-label={`Clear ${field}`}
        title="Clear"
        tabIndex={active ? 0 : -1}
        className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
          active
            ? 'text-slate-400 hover:text-white hover:bg-slate-500 cursor-pointer opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    );
  };

  const triggerClass =
    'flex-1 h-8 bg-[#FAFBFC] border border-[#DFE1E6] rounded-[3px] text-[13px] text-[#172B4D] shadow-none focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:border-blue-400 data-[placeholder]:text-slate-400';

  return (
    <div className="dropdown-wrapper" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
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
                <Select
                  value={filters.status || ALL}
                  onValueChange={(v) => handleSelectChange('status', v)}
                >
                  <SelectTrigger size="sm" className={triggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <ClearFieldButton field="status" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Priority</span>
                <Select
                  value={filters.priority ? String(filters.priority) : ALL}
                  onValueChange={handlePriorityChange}
                >
                  <SelectTrigger size="sm" className={triggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ClearFieldButton field="priority" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Category</span>
                <Select
                  value={filters.category || ALL}
                  onValueChange={(v) => handleSelectChange('category', v)}
                >
                  <SelectTrigger size="sm" className={triggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {Array.isArray(categories) && categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ClearFieldButton field="category" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Project</span>
                <Select
                  value={filters.project || ALL}
                  onValueChange={(v) => handleSelectChange('project', v)}
                >
                  <SelectTrigger size="sm" className={triggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {Array.isArray(projects) && projects.map((proj) => {
                      const id = proj._id || proj.id;
                      return (
                        <SelectItem key={id} value={id}>
                          {proj.name || proj.projectName || 'Untitled Project'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <ClearFieldButton field="project" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Assigned To</span>
                <Select
                  value={filters.assignTo || ALL}
                  onValueChange={(v) => handleSelectChange('assignTo', v)}
                  disabled={usersLoading}
                >
                  <SelectTrigger size="sm" className={triggerClass}>
                    <SelectValue placeholder={usersLoading ? 'Loading...' : 'All'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All</SelectItem>
                    {Array.isArray(users) && users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ClearFieldButton field="assignTo" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">From Date</span>
                <input
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => handleChange('fromDate', e.target.value)}
                />
                <ClearFieldButton field="fromDate" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">To Date</span>
                <input
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => handleChange('toDate', e.target.value)}
                />
                <ClearFieldButton field="toDate" />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Ticket ID</span>
                <input
                  type="text"
                  value={filters.orderId || ''}
                  onChange={(e) => handleChange('orderId', e.target.value)}
                  placeholder="Enter Task ID"
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

export default FilterDropdown;
