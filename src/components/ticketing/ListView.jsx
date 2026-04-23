import { useState, useMemo } from 'react';
import '../../assets/Styles/ListView.css';
import deleteIcon from '../../assets/icons/delete.png';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import usePersistentState from '../../hooks/usePersistentState';

const statusBadgeColors = {
  OPEN: { bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
  IN_PROGRESS: { bg: '#FFF7ED', color: '#D97706', dot: '#F59E0B' },
  RESOLVED: { bg: '#F5F3FF', color: '#7C3AED', dot: '#8B5CF6' },
  BACKLOG: { bg: '#F5EFEC', color: '#a18072', dot: '#a18072' },
  CLOSED: { bg: '#ECFDF5', color: '#059669', dot: '#10B981' },
};

const groupPalette = [
  { bg: '#EFF6FF', color: '#2563EB' },
  { bg: '#FFF7ED', color: '#D97706' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FEF2F2', color: '#DC2626' },
  { bg: '#FDF2F8', color: '#DB2777' },
  { bg: '#FFFBEB', color: '#CA8A04' },
  { bg: '#F0FDF4', color: '#16A34A' },
];

const avatarPalette = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#14B8A6', '#06B6D4',
  '#0EA5E9', '#3B82F6', '#7C3AED', '#DB2777', '#059669',
];

const getAvatarColor = (key) => {
  const str = String(key || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
};

const formatListDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' });
};

const parseDurationToMs = (value) => {
  if (value == null) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  const str = String(value).trim();
  if (!str) return 0;
  const hoursMatch = str.match(/(\d+)\s*h/i);
  const minutesMatch = str.match(/(\d+)\s*m/i);
  if (!hoursMatch && !minutesMatch) return 0;
  const h = hoursMatch ? Number(hoursMatch[1]) : 0;
  const m = minutesMatch ? Number(minutesMatch[1]) : 0;
  return (h * 60 + m) * 60 * 1000;
};

const formatDurationMs = (ms) => {
  const totalMinutes = Math.floor((Number(ms) || 0) / 60000);
  if (!totalMinutes) return '-';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

const getAssigneeDisplay = (assignee) => {
  if (!assignee) return null;
  const name = assignee.name || assignee.username || assignee.email || '';
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) || '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  const initial = (first + last).toUpperCase() || '?';
  return { name, initial, color: getAvatarColor(assignee._id || assignee.id || name) };
};

const getClosedDate = (ticket) => {
  return (
    ticket?.closedAt ||
    ticket?.dateClosed ||
    ticket?.closedDate ||
    (ticket?.status === 'CLOSED' ? ticket?.updatedAt : null)
  );
};

const getTimeEstimateMs = (ticket) => {
  return (
    Number(ticket?.timeEstimateMs) ||
    parseDurationToMs(ticket?.estimateTime) ||
    parseDurationToMs(ticket?.timeEstimate) ||
    0
  );
};

const getTimeTrackedMs = (ticket) => {
  return (
    Number(ticket?.trackedTimeMs) ||
    Number(ticket?.timeTracked) ||
    parseDurationToMs(ticket?.trackTime) ||
    parseDurationToMs(ticket?.trackedTime) ||
    0
  );
};

const ListView = ({ tickets, onTicketClick, onDeleteTicket, groupBy = 'status', projects = [], categories = [], loading = false }) => {
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, ticketId: null, ticketNo: '' });
  const [collapsedGroups, setCollapsedGroups] = usePersistentState('listView.collapsedGroups', {});
  const showInitialSkeleton = loading && (!tickets || tickets.length === 0);

  const toggleGroup = (groupName) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

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
        if (!groupMap.has(info.id)) groupMap.set(info.id, { id: info.id, name: info.name, tickets: [] });
        groupMap.get(info.id).tickets.push(ticket);
      });
      return Array.from(groupMap.values());
    }
    if (groupBy === 'category') {
      const groupMap = new Map();
      tickets.forEach((ticket) => {
        const info = getTicketCategoryInfo(ticket);
        if (!groupMap.has(info.id)) groupMap.set(info.id, { id: info.id, name: info.name, tickets: [] });
        groupMap.get(info.id).tickets.push(ticket);
      });
      return Array.from(groupMap.values());
    }
    const statusOrder = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'BACKLOG', 'CLOSED'];
    const statusLabels = { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', BACKLOG: 'Backlog', CLOSED: 'Closed' };
    const groupMap = new Map();
    statusOrder.forEach((s) => groupMap.set(s, { id: s, name: statusLabels[s], tickets: [] }));
    tickets.forEach((ticket) => {
      const status = ticket.status || 'OPEN';
      if (!groupMap.has(status)) groupMap.set(status, { id: status, name: status, tickets: [] });
      groupMap.get(status).tickets.push(ticket);
    });
    return Array.from(groupMap.values()).filter((g) => g.tickets.length > 0);
  }, [tickets, groupBy, projectNameById, categoryNameById]);

  const getGroupBadgeStyle = (group, index) => {
    if (groupBy === 'status' && statusBadgeColors[group.id]) {
      const c = statusBadgeColors[group.id];
      return { backgroundColor: c.bg, color: c.color };
    }
    const palette = groupPalette[index % groupPalette.length];
    return { backgroundColor: palette.bg, color: palette.color };
  };

  const getStatusClass = (status) => {
    const map = {
      OPEN: 'status-open',
      IN_PROGRESS: 'status-in-progress',
      RESOLVED: 'status-resolved',
      BACKLOG: 'status-backlog',
      CLOSED: 'status-closed',
    };
    return map[status] || 'status-default';
  };

  const getStatusDotClass = (status) => {
    const map = {
      OPEN: 'open',
      IN_PROGRESS: 'in-progress',
      RESOLVED: 'resolved',
      BACKLOG: 'backlog',
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
      {showInitialSkeleton ? (
        Array.from({ length: 2 }).map((_, si) => (
          <div key={`skeleton-group-${si}`} className="list-group-section">
            <div className="list-group-header">
              <span className="list-group-arrow">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M2 3.5L5 7L8 3.5H2Z" />
                </svg>
              </span>
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-3 w-6" />
            </div>
            <table className="list-table">
              <thead>
                <tr>
                  <th className="col-ticket-id">Ticket</th>
                  <th className="col-title">Subject</th>
                  <th className="col-assigned">Assigned To</th>
                  <th className="col-reported">Reported By</th>
                  <th className="col-category">Category</th>
                  <th className="col-status">Status</th>
                  <th className="col-severity">Severity</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, ri) => (
                  <tr key={`skeleton-row-${si}-${ri}`} className="list-row">
                    <td><div className="ticket-id-cell"><Skeleton className="w-2 h-2 rounded-full" /><Skeleton className="h-3 w-10" /></div></td>
                    <td><Skeleton className="h-3 w-40" /></td>
                    <td><Skeleton className="h-3 w-20" /></td>
                    <td><Skeleton className="h-3 w-20" /></td>
                    <td><Skeleton className="h-3 w-16" /></td>
                    <td><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td><Skeleton className="h-4 w-4 mx-auto rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : tickets.length === 0 ? (
        <div className="empty-list">No tickets</div>
      ) : (
        groups.map((group, groupIndex) => {
          const isCollapsed = collapsedGroups[group.id];
          const badgeStyle = getGroupBadgeStyle(group, groupIndex);

          return (
            <div key={group.id} className="list-group-section">
              {/* Group Header */}
              <div
                className="list-group-header"
                onClick={() => toggleGroup(group.id)}
              >
                <span className={`list-group-arrow ${isCollapsed ? 'collapsed' : ''}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M2 3.5L5 7L8 3.5H2Z" />
                  </svg>
                </span>
                <span className="list-group-badge" style={badgeStyle}>
                  {group.name.toUpperCase()}
                </span>
                <span className="list-group-count">{group.tickets.length}</span>
              </div>

              {/* Group Table */}
              {!isCollapsed && (
                <table className="list-table">
                  <thead>
                    <tr>
                      <th className="col-title">Subject</th>
                      <th className="col-assigned">Assigned</th>
                      <th className="col-status">Status</th>
                      <th className="col-date">Start Date</th>
                      <th className="col-date">Due Date</th>
                      <th className="col-time">Time Estimated</th>
                      <th className="col-time">Time Tracked</th>
                      <th className="col-date">Date Closed</th>
                      <th className="col-priority">Priority</th>
                      <th className="col-severity">Severity</th>
                      <th className="col-action">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.tickets.map((ticket) => {
                      const ticketId = ticket._id || ticket.id;
                      const assignee = getAssigneeDisplay(ticket.assignTo);
                      const priority = Number(ticket.priority) || 0;
                      return (
                        <tr
                          key={ticketId}
                          className="list-row"
                          onClick={() => onTicketClick(ticket)}
                        >
                          <td>
                            <span className="title-text" title={ticket.subject || ''}>
                              {ticket.subject?.split(' ').slice(0, 4).join(' ')}{ticket.subject?.split(' ').length > 6 ? '...' : ''}
                            </span>
                          </td>
                          <td>
                            {assignee ? (
                              <span
                                className="assignee-avatar"
                                style={{ backgroundColor: assignee.color }}
                                title={assignee.name}
                              >
                                {assignee.initial}
                              </span>
                            ) : (
                              <span className="assignee-avatar assignee-avatar-empty" title="Unassigned" />
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                              <span className="badge-dot" />
                              {formatStatusLabel(ticket.status)}
                            </span>
                          </td>
                          <td>
                            <span className="date-text">{formatListDate(ticket.startDate)}</span>
                          </td>
                          <td>
                            <span className="date-text">{formatListDate(ticket.endDate || ticket.dueDate)}</span>
                          </td>
                          <td>
                            <span className="duration-text">{formatDurationMs(getTimeEstimateMs(ticket))}</span>
                          </td>
                          <td>
                            <span className="duration-text">{formatDurationMs(getTimeTrackedMs(ticket))}</span>
                          </td>
                          <td>
                            <span className="date-text">{formatListDate(getClosedDate(ticket))}</span>
                          </td>
                          <td>
                            <span className="priority-text">{priority > 0 ? `${priority}/10` : '-'}</span>
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
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}

      <div className="list-view-footer">
        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} total
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
  );
};

export default ListView;
