import { useState } from 'react';
import '../../assets/Styles/ListView.css';

const ListView = ({ tickets, onTicketClick, onDeleteTicket }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 25;

  // Calculate pagination
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = tickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getStatusClass = (status) => {
    const map = {
      OPEN: 'status-open',
      IN_PROGRESS: 'status-in-progress',
      RESOLVED: 'status-resolved',
      CLOSED: 'status-closed',
    };
    return map[status] || 'status-default';
  };

  const getStatusDotClass = (status) => {
    const map = {
      OPEN: 'open',
      IN_PROGRESS: 'in-progress',
      RESOLVED: 'resolved',
      CLOSED: 'closed',
    };
    return map[status] || 'open';
  };

  const getSeverityClass = (severity) => {
    const map = {
      Critical: 'severity-critical',
      High: 'severity-high',
      Medium: 'severity-medium',
      Low: 'severity-low',
    };
    return map[severity] || 'severity-default';
  };

  const formatStatusLabel = (status) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\B\w+/g, c => c.toLowerCase());
  };

  return (
    <div className="list-view-container">
      <table className="list-table">
        <thead>
          <tr>
            <th className="col-ticket-id">Ticket</th>
            <th className="col-title">Subject</th>
            <th className="col-assigned">Assigned To</th>
            <th className="col-reported">Reported To</th>
            <th className="col-category">Category</th>
            <th className="col-status">Status</th>
            <th className="col-severity">Severity</th>
            <th className="col-priority">Priority</th>
          </tr>
        </thead>
        <tbody>
          {currentTickets.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-list">No tickets</td>
            </tr>
          ) : (
            currentTickets.map((ticket) => {
              const ticketId = ticket._id || ticket.id;
              return (
                <tr
                  key={ticketId}
                  className="list-row"
                  onClick={() => onTicketClick(ticket)}
                >
                  <td>
                    <div className="ticket-id-cell">
                      <span className={`status-dot ${getStatusDotClass(ticket.status)}`} />
                      <span className="id-text">#{ticket.ticketNo || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="title-text">{ticket.subject}</span>
                  </td>
                  <td>
                    <span className="assigned-name">
                      {ticket.assignTo?.name || ticket.assignTo?.username || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <span className="reported-name">
                      {ticket.reportedBy?.name || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <span className="category-text">{ticket.category?.name || '-'}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                      <span className="badge-dot" />
                      {formatStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`severity-badge ${getSeverityClass(ticket.severity)}`}>
                      <span className="badge-dot" />
                      {ticket.severity || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="priority-text">{ticket.priority || '-'}/10</span>
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
        Showing {indexOfFirstTicket + 1}-{Math.min(indexOfLastTicket, tickets.length)} of {tickets.length} tickets
      </div>
    </div>
  );
};

export default ListView;
