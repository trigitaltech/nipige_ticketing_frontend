import { useState, useMemo } from 'react';
import deleteIcon from '../../assets/icons/delete.png';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import usePersistentState from '../../hooks/usePersistentState';
import { getAssigneeDisplay } from '../../utils/avatar';

const statusBadgeColors = {
  OPEN: { bg: '#EEF5FF', color: '#0880EA' },
  IN_PROGRESS: { bg: '#FFF4EE', color: '#f59e0b' },
  RESOLVED: { bg: '#EDFAF4', color: '#299764' },
  BACKLOG: { bg: '#F5EFEC', color: '#a18072' },
  CLOSED: { bg: '#F3F4F6', color: '#656F7D' },
};

const severityBadgeColors = {
  Critical: { bg: '#FEF2F2', color: '#DC2626' },
  High: { bg: '#FFF7ED', color: '#EA580C' },
  Medium: { bg: '#FFFBEB', color: '#CA8A04' },
  Low: { bg: '#ECFDF5', color: '#059669' },
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

const thClass = 'text-left px-3 py-2 text-[11px] font-bold text-[#1F2937] uppercase tracking-[0.4px] bg-[#EEF2FF] border-b-2 border-[#C7D2FE]';
const tdClass = 'px-3 py-[10px] text-[13px] text-[#2D2D2D] align-middle';

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

  const getStatusBadgeStyle = (status) => {
    return statusBadgeColors[status] || { bg: '#F3F4F6', color: '#6B7280' };
  };

  const getSeverityBadgeStyle = (severity) => {
    return severityBadgeColors[severity] || { bg: '#F3F4F6', color: '#6B7280' };
  };

  const formatStatusLabel = (status) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\B\w+/g, c => c.toLowerCase());
  };

  return (
    <div className="flex flex-col rounded-lg overflow-hidden">
      {showInitialSkeleton ? (
        Array.from({ length: 2 }).map((_, si) => (
          <div key={`skeleton-group-${si}`} className="mb-4 border border-[#E8E8E8] rounded-lg overflow-hidden bg-white last:mb-0">
            <div className="flex items-center gap-[10px] px-4 py-[10px] bg-[#FAFAFA] cursor-pointer select-none border-b border-[#EFEFEF]">
              <span className="flex items-center justify-center text-[#9CA3AF]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M2 3.5L5 7L8 3.5H2Z" />
                </svg>
              </span>
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-3 w-6" />
            </div>
            {/* Mobile skeleton cards */}
            <div className="sm:hidden divide-y divide-[#F2F2F2]">
              {Array.from({ length: 3 }).map((_, ri) => (
                <div key={`m-sk-${si}-${ri}`} className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop skeleton table */}
            <table className="hidden sm:table w-full border-collapse bg-white">
              <thead className="border-b border-[#D8DEEA]">
                <tr className="h-10">
                  <th className={thClass}>Ticket</th>
                  <th className={thClass}>Subject</th>
                  <th className={thClass}>Assigned To</th>
                  <th className={thClass}>Reported By</th>
                  <th className={thClass}>Category</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Severity</th>
                  <th className={thClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, ri) => (
                  <tr key={`skeleton-row-${si}-${ri}`} className="border-b border-[#F2F2F2] last:border-b-0">
                    <td className={tdClass}><div className="flex items-center gap-2"><Skeleton className="w-2 h-2 rounded-full" /><Skeleton className="h-3 w-10" /></div></td>
                    <td className={tdClass}><Skeleton className="h-3 w-40" /></td>
                    <td className={tdClass}><Skeleton className="h-3 w-20" /></td>
                    <td className={tdClass}><Skeleton className="h-3 w-20" /></td>
                    <td className={tdClass}><Skeleton className="h-3 w-16" /></td>
                    <td className={tdClass}><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className={tdClass}><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className={tdClass}><Skeleton className="h-4 w-4 mx-auto rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : tickets.length === 0 ? (
        <div className="py-12 px-5 text-center text-[#9CA3AF] text-[14px]">No tickets</div>
      ) : (
        groups.map((group, groupIndex) => {
          const isCollapsed = collapsedGroups[group.id];
          const badgeStyle = getGroupBadgeStyle(group, groupIndex);

          return (
            <div key={group.id} className="mb-4 border border-[#E8E8E8] rounded-lg overflow-hidden bg-white last:mb-0">
              {/* Group Header */}
              <div
                className="flex items-center gap-[10px] px-4 py-[10px] bg-[#FAFAFA] cursor-pointer select-none border-b border-[#EFEFEF] hover:bg-[#F3F4F6]"
                onClick={() => toggleGroup(group.id)}
              >
                <span className={`flex items-center justify-center text-[#9CA3AF] transition-transform duration-200${isCollapsed ? ' -rotate-90' : ''}`}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M2 3.5L5 7L8 3.5H2Z" />
                  </svg>
                </span>
                <span
                  className="inline-flex items-center px-[10px] py-[3px] rounded text-[11px] font-bold tracking-[0.5px] whitespace-nowrap"
                  style={badgeStyle}
                >
                  {group.name.toUpperCase()}
                </span>
                <span className="text-[13px] font-semibold text-[#6B7280]">{group.tickets.length}</span>
              </div>

              {!isCollapsed && (
                <>
                  {/* Mobile card layout */}
                  <div className="sm:hidden divide-y divide-[#F2F2F2]">
                    {group.tickets.map((ticket) => {
                      const ticketId = ticket._id || ticket.id;
                      const assignee = getAssigneeDisplay(ticket.assignTo);
                      const priority = Number(ticket.priority) || 0;
                      const statusStyle = getStatusBadgeStyle(ticket.status);
                      const severityStyle = getSeverityBadgeStyle(ticket.severity);
                      const dueDate = ticket.endDate || ticket.dueDate;
                      return (
                        <div
                          key={ticketId}
                          className="p-3 cursor-pointer hover:bg-[#FAFBFC] transition-colors"
                          onClick={() => onTicketClick(ticket)}
                        >
                          {/* Subject + delete */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[13px] font-semibold text-[#1A1A1A] line-clamp-2 leading-snug flex-1 min-w-0">
                              {ticket.subject || 'No Subject'}
                            </span>
                            <button
                              className="shrink-0 p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
                              title="Delete ticket"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({ open: true, ticketId, ticketNo: ticket.ticketNo || 'N/A' });
                              }}
                            >
                              <img src={deleteIcon} alt="delete" className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Badges row */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusStyle.color }} />
                              {formatStatusLabel(ticket.status)}
                            </span>
                            {ticket.severity && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                style={{ backgroundColor: severityStyle.bg, color: severityStyle.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: severityStyle.color }} />
                                {ticket.severity}
                              </span>
                            )}
                            {priority > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                P{priority}/10
                              </span>
                            )}
                          </div>

                          {/* Assignee + due date */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {assignee ? (
                                <span
                                  className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-semibold uppercase shrink-0"
                                  style={{ backgroundColor: assignee.color }}
                                  title={assignee.name}
                                >
                                  {assignee.initial}
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-[#F3F4F6] border border-dashed border-[#D1D5DB] shrink-0" />
                              )}
                              <span className="text-[11px] text-slate-500 truncate">
                                {assignee?.name || 'Unassigned'}
                              </span>
                            </div>
                            {dueDate && (
                              <span className="text-[11px] text-slate-400 shrink-0">
                                Due: {formatListDate(dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <table className="hidden sm:table w-full border-collapse bg-white">
                    <thead className="border-b border-[#D8DEEA]">
                      <tr className="h-10">
                        <th className={`${thClass} w-[220px]`}>Subject</th>
                        <th className={`${thClass} w-20 text-center`}>Assigned</th>
                        <th className={`${thClass} w-[130px]`}>Status</th>
                        <th className={`${thClass} w-[110px]`}>Start Date</th>
                        <th className={`${thClass} w-[110px]`}>Due Date</th>
                        <th className={`${thClass} w-[110px]`}>Time Estimated</th>
                        <th className={`${thClass} w-[110px]`}>Time Tracked</th>
                        <th className={`${thClass} w-[110px]`}>Date Closed</th>
                        <th className={`${thClass} w-20 text-center`}>Priority</th>
                        <th className={`${thClass} w-[110px]`}>Severity</th>
                        <th className={`${thClass} w-[60px] text-center`}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.tickets.map((ticket) => {
                        const ticketId = ticket._id || ticket.id;
                        const assignee = getAssigneeDisplay(ticket.assignTo);
                        const priority = Number(ticket.priority) || 0;
                        const statusStyle = getStatusBadgeStyle(ticket.status);
                        const severityStyle = getSeverityBadgeStyle(ticket.severity);
                        return (
                          <tr
                            key={ticketId}
                            className="border-b border-[#F2F2F2] last:border-b-0 cursor-pointer hover:bg-[#FAFBFC] transition-colors duration-150"
                            onClick={() => onTicketClick(ticket)}
                          >
                            <td className={tdClass}>
                              <span className="text-[#1A1A1A] text-[13px] font-semibold block whitespace-nowrap overflow-hidden text-ellipsis" title={ticket.subject || ''}>
                                {ticket.subject?.split(' ').slice(0, 4).join(' ')}{ticket.subject?.split(' ').length > 6 ? '...' : ''}
                              </span>
                            </td>
                            <td className={tdClass}>
                              {assignee ? (
                                <span
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-[12px] font-semibold tracking-[0.2px] uppercase shadow-[0_0_0_2px_#FFFFFF]"
                                  style={{ backgroundColor: assignee.color }}
                                  title={assignee.name}
                                >
                                  {assignee.initial}
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F3F4F6] border border-dashed border-[#D1D5DB]" title="Unassigned" />
                              )}
                            </td>
                            <td className={tdClass}>
                              <span
                                className="inline-flex items-center gap-[6px] px-3 py-1 rounded-full text-[12px] font-semibold tracking-[0.2px]"
                                style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusStyle.color }} />
                                {formatStatusLabel(ticket.status)}
                              </span>
                            </td>
                            <td className={tdClass}>
                              <span className="text-[#3D3D3D] text-[13px]">{formatListDate(ticket.startDate)}</span>
                            </td>
                            <td className={tdClass}>
                              <span className="text-[#3D3D3D] text-[13px]">{formatListDate(ticket.endDate || ticket.dueDate)}</span>
                            </td>
                            <td className={tdClass}>
                              <span className="text-[#3D3D3D] text-[13px] tabular-nums">{formatDurationMs(getTimeEstimateMs(ticket))}</span>
                            </td>
                            <td className={tdClass}>
                              <span className="text-[#3D3D3D] text-[13px] tabular-nums">{formatDurationMs(getTimeTrackedMs(ticket))}</span>
                            </td>
                            <td className={tdClass}>
                              <span className="text-[#3D3D3D] text-[13px]">{formatListDate(getClosedDate(ticket))}</span>
                            </td>
                            <td className={tdClass}>
                              <span className="text-[#6B6B6B] text-[12px] font-semibold text-center block">{priority > 0 ? `${priority}/10` : '-'}</span>
                            </td>
                            <td className={tdClass}>
                              <span
                                className="inline-flex items-center gap-[6px] px-3 py-1 rounded-full text-[12px] font-semibold tracking-[0.2px]"
                                style={{ backgroundColor: severityStyle.bg, color: severityStyle.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: severityStyle.color }} />
                                {ticket.severity || 'N/A'}
                              </span>
                            </td>
                            <td className={tdClass}>
                              <button
                                className="bg-transparent border-none cursor-pointer p-1 rounded flex items-center justify-center mx-auto opacity-50 hover:opacity-100 transition-opacity duration-150"
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
                </>
              )}
            </div>
          );
        })
      )}

      <div className="py-2 px-4 text-center text-[12px] text-[#9CA3AF] mt-2">
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
