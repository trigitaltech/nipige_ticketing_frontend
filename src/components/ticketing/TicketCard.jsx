import deleteIcon from '../../assets/icons/delete.png';

const severityConfig = {
  Critical: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-600' },
  High: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-600' },
  Medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-600' },
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-600' },
};

const defaultSeverity = { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-500' };

const TicketCard = ({ ticket, onDragStart, onClick, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const dateParts = date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
    const timeParts = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
    return { date: dateParts, time: timeParts };
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kolkata',
    });
  };

  const ticketId = ticket._id || ticket.id;
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(ticketId);
  };

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
  const escalated = ticket.escalated;
  const scope = ticket.scope || ticket.category?.scope || '';
  const attachmentCount = ticket.attachments?.length || 0;
  const category = ticket.category?.name || 'general Task';
  const startFormatted = formatDate(startDate);
  const endFormatted = formatDate(endDate);
  const sev = severityConfig[severity] || defaultSeverity;

  return (
    <div
      className="bg-white border-[1.5px] border-gray-100 rounded-xl p-5 cursor-pointer transition-all duration-150 shadow-xs hover:shadow-sm active:scale-[0.98]"
      draggable
      onDragStart={(e) => onDragStart(e, ticketId)}
      onClick={() => onClick(ticket)}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] text-[#6B778C] font-semibold">#{ticketNo}</span>
        <div className="flex gap-1 items-center">
          {escalated && <span className="text-xs">⚠️</span>}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${sev.bg} ${sev.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sev.dot}`} />
            {severity}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm text-[#172B4D] font-semibold leading-snug mb-1.5">{subject}</h4>

      {/* Description */}
      <p className="text-xs text-[#5E6C84] mb-3 leading-relaxed line-clamp-2">{description}</p>

      {/* NIPIGE Tag */}
      <div className="inline-block px-3.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold tracking-widest text-blue-700 border-[1px] border-blue-100 uppercase mb-3">
        NIPIGE
      </div>

      {/* Scope + Attachments */}
      <div className="flex items-center gap-4 mb-3">
        {category && (
          <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#000000"><g fill="none" stroke="#6B778C" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M19.5 13V9.368c0-3.473 0-5.21-1.025-6.289S15.8 2 12.5 2h-3C6.2 2 4.55 2 3.525 3.08C2.5 4.157 2.5 5.894 2.5 9.367v5.264c0 3.473 0 5.21 1.025 6.289S6.2 22 9.5 22H11m2.5-2s1 0 2 2c0 0 3.177-5 6-6"/><path d="m7 2l.082.493c.2 1.197.3 1.796.72 2.152C8.22 5 8.827 5 10.041 5h1.917c1.213 0 1.82 0 2.24-.355c.42-.356.52-.955.719-2.152L15 2M7 16h4m-4-5h8"/></g></svg>
            {category}
          </span>
        )}
        {attachmentCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-[#6B778C] font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B778C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
            </svg>
            {attachmentCount}
          </span>
        )}
      </div>

      {/* Date Box */}
      {(startDate || endDate) && (
        <div className="bg-[#F8F9FB] rounded-[10px] px-3.5 py-3 mb-3.5 flex flex-col gap-1.5 border border-gray-100">
          {startDate && (
            <div className="flex items-center gap-2.5">
              <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A7BF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div className="flex flex-col gap-px">
                <span className="text-[9px] font-bold tracking-wide text-gray-400 uppercase">START DATE</span>
                <span className="text-[10px] font-bold text-gray-500">{startFormatted.date} · {startFormatted.time}</span>
              </div>
            </div>
          )}
          {endDate && (
            <div className="flex items-center gap-2.5">
              <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div className="flex flex-col gap-px">
                <span className="text-[9px] font-bold tracking-wide text-gray-400 uppercase">END DATE</span>
                <span className="text-[10px] font-bold text-gray-500">{endFormatted.date} · {endFormatted.time}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-start pt-3.5 border-t border-[#EBECF0]">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0"
            title={assignedEmail}
          >
            {assignedTo.charAt(0).toUpperCase()}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#172B4D] font-semibold">{assignedTo}</span>
            <span className="text-[10px] text-gray-500">Reporter: {reportedBy}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-2">
            {createdAt && (
              <span className="text-[11px] text-blue-500 font-medium">{formatShortDate(createdAt)}</span>
            )}
            <button
              className="bg-transparent border-none cursor-pointer p-0 opacity-70 hover:opacity-100 transition-opacity flex items-center"
              onClick={handleDelete}
              title="Delete ticket"
            >
              <img src={deleteIcon} alt="delete" className="w-3.5 h-3.5" />
            </button>
          </div>
          {priority > 0 && (
            <span className="text-[10px] text-gray-400 font-bold">Priority: {priority}/10</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCard;