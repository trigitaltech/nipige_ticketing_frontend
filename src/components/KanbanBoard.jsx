import '../assets/Styles/Kanban.css';
import TicketCard from './TicketCard';

const KanbanBoard = ({ tickets, onTicketClick, onStatusChange, onDeleteTicket }) => {
  const columns = [
    { id: 'OPEN', title: 'Open', color: '#e3f2fd', apiStatus: 'OPEN' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#fff3e0', apiStatus: 'IN_PROGRESS' },
    { id: 'RESOLVED', title: 'Resolved', color: '#f3e5f5', apiStatus: 'RESOLVED' },
    { id: 'CLOSED', title: 'Closed', color: '#e8f5e9', apiStatus: 'CLOSED' },
  ];

  const getTicketsByStatus = (status) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('ticketId', String(ticketId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');

    // Don't update if dropped in the same column
    const ticket = tickets.find(t => (t._id || t.id) === ticketId);
    if (ticket && ticket.status === newStatus) {
      return;
    }

    onStatusChange(ticketId, newStatus);
  };

  return (
    <div className="kanban-board">
      {columns.map(column => (
        <div
          key={column.id}
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="column-header" style={{ backgroundColor: column.color }}>
            <h3>{column.title}</h3>
            <span className="ticket-count">{getTicketsByStatus(column.id).length}</span>
          </div>
          <div className="column-content">
            {getTicketsByStatus(column.id).map(ticket => (
              <TicketCard
                key={ticket._id || ticket.id}
                ticket={ticket}
                onDragStart={handleDragStart}
                onClick={onTicketClick}
                onDelete={onDeleteTicket}
              />
            ))}
            {getTicketsByStatus(column.id).length === 0 && (
              <div className="empty-column">No tickets</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;