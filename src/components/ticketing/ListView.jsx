import { useState } from 'react';
import '../../assets/Styles/ListView.css';

const ListView = ({ tickets, onTicketClick, onDeleteTicket }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 20;

  // Calculate pagination
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = tickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);

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

  return (
    <div className="list-view-container">
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
        Showing {indexOfFirstTicket + 1}-{Math.min(indexOfLastTicket, tickets.length)} of {tickets.length} tickets
      </div>
    </div>
  );
};

export default ListView;
