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

  const hasActiveFilters = filters.status || filters.priority || filters.category ||
    filters.project || filters.assignTo || filters.fromDate || filters.toDate || filters.orderId;

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

  const triggerClass =
    'flex-1 h-8 bg-[#FAFBFC] border border-[#DFE1E6] rounded-[3px] text-[13px] text-[#172B4D] shadow-none focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:border-blue-400 data-[placeholder]:text-slate-400';

  return (
    <div className="dropdown-wrapper" ref={wrapperRef}>
      <button
        className="dropdown-trigger rounded-xl shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: isOpen || hasActiveFilters ? '1px solid #3B82F6' : '1px solid #E5E7EB',
          backgroundColor: isOpen || hasActiveFilters ? '#EFF6FF' : 'white',
          color: isOpen || hasActiveFilters ? '#3B82F6' : '#6B7280',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 2h14L9.5 8.5V13l-3 1.5V8.5L1 2z" />
        </svg>
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
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
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
              </div>

              <div className="filter-row">
                <span className="filter-row-label">From Date</span>
                <input
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => handleChange('fromDate', e.target.value)}
                />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">To Date</span>
                <input
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => handleChange('toDate', e.target.value)}
                />
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Ticket ID</span>
                <input
                  type="text"
                  value={filters.orderId || ''}
                  onChange={(e) => handleChange('orderId', e.target.value)}
                  placeholder="Enter Task ID"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterDropdown;
