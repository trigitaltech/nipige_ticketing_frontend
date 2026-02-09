import React from 'react';

const TicketInfoPanel = ({ ticket }) => {
  // Helper function to convert UTC date to IST and format
  // Input: "2026-01-24T00:00:00.000Z" (UTC)
  // Output: "24/01/2026, 05:30:00 AM" (IST - 24-hour format)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    // Parse the UTC date string and convert to IST
    const date = new Date(dateString);

    // Format in IST timezone
    const istDate = date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Use 24-hour format
    });

    // The output format from toLocaleString is "DD/MM/YYYY, HH:mm:ss"
    return istDate;
  };

  return (
    <div className="ticket-info-panel">
      <div className="ticket-metadata">
        <h3>Ticket Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Ticket No:</span>
            <span className="info-value">{ticket.ticketNo || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Category:</span>
            <span className="info-value">{ticket.category?.name || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Reported By:</span>
            <span className="info-value">{ticket.reportedBy?.name || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Reported To:</span>
            <span className="info-value">{ticket.reportedTo?.name || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Escalated:</span>
            <span className="info-value">{ticket.escalated ? 'Yes ⚠️' : 'No'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Scope:</span>
            <span className="info-value">{ticket.scope || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Start Date:</span>
            <span className="info-value">{formatDate(ticket.startDate)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">End Date:</span>
            <span className="info-value">{formatDate(ticket.endDate)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Created:</span>
            <span className="info-value">{formatDate(ticket.createdAt)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Updated:</span>
            <span className="info-value">{formatDate(ticket.updatedAt)}</span>
          </div>
          {ticket.assignTo?.email && (
            <div className="info-item info-item-full">
              <span className="info-label">Assignee Email:</span>
              <span className="info-value">{ticket.assignTo.email}</span>
            </div>
          )}
        </div>
      </div>

      {ticket.changeHistory && ticket.changeHistory.length > 0 && (
        <div className="ticket-metadata change-history">
          <h3>Change History</h3>
          <div className="history-list">
            {ticket.changeHistory.map((change, index) => (
              <div key={change._id || index} className="history-item">
                <p className="history-action">
                  <strong>{change.action}</strong> by {change.updatedBy?.name || 'Unknown'}
                </p>
                <p className="history-description">{change.description}</p>
                <p className="history-date">{formatDate(change.updatedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ticket.worknoteHistory && ticket.worknoteHistory.length > 0 && (
        <div className="ticket-metadata change-history">
          <h3>Comment History</h3>
          <div className="history-list">
            {ticket.worknoteHistory.map((worknote, index) => (
              <div key={worknote._id || index} className="history-item">
                <p className="history-action">
                  <strong>Comment</strong> by {worknote.updatedBy?.name || 'Unknown'}
                </p>
                <p className="history-description">{worknote.description}</p>
                <p className="history-date">{formatDate(worknote.updatedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketInfoPanel;
