import SearchBar from '../shared/SearchBar';
import FilterDropdown from '../shared/FilterDropdown';
import SortDropdown from '../shared/SortDropdown';

const SearchFilterBar = ({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  onClearFilters,
  categories,
  sortConfig,
  setSortConfig,
  viewMode,
  setViewMode,
  groupBy,
  setGroupBy,
}) => {
  return (
    <div className="mx-5 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-2.5 flex items-center gap-4">
      {/* Left: Task filter toggle */}
      <div className="flex items-center gap-1 shrink-0 bg-gray-50 rounded-xl px-0.5 py-0.5">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-white text-black shadow-sm'
              : 'hover:text-gray-600'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setActiveFilter('my')}
          className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            activeFilter === 'my'
              ? 'bg-white text-black shadow-sm'
              : ' hover:text-gray-600'
          }`}
        >
          My Tasks
        </button>
      </div>

      {/* Center: Search - takes remaining space */}
      <div className="flex-1 flex items-center border-l border-gray-200 pl-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Group By */}
      <div className="bg-gray-50 flex items-center gap-2 text-sm text-gray-500 border border-gray-100 rounded-3xl px-3 py-2 shrink-0">
        <span className="font-bold text-xs text-gray-500">GROUP BY:</span>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="bg-transparent font-semibold text-gray-800 border-none outline-none cursor-pointer text-sm"
        >
          <option value="status">Status</option>
          <option value="project">Project</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Right: Filter, Sort, View Toggle */}
      <div className="flex items-center gap-4 shrink-0">
        <FilterDropdown
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={onClearFilters}
          categories={categories}
        />
        <SortDropdown
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          onClearSort={() => setSortConfig({ field: '', direction: 'asc' })}
        />

        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-xl px-1 py-1 bg-gray-50">
          <button
            onClick={() => setViewMode('kanban')}
            title="Kanban View"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'kanban'
                ? 'shadow-sm bg-white text-black'
                : 'hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'shadow-sm bg-white text-black'
                : 'hover:text-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="2" rx="1" />
              <rect x="3" y="11" width="18" height="2" rx="1" />
              <rect x="3" y="18" width="18" height="2" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;
