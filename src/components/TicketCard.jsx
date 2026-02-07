import '../assets/Styles/TicketCard.css';

const TicketCard = ({ ticket, onDragStart, onClick, onDelete }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ticketId = ticket._id || ticket.id;
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(ticketId);
  };

  // Extract ticket data
  const ticketNo = ticket.ticketNo || 'N/A';
  const subject = ticket.subject || ticket.title || 'No Subject';
  const description = ticket.description || 'No description';
  const severity = ticket.severity || ticket.category?.severity || 'Low';
  const priority = ticket.priority || 0;
  const assignedTo = ticket.assignTo?.name || ticket.assignedTo || 'Unassigned';
  const assignedEmail = ticket.assignTo?.email || '';
  const reportedBy = ticket.reportedBy?.name || 'Unknown';
  const createdAt = ticket.createdAt;
  const categoryName = ticket.category?.name || '';
  const escalated = ticket.escalated;

  return (
    <div
      className="ticket-card"
      draggable
      onDragStart={(e) => onDragStart(e, ticketId)}
      onClick={() => onClick(ticket)}
    >
      <div className="ticket-header">
        <span className="ticket-id">#{ticketNo}</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {escalated && <span style={{ fontSize: '12px' }}>⚠️</span>}
          <span
            className="priority-badge"
            style={{ backgroundColor: getSeverityColor(severity) }}
          >
            {severity}
          </span>
        </div>
      </div>
      <h4 className="ticket-title">{subject}</h4>
      <p className="ticket-description">{description}</p>
      {categoryName && (
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
          📁 {categoryName}
        </div>
      )}
      <div className="ticket-footer">
        <div className="assigned-to">
          <span className="avatar" title={assignedEmail}>
            {assignedTo.charAt(0).toUpperCase()}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span className="assignee-name">{assignedTo}</span>
            <span style={{ fontSize: '10px', color: '#888' }}>
              Reporter: {reportedBy}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {createdAt && (
            <span style={{ fontSize: '10px', color: '#666' }}>
              {formatDate(createdAt)}
            </span>
          )}
          <button className="delete-btn" onClick={handleDelete} title="Delete ticket">
            🗑️
          </button>
        </div>
      </div>
      {priority > 0 && (
        <div style={{ fontSize: '10px', color: '#999', marginTop: '4px', textAlign: 'right' }}>
          Priority: {priority}/10
        </div>
      )}
    </div>
  );
};

export default TicketCard;