import { useState } from 'react';
import usePersistentState from '../hooks/usePersistentState';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '../components/layout/Header';
import SearchFilterBar from '../components/layout/SearchFilterBar';
import KanbanBoard from '../components/ticketing/KanbanBoard';
import ListView from '../components/ticketing/ListView';

const EMPTY_FILTERS = {
  status: '',
  priority: null,
  category: '',
  project: '',
  fromDate: '',
  toDate: '',
  assignTo: '',
  orderId: '',
};

const TasksPage = ({
  tickets,
  loading,
  categories,
  projects,
  user,
  fullName,
  avatarLabel,
  userEmail,
  onOpenCreateModal,
  onTicketClick,
  onStatusChange,
  onDeleteTicket,
  onLogout,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = usePersistentState('tasks.viewMode', 'kanban');
  const [groupBy, setGroupBy] = useState('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });

  const handleClearFilters = () => setFilters(EMPTY_FILTERS);

  const filteredTickets = tickets.filter((ticket) => {
    if (activeFilter === 'my') {
      const assignedUserId = ticket.assignTo?.id || ticket.assignTo?._id;
      const currentUserId = user?.response?.user?._id || user?._id;
      if (assignedUserId !== currentUserId) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fields = [
        ticket.subject,
        ticket.description,
        ticket.assignTo?.name,
        ticket.assignTo?.username,
        ticket.assignTo?.email,
        ticket.assignTo?.authentication?.email,
        ticket.reportedBy?.name,
        ticket.reportedBy?.username,
        ticket.reportedBy?.email,
        ticket.reportedBy?.authentication?.email,
      ];
      if (!fields.some((f) => (f || '').toLowerCase().includes(q))) return false;
    }

    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.priority !== null && filters.priority !== '' && ticket.priority !== filters.priority) return false;
    if (filters.category && (ticket.category?._id || ticket.category) !== filters.category) return false;
    if (filters.project) {
      const pid =
        (typeof ticket.project === 'string'
          ? ticket.project
          : ticket.project?.id || ticket.project?._id || ticket.project?.projectId) ||
        ticket.projectId ||
        '';
      if (String(pid) !== String(filters.project)) return false;
    }
    if (filters.assignTo && (ticket.assignTo?.id || ticket.assignTo?._id) !== filters.assignTo) return false;
    if (filters.fromDate && new Date(ticket.createdAt || ticket.startDate) < new Date(filters.fromDate)) return false;
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(ticket.createdAt || ticket.startDate) > toDate) return false;
    }
    if (filters.orderId) {
      const matchesOrderId = ticket.orderId?.toLowerCase().includes(filters.orderId.toLowerCase());
      const matchesTicketNo = ticket.ticketNo?.toString().includes(filters.orderId);
      if (!matchesOrderId && !matchesTicketNo) return false;
    }

    return true;
  });

  const sortedTickets = (() => {
    if (!sortConfig.field) return filteredTickets;
    return [...filteredTickets].sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];
      if (sortConfig.field === 'category') { aVal = a.category?.name || ''; bVal = b.category?.name || ''; }
      if (sortConfig.field === 'assignTo') { aVal = a.assignTo?.name || ''; bVal = b.assignTo?.name || ''; }
      if (['createdAt', 'startDate', 'endDate'].includes(sortConfig.field)) {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  })();

  return (
    <>
      <Header
        avatarLabel={avatarLabel}
        userEmail={userEmail}
        onCreateTicket={() => onOpenCreateModal(null)}
        onLogout={onLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className="mx-5 mt-2 mb-2 border border-slate-200 rounded-xl flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-5 pt-2.5 pb-1.5">
          <h1 className="text-[16px] font-medium text-slate-900 truncate">
            {fullName ? `${fullName}'s Workspace` : 'Workspace'}
          </h1>
        </div>
        <SearchFilterBar
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          filters={filters}
          setFilters={setFilters}
          onClearFilters={handleClearFilters}
          categories={categories}
          projects={projects}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          viewMode={viewMode}
          setViewMode={setViewMode}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          tickets={sortedTickets}
        />
        {viewMode === 'kanban' ? (
          <div className="flex-1 min-h-0 px-3 pt-2 pb-0 overflow-hidden">
            <KanbanBoard
              tickets={sortedTickets}
              onTicketClick={onTicketClick}
              onStatusChange={onStatusChange}
              onDeleteTicket={onDeleteTicket}
              onAddTask={onOpenCreateModal}
              groupBy={groupBy}
              projects={projects}
              categories={categories}
              loading={loading}
            />
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 px-3 pt-2 pb-0">
            <ListView
              tickets={sortedTickets}
              onTicketClick={onTicketClick}
              onDeleteTicket={onDeleteTicket}
              groupBy={groupBy}
              projects={projects}
              categories={categories}
              loading={loading}
            />
          </ScrollArea>
        )}
      </div>
    </>
  );
};

export default TasksPage;
