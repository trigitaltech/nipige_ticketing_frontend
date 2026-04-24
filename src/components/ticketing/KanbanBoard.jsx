import TicketCard from './TicketCard';
import TicketCardSkeleton from '../skeletons/TicketCardSkeleton';
import usePersistentState from '../../hooks/usePersistentState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { exportTicketsToCsv } from '../../function/exportUtils';

const StatusIconTodo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /></svg>
);
const StatusIconInProgress = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18 9 9 0 0 1 0-18z M12 3a9 9 0 0 1 9 9" fill="currentColor" stroke="none" /></svg>
);
const StatusIconComplete = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
);
const StatusIconClosed = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" /></svg>
);
const StatusIconBacklog = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /></svg>
);

const statusConfig = {
  OPEN:        { title: 'Open',        Icon: StatusIconTodo,       color: 'rgb(8, 128, 234)' },
  IN_PROGRESS: { title: 'In Progress', Icon: StatusIconInProgress, color: '#f59e0b' },
  RESOLVED:    { title: 'Complete',    Icon: StatusIconComplete,   color: 'rgb(41, 151, 100)' },
  BACKLOG:     { title: 'Backlog',     Icon: StatusIconBacklog,    color: '#a18072' },
  CLOSED:      { title: 'Closed',      Icon: StatusIconClosed,     color: '#656F7D' },
};

const projectDotPalette = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-rose-500',
];

