import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { fetchTickets, createTicket, updateTicket, deleteTicket, updateTicketStatusOptimistic } from '../redux/ticketSlice';
import { fetchCategories } from '../redux/categorySlice';
import { fetchProjects } from '../redux/projectSlice';
import { fetchUsers } from '../redux/userSlice';
import '../assets/Styles/ListView.css';
import Sidebar from '../components/layout/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Header from '../components/layout/Header';
import SearchFilterBar from '../components/layout/SearchFilterBar';
import KanbanBoard from '../components/ticketing/KanbanBoard';
import ListView from '../components/ticketing/ListView';
import CreateTicketModal from '../components/ticketing/CreateTicketModal';
import TicketDetailsPage from './TicketDetailsPage';
import ProjectMaster from './ProjectMaster';
import ProjectDetailsPage from './ProjectDetailsPage';
import WeeklyTasks from './WeeklyTasks';
import DeleteConfirmModal from '../components/shared/DeleteConfirmModal';
import DashboardOverview from '../components/layout/DashboardOverview';
import usePersistentState from '../hooks/usePersistentState';
import TicketDetailsSkeleton from '../components/skeletons/TicketDetailsSkeleton';

// Resolves a ticket from Redux by URL param and renders TicketDetailsPage.
const TicketDetailsRoute = ({ tickets, loading, onUpdate }) => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const ticket = tickets.find((t) => String(t._id || t.id) === String(ticketId));

  if (!ticket) {
    if (loading) return <TicketDetailsSkeleton />;
    return (
      <div className="p-10 text-slate-500">
        Ticket not found.{' '}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <TicketDetailsPage
      ticket={ticket}
      onBack={() => navigate('/')}
      onUpdate={onUpdate}
    />
  );
};

// Resolves a project by URL param.
const ProjectDetailsRoute = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects } = useSelector((state) => state.projects);
  const project = projects.find((p) => String(p._id || p.id) === String(projectId));

  if (!project) {
    return (
      <div className="p-10 text-slate-500">Loading project…</div>
    );
  }

  return <ProjectDetailsPage project={project} onBack={() => navigate('/projects')} />;
};

