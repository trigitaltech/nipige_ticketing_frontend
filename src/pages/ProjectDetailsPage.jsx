import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTickets } from '../redux/ticketSlice';
import { getProjectMembersAPI } from '../services/projectApi';
import TicketCard from '../components/ticketing/TicketCard';
import { getAvatarColor } from '../utils/avatar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const defaultTasks = [
  {
    _id: 'sr-20451',
    ticketNo: 'SR20451',
    subject: 'Implement OAuth2 Authentication',
    description: 'Integrate multi-provider OAuth2 login for the client portal with support for Google and GitHub.',
    severity: 'High',
    priority: 8,
    assignTo: { name: 'Ajay Sharma' },
    reportedBy: { name: 'Sarah Chen' },
    category: { name: 'Backend Task' },
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-02-20T00:00:00.000Z',
    createdAt: '2026-02-20T00:00:00.000Z',
    attachments: [{}, {}],
    status: 'IN_PROGRESS',
  },
  {
    _id: 'sr-20455',
    ticketNo: 'SR20455',
    subject: 'Mobile App Push Notifications',
    description: 'Implement FCM for Android and APNs for iOS notifications on order status changes.',
    severity: 'High',
    priority: 7,
    assignTo: { name: 'Sarah Chen' },
    reportedBy: { name: 'Anuradha Gupta' },
    category: { name: 'Mobile Task' },
    startDate: '2026-02-08T00:00:00.000Z',
    endDate: '2026-02-25T00:00:00.000Z',
    createdAt: '2026-02-25T00:00:00.000Z',
    attachments: [],
    status: 'IN_PROGRESS',
  },
];


const statusStyles = {
  ACTIVE: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  COMPLETED: 'bg-blue-50 text-blue-600 border border-blue-200',
  'ON HOLD': 'bg-amber-50 text-amber-700 border border-amber-200',
  DRAFT: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const noop = () => {};

const getInitials = (name = 'NA') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'NA';

const formatShortDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const calcDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 0;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.max(Math.ceil(diffMs / (24 * 60 * 60 * 1000)), 0);
};

const normalizeTaskForCard = (task, index = 0) => {
  const rawId = task._id || task.id || task.ticketNo || `task-${index + 1}`;
  const priorityFromScore = typeof task.priorityScore === 'string' ? parseInt(task.priorityScore, 10) : undefined;
  const priority = Number(task.priority ?? priorityFromScore ?? 0);
  const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : Number(task.attachmentCount || 0);

  return {
    _id: String(rawId),
    id: String(rawId),
    ticketNo: String(task.ticketNo || task.id || task._id || `SR${String(index + 1).padStart(5, '0')}`),
    subject: task.subject || task.title || task.name || 'Untitled Task',
    description: task.description || 'No description added yet.',
    severity: task.severity || task.priorityLabel || task.category?.severity || 'Medium',
    priority: Number.isNaN(priority) ? 0 : priority,
    assignTo: task.assignTo || (task.owner ? { name: task.owner } : undefined),
    reportedBy: task.reportedBy || (task.reporter ? { name: task.reporter } : undefined),
    category: task.category || { name: task.type || 'General Task' },
    startDate: task.startDate || '',
    endDate: task.endDate || '',
    createdAt: task.createdAt || task.endDate || task.startDate || new Date().toISOString(),
    attachments: Array.isArray(task.attachments) ? task.attachments : Array(Math.max(attachmentCount, 0)).fill({}),
    escalated: Boolean(task.escalated),
    status: task.status || 'IN_PROGRESS',
  };
};


const ProjectDetailsPage = ({ project, onBack }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tickets } = useSelector((state) => state.tickets);

  const projectId = project?._id || project?.id;
  const projectName = project?.name || project?.projectName || 'Untitled Project';
  const clientName = project?.client?.name || project?.client || 'N/A';
  const leadName = project?.lead?.name || project?.lead || project?.projectLead?.name || 'N/A';
  const status = (project?.status || 'ACTIVE').toUpperCase();

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  // Filter tickets belonging to this project
  const projectTickets = useMemo(() => {
    if (!projectId || !Array.isArray(tickets)) return [];
    return tickets.filter((t) => {
      const raw = t.project;
      const tid = typeof raw === 'string' ? raw : (raw?.id || raw?._id || raw?.projectId || '');
      return String(tid) === String(projectId);
    });
  }, [tickets, projectId]);

  const taskCount = projectTickets.length;
  const activeTasks = projectTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const completedTasks = projectTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
  const daysRemaining = calcDaysRemaining(project?.endDate);

  const taskCards = useMemo(() => {
    if (projectTickets.length > 0) {
      return projectTickets.map((task, index) => normalizeTaskForCard(task, index));
    }
    return defaultTasks;
  }, [projectTickets]);

  const [teamMembers, setTeamMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef(null);
  const PAGE_SIZE = 20;

  const totalPages = Math.max(1, Math.ceil(taskCards.length / PAGE_SIZE));
  const pagedTaskCards = taskCards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [projectId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    if (!projectId) return;
    getProjectMembersAPI(projectId)
      .then((res) => {
        const raw = res?.data?.members || [];
        setTeamMembers(
          raw.slice(0, 6).map((m, i) => ({
            id: m.id || `member-${i}`,
            name: m.name || 'Unknown',
            role: m.role || '',
          }))
        );
      })
      .catch(() => {});
  }, [projectId]);

  return (
    <div ref={scrollRef} className="h-full overflow-auto bg-slate-50">
      <div className="px-8 py-7 max-[768px]:px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="Back to project list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{projectName}</h1>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                {status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Client: {clientName} • Lead: {leadName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5 mt-8 max-[1200px]:grid-cols-2 max-[768px]:grid-cols-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19h16M7 16V8m5 8V5m5 11v-4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Tasks</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{taskCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 7v5l3 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Tasks</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{activeTasks}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{completedTasks}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="2.5" strokeWidth="1.8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 3v4m8-4v4M3 10h18" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Days Remaining</p>
              <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{daysRemaining}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-6 mt-8 max-[1200px]:grid-cols-1">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Project Timeline & Tasks</h2>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white cursor-pointer">
                  All Tasks
                </button>
                <button className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 cursor-pointer">
                  Files
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
              {pagedTaskCards.map((task) => (
                <TicketCard
                  key={task._id || task.id}
                  ticket={task}
                  onDragStart={noop}
                  onClick={noop}
                  onDelete={noop}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                      .reduce((acc, page, idx, arr) => {
                        if (idx > 0 && page - arr[idx - 1] > 1) acc.push('ellipsis');
                        acc.push(page);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={item}>
                            <PaginationLink
                              isActive={item === currentPage}
                              onClick={() => setCurrentPage(item)}
                              className="cursor-pointer"
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Team Members</h2>
              <div className="space-y-1">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ backgroundColor: getAvatarColor(member.name) }}>
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{member.name}</p>
                      {member.role && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{member.role}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate(`/projects/${projectId}/team`)}
                className="w-full mt-6 py-3 rounded-xl border border-dashed border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Manage Team
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-2xl font-bold text-slate-900">Project Progress</h2>
              <p className="text-sm text-slate-500 mt-2">
                Timeline: {formatShortDate(project?.startDate)} to {formatShortDate(project?.endDate)}
              </p>
              <div className="w-full h-2 rounded-full bg-slate-100 mt-5">
                <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
              </div>
              <p className="text-sm font-semibold text-slate-600 mt-3">
                {Math.min(Math.max(progress, 0), 100)}% completed
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