const KanbanBoard = ({
  tickets,
  onTicketClick,
  onStatusChange,
  onDeleteTicket,
  onAddTask,
  groupBy = 'status',
  projects = [],
  categories = [],
  loading = false,
}) => {
  const showInitialSkeleton = loading && (!tickets || tickets.length === 0);
  const [collapsedColumns, setCollapsedColumns] = usePersistentState('kanban.collapsedColumns', {});

  const toggleColumnCollapsed = (columnId) => {
    setCollapsedColumns((prev) => ({ ...prev, [columnId]: !prev[columnId] }));
  };

  const buildColumnPrefill = (columnId) => {
    if (groupBy === 'status') return { status: columnId };
    if (groupBy === 'project') {
      return columnId === 'UNASSIGNED' ? {} : { project: columnId };
    }
    if (groupBy === 'category') {
      if (columnId === 'UNCATEGORIZED' || String(columnId).startsWith('NAME:')) return {};
      return { category: columnId };
    }
    return {};
  };

  const handleAddClick = (columnId) => {
    if (typeof onAddTask === 'function') {
      onAddTask(buildColumnPrefill(columnId));
    }
  };
  const statusColumns = [
    { id: 'OPEN' },
    { id: 'IN_PROGRESS' },
    { id: 'RESOLVED' },
    { id: 'BACKLOG' },
    { id: 'CLOSED' },
  ];

  const projectNameById = new Map();
  (Array.isArray(projects) ? projects : []).forEach((project) => {
    const projectId = String(project?._id || project?.id || '').trim();
    if (!projectId) return;
    const projectName = project?.name || project?.projectName || 'Untitled Project';
    projectNameById.set(projectId, projectName);
  });

  const categoryNameById = new Map();
  (Array.isArray(categories) ? categories : []).forEach((category) => {
    const categoryId = String(category?._id || category?.id || '').trim();
    if (!categoryId) return;
    const categoryName = category?.name || category?.title || 'Untitled Category';
    categoryNameById.set(categoryId, categoryName);
  });

  const getTicketProjectInfo = (ticket) => {
    const rawProject = ticket?.project;
    let projectId = '';
    let projectName = '';

    if (typeof rawProject === 'string') {
      projectId = rawProject;
    } else if (rawProject && typeof rawProject === 'object') {
      projectId = rawProject.id || rawProject._id || rawProject.projectId || '';
      projectName = rawProject.name || rawProject.projectName || rawProject.title || '';
    }

    if (!projectId && ticket?.projectId) {
      projectId = ticket.projectId;
    }
    if (!projectName && ticket?.projectName) {
      projectName = ticket.projectName;
    }
    if (!projectName && projectId) {
      projectName = projectNameById.get(String(projectId)) || '';
    }

    if (!projectId) {
      return { id: 'UNASSIGNED', name: 'No Project' };
    }

    return {
      id: String(projectId),
      name: projectName || `Project ${String(projectId).slice(-6).toUpperCase()}`,
    };
  };

  const getProjectColumns = () => {
    const columns = [];
    const seen = new Set();

    (Array.isArray(projects) ? projects : []).forEach((project, index) => {
      const projectId = String(project?._id || project?.id || '').trim();
      if (!projectId || seen.has(projectId)) return;
      seen.add(projectId);
      columns.push({
        id: projectId,
        title: project?.name || project?.projectName || 'Untitled Project',
        dotColor: projectDotPalette[index % projectDotPalette.length],
      });
    });

    // Ensure tickets still appear even if their project is not in fetched project list.
    (tickets || []).forEach((ticket) => {
      const projectInfo = getTicketProjectInfo(ticket);
      if (projectInfo.id === 'UNASSIGNED' || seen.has(projectInfo.id)) return;
      seen.add(projectInfo.id);
      columns.push({
        id: projectInfo.id,
        title: projectInfo.name,
        dotColor: projectDotPalette[columns.length % projectDotPalette.length],
      });
    });

    const hasUnassignedTickets = (tickets || []).some(
      (ticket) => getTicketProjectInfo(ticket).id === 'UNASSIGNED'
    );
    if (hasUnassignedTickets) {
      columns.push({
        id: 'UNASSIGNED',
        title: 'No Project',
        dotColor: 'bg-slate-400',
      });
    }

    return columns;
  };

  const getTicketCategoryInfo = (ticket) => {
    const rawCategory = ticket?.category;
    let categoryId = '';
    let categoryName = '';

    if (typeof rawCategory === 'string') {
      const raw = rawCategory.trim();
      if (categoryNameById.has(raw)) {
        categoryId = raw;
        categoryName = categoryNameById.get(raw) || '';
      } else {
        categoryId = `NAME:${raw}`;
        categoryName = raw;
      }
    } else if (rawCategory && typeof rawCategory === 'object') {
      categoryId = rawCategory._id || rawCategory.id || rawCategory.categoryId || '';
      categoryName = rawCategory.name || rawCategory.title || '';
    }

    if (!categoryId && ticket?.categoryId) {
      categoryId = String(ticket.categoryId);
    }
    if (!categoryName && ticket?.categoryName) {
      categoryName = ticket.categoryName;
    }
    if (!categoryName && categoryId && !String(categoryId).startsWith('NAME:')) {
      categoryName = categoryNameById.get(String(categoryId)) || '';
    }

    if (!categoryId) {
      return { id: 'UNCATEGORIZED', name: 'No Category' };
    }

    return {
      id: String(categoryId),
      name: categoryName || 'No Category',
    };
  };

  const getCategoryColumns = () => {
    const columns = [];
    const seen = new Set();

    (Array.isArray(categories) ? categories : []).forEach((category, index) => {
      const categoryId = String(category?._id || category?.id || '').trim();
      if (!categoryId || seen.has(categoryId)) return;
      seen.add(categoryId);
      columns.push({
        id: categoryId,
        title: category?.name || category?.title || 'Untitled Category',
        dotColor: projectDotPalette[index % projectDotPalette.length],
      });
    });

    // Ensure tickets still appear even if category is missing in fetched categories.
    (tickets || []).forEach((ticket) => {
      const categoryInfo = getTicketCategoryInfo(ticket);
      if (categoryInfo.id === 'UNCATEGORIZED' || seen.has(categoryInfo.id)) return;
      seen.add(categoryInfo.id);
      columns.push({
        id: categoryInfo.id,
        title: categoryInfo.name,
        dotColor: projectDotPalette[columns.length % projectDotPalette.length],
      });
    });

    const hasUncategorizedTickets = (tickets || []).some(
      (ticket) => getTicketCategoryInfo(ticket).id === 'UNCATEGORIZED'
    );
    if (hasUncategorizedTickets) {
      columns.push({
        id: 'UNCATEGORIZED',
        title: 'No Category',
        dotColor: 'bg-slate-400',
      });
    }

    return columns;
  };

  const columns = (() => {
    if (groupBy === 'project') return getProjectColumns();
    if (groupBy === 'category') return getCategoryColumns();
    return statusColumns;
  })();

  const getTicketsByColumn = (columnId) => {
    if (groupBy === 'project') {
      return tickets.filter((ticket) => getTicketProjectInfo(ticket).id === columnId);
    }
    if (groupBy === 'category') {
      return tickets.filter((ticket) => getTicketCategoryInfo(ticket).id === columnId);
    }
    return tickets.filter((ticket) => ticket.status === columnId);
  };

  const handleExportColumn = (columnTickets, columnTitle) => {
    exportTicketsToCsv(columnTickets, {
      filename: columnTitle,
      projects,
      categories,
    });
  };

  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('ticketId', String(ticketId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (groupBy !== 'status') return;

    const ticketId = e.dataTransfer.getData('ticketId');

    const ticket = tickets.find(t => (t._id || t.id) === ticketId);
    if (ticket && ticket.status === newStatus) {
      return;
    }

    onStatusChange(ticketId, newStatus);
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex gap-3 h-full overflow-x-auto scroll-hover pb-2 px-1">
      {columns.map((column, index) => {
        const config = statusConfig[column.id];
        const color = groupBy === 'status'
          ? (config?.color || '#87909E')
          : ['#1090E0', 'rgb(41,151,100)', '#D3A50E', '#8B5CF6', '#0891B2', '#E11D48'][index % 6];
        const columnTitle = groupBy === 'status' ? (config?.title || column.id) : column.title;
        const columnTickets = getTicketsByColumn(column.id);
        const totalTickets = columnTickets.length;
        const columnBg = `color-mix(in srgb, ${color} 5%, transparent)`;
        const isCollapsed = !!collapsedColumns[column.id];

        if (isCollapsed) {
          return (
            <div
              key={column.id}
              className="group/col shrink-0 self-start w-[44px] flex flex-col items-center rounded-lg py-3 px-1 cursor-pointer"
              style={{ backgroundColor: columnBg }}
              onDragOver={groupBy === 'status' ? handleDragOver : undefined}
              onDrop={groupBy === 'status' ? (e) => handleDrop(e, column.id) : undefined}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleColumnCollapsed(column.id)}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                    aria-label="Expand group"
                  >
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide text-white [writing-mode:vertical-rl]"
                      style={{ backgroundColor: color }}
                    >
                      {groupBy === 'status' && config?.Icon ? <config.Icon /> : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /></svg>
                      )}
                      {columnTitle}
                    </span>
                    <span className="text-[13px] font-bold tabular-nums" style={{ color }}>{totalTickets}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Expand group</TooltipContent>
              </Tooltip>
            </div>
          );
        }

        return (
          <div
            key={column.id}
            className="group/col shrink-0 w-[320px] flex flex-col rounded-lg p-2"
            style={{ backgroundColor: columnBg }}
            onDragOver={groupBy === 'status' ? handleDragOver : undefined}
            onDrop={groupBy === 'status' ? (e) => handleDrop(e, column.id) : undefined}
          >
            {/* Column Header — ClickUp-style pill */}
            <div className="flex items-center gap-2 px-1 py-1 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: color }}
              >
                {groupBy === 'status' && config?.Icon ? <config.Icon /> : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /></svg>
                )}
                {columnTitle}
              </span>
              <span className="text-[13px] font-bold tabular-nums" style={{ color }}>{totalTickets}</span>
              <div className="ml-auto flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggleColumnCollapsed(column.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      aria-label="Collapse group"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Collapse group</TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      title="More"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onSelect={() => handleExportColumn(columnTickets, columnTitle)}
                      disabled={columnTickets.length === 0}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleAddClick(column.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      aria-label="Add task"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Add task</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 overflow-y-auto scroll-hover px-1">
              {showInitialSkeleton ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TicketCardSkeleton key={`skeleton-${column.id}-${i}`} />
                ))
              ) : (
                columnTickets.map(ticket => (
                  <TicketCard
                    key={ticket._id || ticket.id}
                    ticket={ticket}
                    onDragStart={handleDragStart}
                    onClick={onTicketClick}
                    onDelete={onDeleteTicket}
                  />
                ))
              )}
              <button
                type="button"
                onClick={() => handleAddClick(column.id)}
                className="w-full text-left text-[13px] font-semibold hover:brightness-90 px-2 py-2 rounded flex items-center gap-1.5 transition-all cursor-pointer"
                style={{ color }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Task
              </button>
            </div>
          </div>
        );
      })}
    </div>
    </TooltipProvider>
  );
};

export default KanbanBoard;
