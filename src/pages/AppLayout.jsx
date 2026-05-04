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
import CreateTicketModal from '../components/ticketing/CreateTicketModal';
import TicketDetailsPage from './TicketDetailsPage';
import ProjectMaster from './ProjectMaster';
import ProjectDetailsPage from './ProjectDetailsPage';
import ManageTeamPage from './ManageTeamPage';
import WeeklyTasks from './WeeklyTasks';
import DeleteConfirmModal from '../components/shared/DeleteConfirmModal';
import OverviewPage from './OverviewPage';
import TasksPage from './TasksPage';
import usePersistentState from '../hooks/usePersistentState';
import TicketDetailsSkeleton from '../components/skeletons/TicketDetailsSkeleton';

const TicketDetailsRoute = ({ tickets, loading, onUpdate }) => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const ticket = tickets.find((t) => String(t._id || t.id) === String(ticketId));

  if (!ticket) {
    if (loading) return <TicketDetailsSkeleton />;
    return (
      <div className="p-10 text-slate-500">
        Ticket not found.{' '}
        <button type="button" onClick={() => navigate('/')} className="text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return <TicketDetailsPage ticket={ticket} onBack={() => navigate(-1)} onUpdate={onUpdate} />;
};

const ProjectDetailsRoute = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects } = useSelector((state) => state.projects);
  const project = projects.find((p) => String(p._id || p.id) === String(projectId));

  if (!project) return <div className="p-10 text-slate-500">Loading project…</div>;

  return <ProjectDetailsPage project={project} onBack={() => navigate('/projects')} />;
};

const AppLayout = ({ currentUser, onLogout }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tickets, loading } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);
  const { categories } = useSelector((state) => state.categories);
  const { projects } = useSelector((state) => state.projects);

  const [sidebarOpen, setSidebarOpen] = usePersistentState('sidebar.open', true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, ticketId: null, ticketNo: '' });

  useEffect(() => {
    dispatch(fetchTickets());
    dispatch(fetchProjects());
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  const userEmail =
    currentUser?.response?.user?.authentication?.email ||
    currentUser.user.authentication.email ||
    '';

  const fullName =
    currentUser?.response?.user?.authentication?.userName ||
    (currentUser?.response
      ? `${currentUser.response?.user?.name?.first || ''} ${currentUser.response?.user?.name?.last || ''}`.trim()
      : '') ||
    '';

  const avatarLabel =
    (fullName &&
      fullName.split(' ').filter(Boolean).map((p) => p[0]?.toUpperCase()).join('').slice(0, 2)) ||
    (userEmail ? userEmail[0]?.toUpperCase() : 'U');

  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString + ':00+05:30').toISOString();
  };

  const handleOpenCreateModal = (prefill) => {
    setCreatePrefill(prefill || null);
    setIsCreateModalOpen(true);
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
      ...(ticketData.status && { status: ticketData.status }),
      ...(ticketData.startDate && { startDate: formatDateForAPI(ticketData.startDate) }),
      ...(ticketData.endDate && { endDate: formatDateForAPI(ticketData.endDate) }),
    };
    await dispatch(createTicket(newTicket));
    dispatch(fetchTickets());
    setIsCreateModalOpen(false);
    setCreatePrefill(null);
  };

  const handleUpdateTicket = async (updatedTicket) => {
    const ticketId = updatedTicket._id || updatedTicket.id;
    const ticketData = { ...updatedTicket };
    if (Object.prototype.hasOwnProperty.call(ticketData, 'startDate')) {
      ticketData.startDate = ticketData.startDate ? formatDateForAPI(ticketData.startDate) : null;
    }
    if (Object.prototype.hasOwnProperty.call(ticketData, 'endDate')) {
      ticketData.endDate = ticketData.endDate ? formatDateForAPI(ticketData.endDate) : null;
    }
    await dispatch(updateTicket({ ticketId, ticketData }));
    dispatch(fetchTickets());
  };

  const handleDeleteTicket = (ticketId) => {
    const ticket = tickets.find((t) => (t._id || t.id) === ticketId);
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

  const handleStatusChange = (ticketId, newStatus) => {
    const ticket = tickets.find((t) => String(t.id || t._id) === String(ticketId));
    if (ticket) {
      dispatch(updateTicketStatusOptimistic({ ticketId: ticket._id || ticket.id, newStatus }));
      dispatch(updateTicket({ ticketId: ticket._id || ticket.id, ticketData: { status: newStatus } }));
    }
  };

  const commonProps = { avatarLabel, userEmail, fullName, onLogout };

  const withHeader = (node, headerProps = {}) => (
    <>
      <Header
        avatarLabel={avatarLabel}
        userEmail={userEmail}
        onCreateTicket={() => {}}
        onLogout={onLogout}
        {...headerProps}
      />
      <div className="flex-1 overflow-auto">{node}</div>
    </>
  );

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar onLogout={onLogout} />

      <SidebarInset className="h-svh flex flex-col overflow-hidden bg-gray-50">
        <Routes>
          <Route
            path="/"
            element={
              <OverviewPage
                {...commonProps}
                tickets={tickets || []}
                loading={loading}
                onCreateTicket={() => handleOpenCreateModal(null)}
              />
            }
          />
          <Route
            path="/tasks"
            element={
              <TasksPage
                {...commonProps}
                tickets={tickets || []}
                loading={loading}
                categories={categories || []}
                projects={projects || []}
                user={user}
                onOpenCreateModal={handleOpenCreateModal}
                onTicketClick={handleTicketClick}
                onStatusChange={handleStatusChange}
                onDeleteTicket={handleDeleteTicket}
              />
            }
          />
          <Route
            path="/tickets/:ticketId"
            element={
              <TicketDetailsRoute tickets={tickets || []} loading={loading} onUpdate={handleUpdateTicket} />
            }
          />
          <Route path="/projects" element={withHeader(<ProjectMaster />, { showCreateButton: false })} />
          <Route path="/projects/:projectId" element={withHeader(<ProjectDetailsRoute />, { showCreateButton: false })} />
          <Route path="/projects/:projectId/team" element={withHeader(<ManageTeamPage />, { showCreateButton: false })} />
          <Route
            path="/weekly-tasks"
            element={withHeader(<WeeklyTasks onOpenCreateModal={handleOpenCreateModal} />, { showCreateButton: false })}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SidebarInset>

      {isCreateModalOpen && (
        <CreateTicketModal
          onClose={() => { setIsCreateModalOpen(false); setCreatePrefill(null); }}
          onCreate={handleCreateTicket}
          initialData={createPrefill}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirm.open}
        title="Delete Ticket"
        message={
          <>
            Are you sure you want to delete ticket <strong>#{deleteConfirm.ticketNo}</strong>? This action cannot be undone.
          </>
        }
        onCancel={() => setDeleteConfirm({ open: false, ticketId: null, ticketNo: '' })}
        onConfirm={confirmDelete}
      />
    </SidebarProvider>
  );
};

export default AppLayout;
