import { useState } from 'react';
import { useSelector } from 'react-redux';

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

  const selectInputClass = "py-2 px-2.5 border-2 border-[#DFE1E6] rounded text-[14px] text-[#172B4D] bg-[#FAFBFC] outline-none transition-all hover:bg-white hover:border-[#B3BAC5]";

  const sortBtnClass = (field) =>
    `py-2 px-3 border rounded text-[13px] font-medium cursor-pointer flex items-center gap-1.5 whitespace-nowrap outline-none transition-none ${
      sortConfig.field === field
        ? 'bg-[#5E6C84] text-white border-[#5E6C84] hover:bg-[#42526E] hover:border-[#42526E]'
        : 'bg-[#FAFBFC] text-[#42526E] border-[#DFE1E6] hover:bg-[#EBECF0] hover:border-[#B3BAC5] hover:text-[#172B4D] active:bg-[#DFE1E6]'
    }`;

  return (
    <div className="bg-white rounded border border-[#DFE1E6] overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-4 py-3 bg-[#FAFBFC] border-b border-[#DFE1E6]">
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#172B4D' }}>
          {activePanel === 'filter' ? 'Filters' : 'Sort By'}
        </span>
        <button
          className="px-3 py-1.5 bg-white text-[#42526E] border border-[#DFE1E6] rounded text-[13px] font-medium cursor-pointer hover:bg-[#FAFBFC] hover:border-[#B3BAC5] active:bg-[#EBECF0] outline-none"
          onClick={handleClearFilters}
        >
          Clear All
        </button>
      </div>

      <div className="p-4 bg-white">
        {activePanel === 'filter' && (
          <div className="mb-5 pb-5 border-b border-[#EBECF0] last:border-b-0 last:mb-0 last:pb-0">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E6C84]">Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={selectInputClass}>
                  <option value="">All</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="BACKLOG">Backlog</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E6C84]">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value ? parseInt(e.target.value) : null)}
                  className={selectInputClass}
                >
                  <option value="">All</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E6C84]">Category</label>
                <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className={selectInputClass}>
                  <option value="">All</option>
                  {categories && Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E6C84]">Assigned To</label>
                <select
                  value={filters.assignTo}
                  onChange={(e) => handleFilterChange('assignTo', e.target.value)}
                  disabled={usersLoading}
                  className={selectInputClass}
                >
                  <option value="">All</option>
                  {users && Array.isArray(users) && users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E6C84]">From Date</label>
                <input type="date" value={filters.fromDate} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className={selectInputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E6C84]">To Date</label>
                <input type="date" value={filters.toDate} onChange={(e) => handleFilterChange('toDate', e.target.value)} className={selectInputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E6C84]">TICKET ID</label>
                <input
                  type="text"
                  value={filters.orderId}
                  onChange={(e) => handleFilterChange('orderId', e.target.value)}
                  placeholder="Enter Task ID"
                  className={selectInputClass}
                />
              </div>
            </div>
          </div>
        )}

        {activePanel === 'sort' && (
          <div>
            <div className="flex flex-wrap gap-2">
              <button className={sortBtnClass('ticketNo')} onClick={() => handleSortChange('ticketNo')}>Ticket ID {getSortIcon('ticketNo')}</button>
              <button className={sortBtnClass('subject')} onClick={() => handleSortChange('subject')}>Title {getSortIcon('subject')}</button>
              <button className={sortBtnClass('status')} onClick={() => handleSortChange('status')}>Status {getSortIcon('status')}</button>
              <button className={sortBtnClass('priority')} onClick={() => handleSortChange('priority')}>Priority {getSortIcon('priority')}</button>
              <button className={sortBtnClass('severity')} onClick={() => handleSortChange('severity')}>Severity {getSortIcon('severity')}</button>
              <button className={sortBtnClass('createdAt')} onClick={() => handleSortChange('createdAt')}>Created Date {getSortIcon('createdAt')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
