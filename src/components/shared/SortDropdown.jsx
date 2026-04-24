import { useState } from 'react';
import '../../assets/Styles/Dropdown.css';

const SORT_OPTIONS = [
  { field: 'ticketNo', label: 'Ticket ID' },
  { field: 'subject', label: 'Title' },
  { field: 'status', label: 'Status' },
  { field: 'priority', label: 'Priority' },
  { field: 'severity', label: 'Severity' },
  { field: 'createdAt', label: 'Date Created' },
];

const SortDropdown = ({ sortConfig, onSortChange, onClearSort }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clearClicked, setClearClicked] = useState(false);

  const activeLabel = sortConfig?.field
    ? SORT_OPTIONS.find((opt) => opt.field === sortConfig.field)?.label || sortConfig.field
    : '';
  const activeArrow = sortConfig?.direction === 'desc' ? '↓' : '↑';

  const handleClear = () => {
    setClearClicked(false);
    requestAnimationFrame(() => {
      setClearClicked(true);
      onClearSort();
      setTimeout(() => setClearClicked(false), 350);
    });
  };

  const handleSortClick = (field) => {
    if (sortConfig.field === field) {
      const newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      onSortChange({ field, direction: newDirection });
    } else {
      onSortChange({ field, direction: 'asc' });
    }
  };

  const getDirectionIcon = (field) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="dropdown-wrapper">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
        style={{
          border: isOpen || sortConfig.field ? '1px solid #3B82F6' : '1px solid #E5E7EB',
          backgroundColor: isOpen || sortConfig.field ? '#EFF6FF' : 'white',
          color: isOpen || sortConfig.field ? '#3B82F6' : '#475569',
        }}
      >
        {sortConfig.field ? (
          <>
            <span className="font-semibold">{activeArrow}</span>
            <span>{activeLabel}</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2v10.293l-1.646-1.647-.708.708L3.5 14.207l2.854-2.853-.708-.708L4 12.293V2H3zm5 0v1h7V2H8zm0 4v1h5V6H8zm0 4v1h3v-1H8z" />
            </svg>
            <span>Sort</span>
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="dropdown-panel">
            <div className="sort-dropdown-header">
              <span>Sort</span>
              <button className={`filter-dropdown-clear ${clearClicked ? 'clicked' : ''}`} onClick={handleClear}>
                Clear all
              </button>
            </div>
            <div className="sort-dropdown-items">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.field}
                  className={`sort-dropdown-item ${sortConfig.field === option.field ? 'active' : ''}`}
                  onClick={() => handleSortClick(option.field)}
                >
                  <span className="sort-dropdown-item-label">
                    {option.label}
                  </span>
                  {getDirectionIcon(option.field) && (
                    <span className="sort-dropdown-item-direction">
                      {getDirectionIcon(option.field)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SortDropdown;
