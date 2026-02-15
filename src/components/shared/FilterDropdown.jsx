import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import '../../assets/Styles/Dropdown.css';

const FilterDropdown = ({ filters, onFilterChange, onClearFilters, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { users, loading: usersLoading } = useSelector((state) => state.users);

  const [clearClicked, setClearClicked] = useState(false);

  const hasActiveFilters = filters.status || filters.priority || filters.category ||
    filters.assignTo || filters.fromDate || filters.toDate || filters.orderId;

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleClear = () => {
    setClearClicked(false);
    requestAnimationFrame(() => {
      setClearClicked(true);
      onClearFilters();
      setTimeout(() => setClearClicked(false), 350);
    });
  };

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
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Priority</span>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleChange('priority', e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">All</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Category</span>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="">All</option>
                  {categories && Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Assigned To</span>
                <select
                  value={filters.assignTo || ''}
                  onChange={(e) => handleChange('assignTo', e.target.value)}
                  disabled={usersLoading}
                >
                  <option value="">All</option>
                  {users && Array.isArray(users) && users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                    </option>
                  ))}
                </select>
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
                  placeholder="Enter Ticket ID"
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
