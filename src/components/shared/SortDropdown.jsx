import { useState } from 'react';

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
    <div className="relative inline-flex">
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
          <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+4px)] right-0 bg-white border border-[#DFE1E6] rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-[1000] min-w-[280px] max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-[#EBECF0]">
              <span className="text-[12px] font-semibold text-[#5E6C84] uppercase tracking-[0.5px]">Sort</span>
              <button
                className="text-[12px] text-[#0052CC] bg-transparent border-none cursor-pointer px-2.5 py-1 rounded font-medium hover:bg-[#DEEBFF] hover:text-[#0747A6] active:bg-[#B3D4FF] outline-none transition-all"
                onClick={handleClear}
              >
                Clear all
              </button>
            </div>
            <div className="py-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.field}
                  className={`flex items-center justify-between px-3.5 py-2 cursor-pointer text-[13px] bg-transparent border-none w-full text-left outline-none hover:bg-[#F4F5F7] hover:text-[#172B4D] active:bg-[#EBECF0] transition-colors [font-family:inherit] ${sortConfig.field === option.field ? 'bg-[#F4F5F7] font-medium text-[#172B4D]' : 'text-[#5E6C84]'}`}
                  onClick={() => handleSortClick(option.field)}
                >
                  <span className="flex items-center gap-2">
                    {option.label}
                  </span>
                  {getDirectionIcon(option.field) && (
                    <span className="text-[13px] text-[#5E6C84]">
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