const Dashboard = ({ currentUser, onLogout }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tickets, loading, error } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);
  const { categories } = useSelector((state) => state.categories);
  const { projects } = useSelector((state) => state.projects);

  const [sidebarOpen, setSidebarOpen] = usePersistentState('sidebar.open', true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or 'my'
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [groupBy, setGroupBy] = useState('status'); // 'status' | 'project' | 'category'
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: null,
    category: '',
    project: '',
    fromDate: '',
    toDate: '',
    assignTo: '',
    orderId: ''
  });
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, ticketId: null, ticketNo: '' });

  useEffect(() => {
    dispatch(fetchTickets());
    dispatch(fetchProjects());
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: null,
      category: '',
      project: '',
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

    // Search by subject, description, email, or username
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const subject = (ticket.subject || '').toLowerCase();
      const description = (ticket.description || '').toLowerCase();
      const assignName = (ticket.assignTo?.name || ticket.assignTo?.username || '').toLowerCase();
      const assignEmail = (ticket.assignTo?.email || ticket.assignTo?.authentication?.email || '').toLowerCase();
      const reporterName = (ticket.reportedBy?.name || ticket.reportedBy?.username || '').toLowerCase();
      const reporterEmail = (ticket.reportedBy?.email || ticket.reportedBy?.authentication?.email || '').toLowerCase();

      if (
        !subject.includes(query) &&
        !description.includes(query) &&
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
    if (filters.project) {
      const ticketProjectId =
        (typeof ticket.project === 'string'
          ? ticket.project
          : ticket.project?.id || ticket.project?._id || ticket.project?.projectId) ||
        ticket.projectId ||
        '';
      if (String(ticketProjectId) !== String(filters.project)) return false;
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
      timeEstimateMs: ticketData.timeEstimateMs,
      attachments: Array.isArray(ticketData.attachments) ? ticketData.attachments : [],
    };

    if (ticketData.status) {
      newTicket.status = ticketData.status;
    }

    if (ticketData.startDate) {
      newTicket.startDate = formatDateForAPI(ticketData.startDate);
    }
    if (ticketData.endDate) {
      newTicket.endDate = formatDateForAPI(ticketData.endDate);
    }

    await dispatch(createTicket(newTicket));
    dispatch(fetchTickets());
    setIsCreateModalOpen(false);
    setCreatePrefill(null);
  };

  const handleUpdateTicket = async (updatedTicket) => {
    const ticketId = updatedTicket._id || updatedTicket.id;
    const existing = tickets.find((t) => (t._id || t.id) === ticketId) || {};

    const ticketData = {
      ...existing,
      ...updatedTicket,
      _id: ticketId,
    };

    if (ticketData.startDate) {
      ticketData.startDate = formatDateForAPI(ticketData.startDate);
    }
    if (ticketData.endDate) {
      ticketData.endDate = formatDateForAPI(ticketData.endDate);
    }

    await dispatch(updateTicket({ ticketId, ticketData }));
    dispatch(fetchTickets());
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
    const id = ticket?._id || ticket?.id;
    if (id) navigate(`/tickets/${id}`);
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

  const workspaceCard = (
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
        projects={projects || []}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        viewMode={viewMode}
        setViewMode={setViewMode}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        tickets={sortedTickets || []}
      />
      <div className={`flex-1 min-h-0 px-3 pt-2 pb-0 ${viewMode === 'kanban' ? 'overflow-hidden' : 'overflow-auto'}`}>
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tickets={sortedTickets || []}
            onTicketClick={handleTicketClick}
            onStatusChange={handleStatusChange}
            onDeleteTicket={handleDeleteTicket}
            onAddTask={(prefill) => {
              setCreatePrefill(prefill);
              setIsCreateModalOpen(true);
            }}
            groupBy={groupBy}
            projects={projects || []}
            categories={categories || []}
            loading={loading}
          />
        ) : (
          <ListView
            tickets={sortedTickets || []}
            onTicketClick={handleTicketClick}
            onDeleteTicket={handleDeleteTicket}
            groupBy={groupBy}
            projects={projects || []}
            categories={categories || []}
            loading={loading}
          />
        )}
      </div>
    </div>
  );

  const dashboardHeader = (
    <Header
      avatarLabel={avatarLabel}
      userEmail={userEmail}
      onCreateTicket={() => setIsCreateModalOpen(true)}
      onLogout={onLogout}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    />
  );

  const DashboardPage = (
    <>
      {dashboardHeader}
      <DashboardOverview tickets={tickets || []} loading={loading} />
    </>
  );

  const TasksPage = (
    <>
      {dashboardHeader}
      {workspaceCard}
    </>
  );

  const withHeader = (node) => (
    <>
      <Header
        fullName={fullName}
        avatarLabel={avatarLabel}
        userEmail={userEmail}
        onCreateTicket={() => {}}
        onLogout={onLogout}
      />
      <div className="flex-1 overflow-auto">{node}</div>
    </>
  );

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar onLogout={onLogout} />

      <SidebarInset className="h-svh flex flex-col overflow-hidden bg-gray-50">
        <Routes>
          <Route path="/" element={DashboardPage} />
          <Route path="/tasks" element={TasksPage} />
          <Route
            path="/tickets/:ticketId"
            element={<TicketDetailsRoute tickets={tickets || []} loading={loading} onUpdate={handleUpdateTicket} />}
          />
          <Route path="/projects" element={withHeader(<ProjectMaster />)} />
          <Route path="/projects/:projectId" element={withHeader(<ProjectDetailsRoute />)} />
          <Route path="/weekly-tasks" element={withHeader(<WeeklyTasks />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SidebarInset>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTicketModal
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreatePrefill(null);
          }}
          onCreate={handleCreateTicket}
          initialData={createPrefill}
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
    </SidebarProvider>
  );
};

export default Dashboard;
