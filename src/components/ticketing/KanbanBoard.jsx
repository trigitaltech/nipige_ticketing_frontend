import TicketCard from './TicketCard';

const statusConfig = {
  OPEN: { title: 'Open', dotColor: 'bg-blue-500' },
  IN_PROGRESS: { title: 'In Progress', dotColor: 'bg-orange-400' },
  RESOLVED: { title: 'Resolved', dotColor: 'bg-purple-500' },
  CLOSED: { title: 'Closed', dotColor: 'bg-green-500' },
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
  groupBy = 'status',
  projects = [],
  categories = [],
}) => {
  const statusColumns = [
    { id: 'OPEN' },
    { id: 'IN_PROGRESS' },
    { id: 'RESOLVED' },
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
    <div className="flex gap-2 h-full overflow-x-auto pb-4">
      {columns.map(column => {
        const config = statusConfig[column.id];
        const columnTitle = groupBy === 'status' ? (config?.title || column.id) : column.title;
        const dotColor = groupBy === 'status' ? (config?.dotColor || 'bg-gray-400') : (column.dotColor || 'bg-gray-400');
        const columnTickets = getTicketsByColumn(column.id);
        const totalTickets = columnTickets.length;

        return (
          <div
            key={column.id}
            className="min-w-[320px] flex-1 flex flex-col"
            onDragOver={groupBy === 'status' ? handleDragOver : undefined}
            onDrop={groupBy === 'status' ? (e) => handleDrop(e, column.id) : undefined}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-3 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                <h3 className="text-sm font-semibold text-gray-700">{columnTitle}</h3>
                <span className="ml-1 text-sm font-medium text-gray-400">
                  {totalTickets}
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>

            {/* Column Content */}
            <div className="kanban-column-scroll flex-1 space-y-3 overflow-y-auto px-1">
              {columnTickets.map(ticket => (
                <TicketCard
                  key={ticket._id || ticket.id}
                  ticket={ticket}
                  onDragStart={handleDragStart}
                  onClick={onTicketClick}
                  onDelete={onDeleteTicket}
                />
              ))}
              {totalTickets === 0 && (
                <div className="text-center text-gray-400 py-10 text-sm">
                  No tickets
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
