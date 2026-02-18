import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTickets, createTicket, updateTicket, deleteTicket, updateTicketStatusOptimistic } from '../redux/ticketSlice';
import { fetchCategories } from '../redux/categorySlice';
import { fetchProjects } from '../redux/projectSlice';
import '../assets/Styles/ListView.css';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import SearchFilterBar from '../components/layout/SearchFilterBar';
import KanbanBoard from '../components/ticketing/KanbanBoard';
import ListView from '../components/ticketing/ListView';
import CreateTicketModal from '../components/ticketing/CreateTicketModal';
import TicketDetailsPage from './TicketDetailsPage';
import ProjectMaster from './ProjectMaster';
import ProjectDetailsPage from './ProjectDetailsPage';
import DeleteConfirmModal from '../components/shared/DeleteConfirmModal';

const Dashboard = ({ currentUser, onLogout }) => {
  const dispatch = useDispatch();
  const { tickets, loading, error } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);
  const { categories } = useSelector((state) => state.categories);
  const { projects } = useSelector((state) => state.projects);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or 'my'
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [groupBy, setGroupBy] = useState('status'); // 'status' | 'project' | 'category'
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: null,
    category: '',
    fromDate: '',
    toDate: '',
    assignTo: '',
    orderId: ''
  });
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, ticketId: null, ticketNo: '' });
  const [activePage, setActivePage] = useState('Dashboard');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    dispatch(fetchTickets());
    dispatch(fetchProjects());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: null,
      category: '',
      fromDate: '',
      toDate: '',
      assignTo: '',
      orderId: ''
    });
  };

  // Filter tickets based on active filter, search query, and dropdown filters
  const filteredTickets = tickets.filter(ticket => {
    // My tasks filter
    if (activeFilter === 'my') {
      const assignedUserId = ticket.assignTo?.id || ticket.assignTo?._id;
      const currentUserId = user?.response?.user?._id || user?._id;
      if (assignedUserId !== currentUserId) return false;
    }

    // Search by email or username
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const assignName = (ticket.assignTo?.name || ticket.assignTo?.username || '').toLowerCase();
      const assignEmail = (ticket.assignTo?.email || ticket.assignTo?.authentication?.email || '').toLowerCase();
      const reporterName = (ticket.reportedBy?.name || ticket.reportedBy?.username || '').toLowerCase();
      const reporterEmail = (ticket.reportedBy?.email || ticket.reportedBy?.authentication?.email || '').toLowerCase();

      if (
        !assignName.includes(query) &&
        !assignEmail.includes(query) &&
        !reporterName.includes(query) &&
        !reporterEmail.includes(query)
      ) {
        return false;
      }
    }

    // Apply dropdown filters
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.priority !== null && filters.priority !== '' && ticket.priority !== filters.priority) return false;
    if (filters.category) {
      const ticketCategoryId = ticket.category?._id || ticket.category;
      if (ticketCategoryId !== filters.category) return false;
    }
    if (filters.assignTo) {
      const ticketAssignToId = ticket.assignTo?.id || ticket.assignTo?._id;
      if (ticketAssignToId !== filters.assignTo) return false;
    }
    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      const ticketDate = new Date(ticket.createdAt || ticket.startDate);
      if (ticketDate < fromDate) return false;
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      const ticketDate = new Date(ticket.createdAt || ticket.startDate);
      if (ticketDate > toDate) return false;
    }
    if (filters.orderId) {
      const matchesOrderId = ticket.orderId?.toLowerCase().includes(filters.orderId.toLowerCase());
      const matchesTicketNo = ticket.ticketNo?.toString().includes(filters.orderId);
      if (!matchesOrderId && !matchesTicketNo) return false;
    }

    return true;
  });

  // Apply sorting
  const sortedTickets = (() => {
    if (!sortConfig.field) return filteredTickets;
    return [...filteredTickets].sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      if (sortConfig.field === 'category') {
        aValue = a.category?.name || '';
        bValue = b.category?.name || '';
      }
      if (sortConfig.field === 'assignTo') {
        aValue = a.assignTo?.name || '';
        bValue = b.assignTo?.name || '';
      }
      if (sortConfig.field === 'createdAt' || sortConfig.field === 'startDate' || sortConfig.field === 'endDate') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  })();

  // Helper function to convert IST datetime-local input to UTC format for API
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const istDateString = dateString + ':00+05:30';
    const date = new Date(istDateString);
    return date.toISOString();
  };

  const handleCreateTicket = async (ticketData) => {
    const newTicket = {
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority || 5,
      severity: ticketData.severity || 'Medium',
      assignTo: ticketData.assignTo,
      reportedTo: ticketData.reportedTo,
      project: ticketData.project,
      category: ticketData.category,
      scope: ticketData.scope,
      attachments: Array.isArray(ticketData.attachments) ? ticketData.attachments : [],
    };

    if (ticketData.startDate) {
      newTicket.startDate = formatDateForAPI(ticketData.startDate);
    }
    if (ticketData.endDate) {
      newTicket.endDate = formatDateForAPI(ticketData.endDate);
    }

    await dispatch(createTicket(newTicket));
    dispatch(fetchTickets());
    setIsCreateModalOpen(false);
  };

  const handleUpdateTicket = async (updatedTicket) => {
    const ticketId = updatedTicket._id || updatedTicket.id;

    const ticketData = {
      ...selectedTicket,
      ...updatedTicket,
      _id: ticketId
    };

    if (ticketData.startDate) {
      ticketData.startDate = formatDateForAPI(ticketData.startDate);
    }
    if (ticketData.endDate) {
      ticketData.endDate = formatDateForAPI(ticketData.endDate);
    }

    await dispatch(updateTicket({ ticketId, ticketData }));
    dispatch(fetchTickets());
    setIsUpdateModalOpen(false);
    setSelectedTicket(null);
  };

  const handleDeleteTicket = (ticketId) => {
    const ticket = tickets.find(t => (t._id || t.id) === ticketId);
    setDeleteConfirm({ open: true, ticketId, ticketNo: ticket?.ticketNo || 'N/A' });
  };

  const confirmDelete = async () => {
    await dispatch(deleteTicket(deleteConfirm.ticketId));
    dispatch(fetchTickets());
    setDeleteConfirm({ open: false, ticketId: null, ticketNo: '' });
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setIsUpdateModalOpen(true);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    const ticketIdStr = String(ticketId);
    const ticket = tickets.find(t => String(t.id || t._id) === ticketIdStr);

    if (ticket) {
      dispatch(updateTicketStatusOptimistic({
        ticketId: ticket._id || ticket.id,
        newStatus
      }));

      dispatch(updateTicket({
        ticketId: ticket._id || ticket.id,
        ticketData: { ...ticket, status: newStatus }
      }));
    }
  };

  const userEmail =
    currentUser?.response?.user?.authentication?.email || currentUser.user.authentication.email || '';

  const fullName =
  currentUser?.response?.user?.authentication?.userName ||
  (currentUser?.response
    ? `${currentUser.response?.user?.name?.first || ''} ${currentUser.response?.user?.name?.last || ''}`.trim()
    : '') ||
  '';

  const avatarLabel =
    (fullName &&
      fullName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .join('')
        .slice(0, 2)) ||
    (userEmail ? userEmail[0]?.toUpperCase() : 'U');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar onLogout={onLogout} activeItem={activePage} onNavigate={(page) => { setActivePage(page); setSelectedTicket(null); setSelectedProject(null); }} />

      {/* Main Content Area */}
      <div className="flex-1 ml-60 flex flex-col overflow-hidden">
        {activePage === 'Projects' ? (
          <>
            <Header
              fullName={fullName}
              avatarLabel={avatarLabel}
              userEmail={userEmail}
              onCreateTicket={() => {}}
              onLogout={onLogout}
            />
            <div className="flex-1 overflow-auto">
              {selectedProject ? (
                <ProjectDetailsPage
                  project={selectedProject}
                  onBack={() => setSelectedProject(null)}
                />
              ) : (
                <ProjectMaster onOpenProject={setSelectedProject} />
              )}
            </div>
          </>
        ) : selectedTicket ? (
          /* Ticket Details Full Page */
          <TicketDetailsPage
            ticket={selectedTicket}
            onBack={() => {
              setSelectedTicket(null);
              setIsUpdateModalOpen(false);
            }}
            onUpdate={handleUpdateTicket}
          />
        ) : (
          <>
            {/* Top Header */}
            <Header
              fullName={fullName}
              avatarLabel={avatarLabel}
              userEmail={userEmail}
              onCreateTicket={() => setIsCreateModalOpen(true)}
              onLogout={onLogout}
            />

            {/* Search/Filter Bar */}
            <SearchFilterBar
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              setFilters={setFilters}
              onClearFilters={handleClearFilters}
              categories={categories}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
              viewMode={viewMode}
              setViewMode={setViewMode}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
            />

            {/* Content */}
            <div className="flex-1 overflow-auto p-5">
              {viewMode === 'kanban' ? (
                <KanbanBoard
                  tickets={sortedTickets || []}
                  onTicketClick={handleTicketClick}
                  onStatusChange={handleStatusChange}
                  onDeleteTicket={handleDeleteTicket}
                  groupBy={groupBy}
                  projects={projects || []}
                  categories={categories || []}
                />
              ) : (
                <ListView
                  tickets={sortedTickets || []}
                  onTicketClick={handleTicketClick}
                  onDeleteTicket={handleDeleteTicket}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTicketModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTicket}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirm.open}
        title="Delete Ticket"
        message={(
          <>
            Are you sure you want to delete ticket <strong>#{deleteConfirm.ticketNo}</strong>? This action cannot be undone.
          </>
        )}
        onCancel={() => setDeleteConfirm({ open: false, ticketId: null, ticketNo: '' })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Dashboard;
