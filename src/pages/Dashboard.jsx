import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTickets, createTicket, updateTicket, deleteTicket, updateTicketStatusOptimistic } from '../redux/ticketSlice';
import '../assets/Styles/Dashboard.css';
import KanbanBoard from '../components/ticketing/KanbanBoard';
import ListView from '../components/ticketing/ListView';
import CreateTicketModal from '../components/ticketing/CreateTicketModal';
import UpdateTicketModal from '../components/ticketing/UpdateTicketModal';

const Dashboard = ({ currentUser, onLogout }) => {
  const dispatch = useDispatch();
  const { tickets, loading, error } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or 'my'
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  // Filter tickets based on active filter
  const filteredTickets = activeFilter === 'my'
    ? tickets.filter(ticket => {
        const assignedUserId = ticket.assignTo?.id || ticket.assignTo?._id;
        const currentUserId = user?.response?.user?._id || user?._id;
        return assignedUserId === currentUserId;
      })
    : tickets;

  // Helper function to convert IST datetime-local input to UTC format for API
  // Input: "YYYY-MM-DDTHH:mm" (treated as IST)
  // Output: "YYYY-MM-DDTHH:mm:ss.000Z" (UTC)
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;

    // Create a date object treating the input as IST
    // We append IST timezone offset (+05:30) to make it explicit
    const istDateString = dateString + ':00+05:30';
    const date = new Date(istDateString);

    // Convert to ISO string which gives UTC format: "YYYY-MM-DDTHH:mm:ss.000Z"
    return date.toISOString();
  };

  const handleCreateTicket = async (ticketData) => {
    const newTicket = {
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority || 5,
      severity: ticketData.severity || 'Medium',
      assignedTo: ticketData.assignedTo,
      category: ticketData.category,
      scope: ticketData.scope,
      // The API will auto-populate: reportedBy, tenant, etc.
    };

    // Add startDate and endDate if provided
    if (ticketData.startDate) {
      newTicket.startDate = formatDateForAPI(ticketData.startDate);
    }
    if (ticketData.endDate) {
      newTicket.endDate = formatDateForAPI(ticketData.endDate);
    }

    await dispatch(createTicket(newTicket));
    // Refetch tickets to ensure UI is in sync with server
    dispatch(fetchTickets());
    setIsCreateModalOpen(false);
  };

  const handleUpdateTicket = async (updatedTicket) => {
    const ticketId = updatedTicket._id || updatedTicket.id;

    // Merge the updated fields with the original ticket data
    const ticketData = {
      ...selectedTicket,
      ...updatedTicket,
      _id: ticketId
    };

    // Convert startDate and endDate to API format if they exist
    if (ticketData.startDate) {
      ticketData.startDate = formatDateForAPI(ticketData.startDate);
    }
    if (ticketData.endDate) {
      ticketData.endDate = formatDateForAPI(ticketData.endDate);
    }

    await dispatch(updateTicket({ ticketId, ticketData }));
    // Refetch tickets to ensure UI is in sync with server
    dispatch(fetchTickets());
    setIsUpdateModalOpen(false);
    setSelectedTicket(null);
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      await dispatch(deleteTicket(ticketId));
    }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setIsUpdateModalOpen(true);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    // Convert ticketId to string for comparison with MongoDB ObjectIds
    const ticketIdStr = String(ticketId);
    const ticket = tickets.find(t => String(t.id || t._id) === ticketIdStr);

    if (ticket) {
      console.log(`Updating ticket ${ticket.ticketNo} status from ${ticket.status} to ${newStatus}`);

      // Optimistically update the UI immediately
      dispatch(updateTicketStatusOptimistic({
        ticketId: ticket._id || ticket.id,
        newStatus
      }));

      // Update in background (no await, no refetch)
      dispatch(updateTicket({
        ticketId: ticket._id || ticket.id,
        ticketData: { ...ticket, status: newStatus }
      }));
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>TRIGITAL Task Management Dashboard</h1>
          <span className="user-info">Welcome, {currentUser.username}</span>
        </div>
        <div className="header-right">
          <button className="create-ticket-btn" onClick={() => setIsCreateModalOpen(true)}>
            + Create Ticket
          </button>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      

      <div style={{
        padding: '8px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '10px 24px',
              border: activeFilter === 'all' ? '2px solid #2196f3' : '2px solid transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              backgroundColor: activeFilter === 'all' ? '#2196f3' : 'white',
              color: activeFilter === 'all' ? 'white' : '#555',
              boxShadow: activeFilter === 'all' ? '0 2px 8px rgba(33, 150, 243, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            All Tasks
          </button>
          <button
            onClick={() => setActiveFilter('my')}
            style={{
              padding: '10px 24px',
              border: activeFilter === 'my' ? '2px solid #2196f3' : '2px solid transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              backgroundColor: activeFilter === 'my' ? '#2196f3' : 'white',
              color: activeFilter === 'my' ? 'white' : '#555',
              boxShadow: activeFilter === 'my' ? '0 2px 8px rgba(33, 150, 243, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            My Tasks
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode('kanban')}
            title="Kanban View"
            style={{
              padding: '8px 12px',
              border: viewMode === 'kanban' ? '2px solid #5E6C84' : '1px solid #DFE1E6',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s ease',
              backgroundColor: viewMode === 'kanban' ? '#5E6C84' : 'white',
              color: viewMode === 'kanban' ? 'white' : '#5E6C84',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              height: '40px',
            }}
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            style={{
              padding: '8px 12px',
              border: viewMode === 'list' ? '2px solid #5E6C84' : '1px solid #DFE1E6',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s ease',
              backgroundColor: viewMode === 'list' ? '#5E6C84' : 'white',
              color: viewMode === 'list' ? 'white' : '#5E6C84',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              height: '40px',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        { viewMode === 'kanban' ? (
          <KanbanBoard
            tickets={filteredTickets || []}
            onTicketClick={handleTicketClick}
            onStatusChange={handleStatusChange}
            onDeleteTicket={handleDeleteTicket}
          />
        ) : (
          <ListView
            tickets={filteredTickets || []}
            onTicketClick={handleTicketClick}
            onDeleteTicket={handleDeleteTicket}
          />
        )}
      </div>

      {isCreateModalOpen && (
        <CreateTicketModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTicket}
        />
      )}

      {isUpdateModalOpen && selectedTicket && (
        <UpdateTicketModal
          ticket={selectedTicket}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedTicket(null);
          }}
          onUpdate={handleUpdateTicket}
        />
      )}
    </div>
  );
};

export default Dashboard;