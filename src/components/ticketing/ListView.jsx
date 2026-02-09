import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import FilterBar from './FilterBar';
import '../../assets/Styles/ListView.css';

const ListView = ({ tickets, onTicketClick, onDeleteTicket }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredAndSortedTickets, setFilteredAndSortedTickets] = useState(tickets);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });
  const ticketsPerPage = 20;
  const { categories } = useSelector((state) => state.categories);

  // Update filtered tickets when tickets prop changes
  useEffect(() => {
    setFilteredAndSortedTickets(tickets);
  }, [tickets]);

  // Apply filters
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    let filtered = [...tickets];

    // Apply status filter
    if (newFilters.status) {
      filtered = filtered.filter(ticket => ticket.status === newFilters.status);
    }

    // Apply priority filter
    if (newFilters.priority !== null && newFilters.priority !== '') {
      filtered = filtered.filter(ticket => ticket.priority === newFilters.priority);
    }

    // Apply category filter
    if (newFilters.category) {
      filtered = filtered.filter(ticket => {
        const ticketCategoryId = ticket.category?._id || ticket.category;
        return ticketCategoryId === newFilters.category;
      });
    }

    // Apply assignTo filter
    if (newFilters.assignTo) {
      filtered = filtered.filter(ticket => {
        const ticketAssignToId = ticket.assignTo?.id || ticket.assignTo?._id;
        return ticketAssignToId === newFilters.assignTo;
      });
    }

    // Apply date range filter
    if (newFilters.fromDate) {
      const fromDate = new Date(newFilters.fromDate);
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.createdAt || ticket.startDate);
        return ticketDate >= fromDate;
      });
    }

    if (newFilters.toDate) {
      const toDate = new Date(newFilters.toDate);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.createdAt || ticket.startDate);
        return ticketDate <= toDate;
      });
    }

    // Apply orderId filter
    if (newFilters.orderId) {
      filtered = filtered.filter(ticket =>
        ticket.orderId?.toLowerCase().includes(newFilters.orderId.toLowerCase()) ||
        ticket.ticketNo?.toString().includes(newFilters.orderId)
      );
    }

    // Apply current sort
    const sorted = applySorting(filtered, sortConfig);
    setFilteredAndSortedTickets(sorted);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Apply sorting
  const applySorting = (ticketsToSort, config) => {
    if (!config.field) return ticketsToSort;

    const sorted = [...ticketsToSort].sort((a, b) => {
      let aValue = a[config.field];
      let bValue = b[config.field];

      // Handle nested category name
      if (config.field === 'category') {
        aValue = a.category?.name || '';
        bValue = b.category?.name || '';
      }

      // Handle nested assignTo name
      if (config.field === 'assignTo') {
        aValue = a.assignTo?.name || '';
        bValue = b.assignTo?.name || '';
      }

      // Handle date fields
      if (config.field === 'createdAt' || config.field === 'startDate' || config.field === 'endDate') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return config.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Numeric or date comparison
      if (config.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  };

  const handleSortChange = (newSortConfig) => {
    setSortConfig(newSortConfig);
    const sorted = applySorting(filteredAndSortedTickets, newSortConfig);
    setFilteredAndSortedTickets(sorted);
  };

  // Calculate pagination
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredAndSortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredAndSortedTickets.length / ticketsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      Critical: '#D32F2F',
      High: '#F57C00',
      Medium: '#FBC02D',
      Low: '#388E3C',
    };
    return colors[severity] || '#757575';
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: '#1976D2',
      IN_PROGRESS: '#F57C00',
      RESOLVED: '#7B1FA2',
      CLOSED: '#388E3C',
    };
    return colors[status] || '#757575';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <div className="list-view-container">
      <FilterBar
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        categories={categories}
      />
      <table className="list-table">
        <thead>
          <tr>
            <th className="col-ticket-id">Ticket ID</th>
            <th className="col-title">Title</th>
            <th className="col-description">Description</th>
            <th className="col-category">Category</th>
            <th className="col-severity">Severity</th>
            <th className="col-status">Status</th>
            <th className="col-assigned">Assigned</th>
            <th className="col-reporter">Reporter</th>
            <th className="col-priority">Priority</th>
          </tr>
        </thead>
        <tbody>
          {currentTickets.length === 0 ? (
            <tr>
              <td colSpan="9" className="empty-list">No tickets</td>
            </tr>
          ) : (
            currentTickets.map((ticket) => {
              return (
                <tr
                  key={ticket._id || ticket.id}
                  className="list-row"
                  onClick={() => onTicketClick(ticket)}
                >
                  <td className="ticket-id">
                    <span className="id-text">#{ticket.ticketNo || 'N/A'}</span>
                  </td>
                  <td className="ticket-title">
                    <span className="title-text">{ticket.subject}</span>
                  </td>
                  <td className="ticket-description">
                    <span className="description-text">
                      {ticket.description ? ticket.description.substring(0, 30) + (ticket.description.length > 30 ? '...' : '') : '-'}
                    </span>
                  </td>
                  <td className="ticket-category">
                    <div className="category-wrapper">
                      <span className="category-icon">📁</span>
                      <span className="category-text">{ticket.category?.name || 'GRIEVANCES'}</span>
                    </div>
                  </td>
                  <td className="ticket-severity">
                    <span
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(ticket.severity) }}
                    >
                      {ticket.severity || 'N/A'}
                    </span>
                  </td>
                  <td className="ticket-status">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(ticket.status) }}
                    >
                      {ticket.status ? ticket.status.replace('_', ' ') : 'N/A'}
                    </span>
                  </td>
                  <td className="ticket-assigned">
                    <div className="user-info">
                      <div className="user-avatar">{(ticket.assignTo?.name || 'U')[0].toUpperCase()}</div>
                      <span className="user-name">
                        {ticket.assignTo?.name || ticket.assignTo?.username || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="ticket-reporter">
                    <span className="reporter-text">
                      {ticket.reportedBy?.name || ticket.reportedBy?.username || 'N/A'}
                    </span>
                  </td>
                  <td className="ticket-priority">
                    <span className="priority-text">{ticket.priority || 'N/A'}/10</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ←
          </button>

          <div className="pagination-numbers">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                pageNumber === currentPage - 2 ||
                pageNumber === currentPage + 2
              ) {
                return <span key={pageNumber} className="pagination-ellipsis">...</span>;
              }
              return null;
            })}
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            →
          </button>
        </div>
      )}

      <div className="list-view-footer">
        Showing {indexOfFirstTicket + 1}-{Math.min(indexOfLastTicket, filteredAndSortedTickets.length)} of {filteredAndSortedTickets.length} tickets
      </div>
    </div>
  );
};

export default ListView;
