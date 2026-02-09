import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTickets, createTicket, updateTicket, deleteTicket, updateTicketStatusOptimistic } from '../redux/ticketSlice';
import '../assets/Styles/Dashboard.css';
import KanbanBoard from '../components/ticketing/KanbanBoard';
import ListView from '../components/ticketing/ListView';
import CreateTicketModal from '../components/ticketing/CreateTicketModal';
import UpdateTicketModal from '../components/ticketing/UpdateTicketModal';
import SearchBar from '../components/shared/SearchBar';
import FilterDropdown from '../components/shared/FilterDropdown';
import SortDropdown from '../components/shared/SortDropdown';

const Dashboard = ({ currentUser, onLogout }) => {
  const dispatch = useDispatch();
  const { tickets, loading, error } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);
  const { categories } = useSelector((state) => state.categories);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or 'my'
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
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

  useEffect(() => {
    dispatch(fetchTickets());
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
      assignTo: ticketData.assignTo,
      reportedTo: ticketData.reportedTo,
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
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>TRIGITAL Task Management Dashboard</h1>
          <span className="user-info">Welcome, {fullName}</span>
        </div>
        <div className="header-right">
          <button className="create-ticket-btn" onClick={() => setIsCreateModalOpen(true)}>
            + Create Ticket
          </button>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
          <div className="user-avatar" title={userEmail || 'No email available'}>
            {avatarLabel}
          </div>
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
              padding: '8px 16px',
              border: activeFilter === 'all' ? '1px solid #5E6C84' : '1px solid #DFE1E6',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              backgroundColor: activeFilter === 'all' ? '#5E6C84' : 'white',
              color: activeFilter === 'all' ? 'white' : '#5E6C84',
              outline: 'none',
              transform: 'none',
              transition: 'none',
            }}
          >
            All Tasks
          </button>
          <button
            onClick={() => setActiveFilter('my')}
            style={{
              padding: '8px 16px',
              border: activeFilter === 'my' ? '1px solid #5E6C84' : '1px solid #DFE1E6',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              backgroundColor: activeFilter === 'my' ? '#5E6C84' : 'white',
              color: activeFilter === 'my' ? 'white' : '#5E6C84',
              outline: 'none',
              transform: 'none',
              transition: 'none',
            }}
          >
            My Tasks
          </button>
        </div>

        {/* Search bar, Filter & Sort dropdowns */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterDropdown
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            categories={categories}
          />
          <SortDropdown
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
            onClearSort={() => setSortConfig({ field: '', direction: 'asc' })}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode('kanban')}
            title="Kanban View"
            style={{
              padding: '8px 12px',
              border: viewMode === 'kanban' ? '1px solid #5E6C84' : '1px solid #DFE1E6',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '16px',
              backgroundColor: viewMode === 'kanban' ? '#5E6C84' : 'white',
              color: viewMode === 'kanban' ? 'white' : '#5E6C84',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transform: 'none',
              transition: 'none',
            }}
          >
            ▦
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            style={{
              padding: '8px 12px',
              border: viewMode === 'list' ? '1px solid #5E6C84' : '1px solid #DFE1E6',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '16px',
              backgroundColor: viewMode === 'list' ? '#5E6C84' : 'white',
              color: viewMode === 'list' ? 'white' : '#5E6C84',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transform: 'none',
              transition: 'none',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        { viewMode === 'kanban' ? (
          <KanbanBoard
            tickets={sortedTickets || []}
            onTicketClick={handleTicketClick}
            onStatusChange={handleStatusChange}
            onDeleteTicket={handleDeleteTicket}
          />
        ) : (
          <ListView
            tickets={sortedTickets || []}
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
