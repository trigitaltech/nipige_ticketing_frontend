import SearchBar from '../shared/SearchBar';
import FilterDropdown from '../shared/FilterDropdown';
import SortDropdown from '../shared/SortDropdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { exportTicketsToCsv } from '../../function/exportUtils';

const SearchFilterBar = ({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  onClearFilters,
  categories,
  projects = [],
  sortConfig,
  setSortConfig,
  viewMode,
  setViewMode,
  groupBy,
  setGroupBy,
  tickets = [],
}) => {
  const handleExport = () => {
    exportTicketsToCsv(tickets, {
      filename: activeFilter === 'my' ? 'my_tasks' : 'all_tasks',
      projects,
      categories,
    });
  };

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
      <div className="bg-gray-50 flex items-center gap-2 text-sm text-gray-500 border border-gray-100 rounded-3xl px-3 py-1 shrink-0">
        <span className="font-bold text-xs text-gray-500">GROUP BY:</span>
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger
            size="sm"
            className="h-auto border-0 bg-transparent px-0 py-0 font-semibold text-gray-800 text-sm shadow-none gap-1 focus-visible:ring-0 focus-visible:border-0 hover:text-black cursor-pointer"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right: Filter, Sort, View Toggle */}
      <div className="flex items-center gap-4 shrink-0">
        <FilterDropdown
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={onClearFilters}
          categories={categories}
          projects={projects}
        />
        <SortDropdown
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          onClearSort={() => setSortConfig({ field: '', direction: 'asc' })}
        />

        {/* Export */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleExport}
                disabled={!tickets || tickets.length === 0}
                className="w-8 h-8 rounded-xl shadow-sm border border-gray-200 bg-white text-gray-500 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 disabled:hover:border-gray-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Export as CSV</TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
