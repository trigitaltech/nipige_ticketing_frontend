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

const groupLabels = {
  status: 'Status',
  project: 'Project',
  category: 'Category',
};

const SearchFilterBar = ({
  activeFilter,
  setActiveFilter,
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

  const tabBase =
    'inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer';
  const tabIdle = 'border-transparent text-slate-500 hover:text-slate-800';
  const tabActive = 'border-[#5449D6] text-slate-900';

  return (
    <div>
      {/* Row 1: View tabs */}
      <div className="flex items-center border-b border-slate-200 px-5">
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`${tabBase} ${viewMode === 'list' ? tabActive : tabIdle}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="2" rx="1" />
            <rect x="3" y="11" width="18" height="2" rx="1" />
            <rect x="3" y="18" width="18" height="2" rx="1" />
          </svg>
          <span>List</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('kanban')}
          className={`${tabBase} ${viewMode === 'kanban' ? tabActive : tabIdle}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Kanban</span>
        </button>
      </div>

      {/* Row 2: Action bar */}
      <div className="flex items-center gap-3 py-1.5 px-5">
        {/* Left */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 h-7 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('my')}
              className={`px-3 h-7 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                activeFilter === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              My Tasks
            </button>
          </div>

          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger
              size="sm"
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-0 shadow-none gap-1.5"
            >
              <span className="text-slate-400">Group:</span>
              <span className="font-semibold text-slate-800">{groupLabels[groupBy] || 'Status'}</span>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <SortDropdown
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
            onClearSort={() => setSortConfig({ field: '', direction: 'asc' })}
          />
          <FilterDropdown
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={onClearFilters}
            categories={categories}
            projects={projects}
          />

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!tickets || tickets.length === 0}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Export as CSV</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;
