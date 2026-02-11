import '../../assets/Styles/TicketCard.css';
import categoryIcon from '../../assets/icons/category.png';
import startIcon from '../../assets/icons/start.png';
import endIcon from '../../assets/icons/end.png';
import deleteIcon from '../../assets/icons/delete.png';

const TicketCard = ({ ticket, onDragStart, onClick, onDelete }) => {
  const getSeverityClass = (severity) => {
    const map = {
      Critical: 'tc-severity-critical',
      High: 'tc-severity-high',
      Medium: 'tc-severity-medium',
      Low: 'tc-severity-low',
    };
    return map[severity] || 'tc-severity-default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Convert to IST and format
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
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
  const startDate = ticket.startDate;
  const endDate = ticket.endDate;
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
          <span className={`tc-severity-badge ${getSeverityClass(severity)}`}>
            <span className="tc-badge-dot" />
            {severity}
          </span>
        </div>
      </div>
      <h4 className="ticket-title">{subject}</h4>
      <p className="ticket-description">{description}</p>
      {categoryName && (
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <img src={categoryIcon} alt="category" style={{ width: '14px', height: '14px' }} />
          {categoryName}
        </div>
      )}
      {(startDate || endDate) && (
        <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px', display: 'flex', gap: '12px' }}>
          {startDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <img src={startIcon} alt="start" style={{ width: '12px', height: '12px' }} />
              Start: {formatDate(startDate)}
            </span>
          )}
          {endDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <img src={endIcon} alt="end" style={{ width: '12px', height: '12px' }} />
              End: {formatDate(endDate)}
            </span>
          )}
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
            <img src={deleteIcon} alt="delete" style={{ width: '16px', height: '16px' }} />
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