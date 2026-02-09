import { useState } from 'react';
import { useSelector } from 'react-redux';
import '../../assets/Styles/FilterBar.css';

const FilterBar = ({ onFilterChange, onSortChange, categories, activePanel }) => {
  const { users, loading: usersLoading } = useSelector((state) => state.users);

  const [filters, setFilters] = useState({
    status: '',
    priority: null,
    category: '',
    fromDate: '',
    toDate: '',
    assignTo: '',
    orderId: ''
  });

  const [sortConfig, setSortConfig] = useState({
    field: '',
    direction: 'asc'
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (field) => {
    const newDirection = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig = { field, direction: newDirection };
    setSortConfig(newSortConfig);
    onSortChange(newSortConfig);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: '',
      priority: null,
      category: '',
      fromDate: '',
      toDate: '',
      assignTo: '',
      orderId: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return '⇅';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (!activePanel) return null;

  return (
    <div className="filter-bar">
      <div className="filter-header">
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D' }}>
          {activePanel === 'filter' ? 'Filters' : 'Sort By'}
        </span>
        <button
          className="clear-filters-btn"
          onClick={handleClearFilters}
        >
          Clear All
        </button>
      </div>

      <div className="filter-content">
        {activePanel === 'filter' && (
          <div className="filter-section">
            <div className="filter-grid">
              <div className="filter-item">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">All</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All</option>
                  {categories && Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label>Assigned To</label>
                <select
                  value={filters.assignTo}
                  onChange={(e) => handleFilterChange('assignTo', e.target.value)}
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

              <div className="filter-item">
                <label>From Date</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                />
              </div>

              <div className="filter-item">
                <label>To Date</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                />
              </div>

              <div className="filter-item">
                <label>TICKET ID</label>
                <input
                  type="text"
                  value={filters.orderId}
                  onChange={(e) => handleFilterChange('orderId', e.target.value)}
                  placeholder="Enter Ticket ID"
                />
              </div>
            </div>
          </div>
        )}

        {activePanel === 'sort' && (
          <div className="sort-section">
            <div className="sort-buttons">
              <button
                className={`sort-btn ${sortConfig.field === 'ticketNo' ? 'active' : ''}`}
                onClick={() => handleSortChange('ticketNo')}
              >
                Ticket ID {getSortIcon('ticketNo')}
              </button>
              <button
                className={`sort-btn ${sortConfig.field === 'subject' ? 'active' : ''}`}
                onClick={() => handleSortChange('subject')}
              >
                Title {getSortIcon('subject')}
              </button>
              <button
                className={`sort-btn ${sortConfig.field === 'status' ? 'active' : ''}`}
                onClick={() => handleSortChange('status')}
              >
                Status {getSortIcon('status')}
              </button>
              <button
                className={`sort-btn ${sortConfig.field === 'priority' ? 'active' : ''}`}
                onClick={() => handleSortChange('priority')}
              >
                Priority {getSortIcon('priority')}
              </button>
              <button
                className={`sort-btn ${sortConfig.field === 'severity' ? 'active' : ''}`}
                onClick={() => handleSortChange('severity')}
              >
                Severity {getSortIcon('severity')}
              </button>
              <button
                className={`sort-btn ${sortConfig.field === 'createdAt' ? 'active' : ''}`}
                onClick={() => handleSortChange('createdAt')}
              >
                Created Date {getSortIcon('createdAt')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
