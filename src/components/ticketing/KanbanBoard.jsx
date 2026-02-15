import TicketCard from './TicketCard';

const statusConfig = {
  OPEN: { title: 'Open', dotColor: 'bg-blue-500' },
  IN_PROGRESS: { title: 'In Progress', dotColor: 'bg-orange-400' },
  RESOLVED: { title: 'Resolved', dotColor: 'bg-purple-500' },
  CLOSED: { title: 'Closed', dotColor: 'bg-green-500' },
};

const KanbanBoard = ({ tickets, onTicketClick, onStatusChange, onDeleteTicket }) => {
  const columns = [
    { id: 'OPEN', apiStatus: 'OPEN' },
    { id: 'IN_PROGRESS', apiStatus: 'IN_PROGRESS' },
    { id: 'RESOLVED', apiStatus: 'RESOLVED' },
    { id: 'CLOSED', apiStatus: 'CLOSED' },
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

    const ticket = tickets.find(t => (t._id || t.id) === ticketId);
    if (ticket && ticket.status === newStatus) {
      return;
    }

    onStatusChange(ticketId, newStatus);
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map(column => {
        const config = statusConfig[column.id];
        const columnTickets = getTicketsByStatus(column.id);
        const totalTickets = columnTickets.length;

        return (
          <div
            key={column.id}
            className="min-w-[320px] flex-1 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-3 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                <h3 className="text-sm font-semibold text-gray-700">{config.title}</h3>
                <span className="ml-1 text-sm font-medium text-gray-400">
                  {totalTickets}
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 overflow-y-auto px-1">
              {columnTickets.map(ticket => (
                <TicketCard
                  key={ticket._id || ticket.id}
                  ticket={ticket}
                  onDragStart={handleDragStart}
                  onClick={onTicketClick}
                  onDelete={onDeleteTicket}
                />
              ))}
              {totalTickets === 0 && (
                <div className="text-center text-gray-400 py-10 text-sm">
                  No tickets
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
