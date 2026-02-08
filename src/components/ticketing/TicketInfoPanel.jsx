import React from 'react';

const TicketInfoPanel = ({ ticket }) => {
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
            <span className="info-label">Created:</span>
            <span className="info-value">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Updated:</span>
            <span className="info-value">{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'N/A'}</span>
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
                <p className="history-date">{new Date(change.updatedAt).toLocaleString()}</p>
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
                <p className="history-date">{new Date(worknote.updatedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketInfoPanel;
