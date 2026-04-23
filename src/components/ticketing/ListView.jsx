import { useState, useMemo } from 'react';
import '../../assets/Styles/ListView.css';
import deleteIcon from '../../assets/icons/delete.png';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ListView = ({ tickets, onTicketClick, onDeleteTicket, groupBy = 'status', projects = [], categories = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, ticketId: null, ticketNo: '' });
  const ticketsPerPage = 25;

  const projectNameById = useMemo(() => {
    const map = new Map();
    (Array.isArray(projects) ? projects : []).forEach((project) => {
      const projectId = String(project?._id || project?.id || '').trim();
      if (projectId) map.set(projectId, project?.name || project?.projectName || 'Untitled Project');
    });
    return map;
  }, [projects]);

  const categoryNameById = useMemo(() => {
    const map = new Map();
    (Array.isArray(categories) ? categories : []).forEach((category) => {
      const categoryId = String(category?._id || category?.id || '').trim();
      if (categoryId) map.set(categoryId, category?.name || category?.title || 'Untitled Category');
    });
    return map;
  }, [categories]);

  const getTicketProjectInfo = (ticket) => {
    const rawProject = ticket?.project;
    let projectId = '';
    let projectName = '';

    if (typeof rawProject === 'string') {
      projectId = rawProject;
    } else if (rawProject && typeof rawProject === 'object') {
      projectId = rawProject.id || rawProject._id || rawProject.projectId || '';
      projectName = rawProject.name || rawProject.projectName || rawProject.title || '';
    }

    if (!projectId && ticket?.projectId) projectId = ticket.projectId;
    if (!projectName && ticket?.projectName) projectName = ticket.projectName;
    if (!projectName && projectId) projectName = projectNameById.get(String(projectId)) || '';

    if (!projectId) return { id: 'UNASSIGNED', name: 'No Project' };
    return { id: String(projectId), name: projectName || `Project ${String(projectId).slice(-6).toUpperCase()}` };
  };

  const getTicketCategoryInfo = (ticket) => {
    const rawCategory = ticket?.category;
    let categoryId = '';
    let categoryName = '';

    if (typeof rawCategory === 'string') {
      const raw = rawCategory.trim();
      if (categoryNameById.has(raw)) {
        categoryId = raw;
        categoryName = categoryNameById.get(raw) || '';
      } else {
        categoryId = `NAME:${raw}`;
        categoryName = raw;
      }
    } else if (rawCategory && typeof rawCategory === 'object') {
      categoryId = rawCategory._id || rawCategory.id || rawCategory.categoryId || '';
      categoryName = rawCategory.name || rawCategory.title || '';
    }

    if (!categoryId && ticket?.categoryId) categoryId = String(ticket.categoryId);
    if (!categoryName && ticket?.categoryName) categoryName = ticket.categoryName;
    if (!categoryName && categoryId && !String(categoryId).startsWith('NAME:')) {
      categoryName = categoryNameById.get(String(categoryId)) || '';
    }

    if (!categoryId) return { id: 'UNCATEGORIZED', name: 'No Category' };
    return { id: String(categoryId), name: categoryName || 'No Category' };
  };

  const groups = useMemo(() => {
    if (groupBy === 'project') {
      const groupMap = new Map();
      tickets.forEach((ticket) => {
        const info = getTicketProjectInfo(ticket);
        if (!groupMap.has(info.id)) groupMap.set(info.id, { name: info.name, tickets: [] });
        groupMap.get(info.id).tickets.push(ticket);
      });
      return Array.from(groupMap.values());
    }
    if (groupBy === 'category') {
      const groupMap = new Map();
      tickets.forEach((ticket) => {
        const info = getTicketCategoryInfo(ticket);
        if (!groupMap.has(info.id)) groupMap.set(info.id, { name: info.name, tickets: [] });
        groupMap.get(info.id).tickets.push(ticket);
      });
      return Array.from(groupMap.values());
    }
    // Default: group by status
    const statusOrder = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const statusLabels = { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed' };
    const groupMap = new Map();
    statusOrder.forEach((s) => groupMap.set(s, { name: statusLabels[s], tickets: [] }));
    tickets.forEach((ticket) => {
      const status = ticket.status || 'OPEN';
      if (!groupMap.has(status)) groupMap.set(status, { name: status, tickets: [] });
      groupMap.get(status).tickets.push(ticket);
    });
    return Array.from(groupMap.values()).filter((g) => g.tickets.length > 0);
  }, [tickets, groupBy, projectNameById, categoryNameById]);

  // Flatten grouped tickets for pagination
  const allTickets = useMemo(() => groups.flatMap((g) => g.tickets), [groups]);
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = allTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(allTickets.length / ticketsPerPage);

  // Build paginated groups: assign currentTickets back into their groups
  const paginatedGroups = useMemo(() => {
    const result = [];
    let offset = 0;
    for (const group of groups) {
      const groupEnd = offset + group.tickets.length;
      if (groupEnd > indexOfFirstTicket && offset < indexOfLastTicket) {
        const startIdx = Math.max(0, indexOfFirstTicket - offset);
        const endIdx = Math.min(group.tickets.length, indexOfLastTicket - offset);
        result.push({ name: group.name, tickets: group.tickets.slice(startIdx, endIdx) });
      }
      offset = groupEnd;
    }
    return result;
  }, [groups, indexOfFirstTicket, indexOfLastTicket]);

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

  const renderTicketRow = (ticket) => {
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
          {ticket.subject ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="title-text">
                  {ticket.subject.split(' ').slice(0, 4).join(' ')}{ticket.subject.split(' ').length > 6 ? '...' : ''}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                {ticket.subject}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="title-text">-</span>
          )}
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
          <button
            className="list-delete-btn"
            title="Delete ticket"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm({ open: true, ticketId, ticketNo: ticket.ticketNo || 'N/A' });
            }}
          >
            <img src={deleteIcon} alt="delete" style={{ width: '16px', height: '16px' }} />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
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
            <th className="col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {currentTickets.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-list">No tickets</td>
            </tr>
          ) : (
            paginatedGroups.map((group) => (
              <>
                <tr key={`group-${group.name}`} className="list-group-header">
                  <td colSpan="8">
                    <span className="group-label">{group.name}</span>
                    <span className="group-count">{group.tickets.length}</span>
                  </td>
                </tr>
                {group.tickets.map(renderTicketRow)}
              </>
            ))
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
        Showing {indexOfFirstTicket + 1}-{Math.min(indexOfLastTicket, allTickets.length)} of {allTickets.length} tickets
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.open}
        title="Delete Ticket"
        message={(
          <>
            Are you sure you want to delete ticket <strong>#{deleteConfirm.ticketNo}</strong>? This action cannot be undone.
          </>
        )}
        onCancel={() => setDeleteConfirm({ open: false, ticketId: null, ticketNo: '' })}
        onConfirm={() => {
          onDeleteTicket(deleteConfirm.ticketId);
          setDeleteConfirm({ open: false, ticketId: null, ticketNo: '' });
        }}
      />
    </div>
    </TooltipProvider>
  );
};

export default ListView;
