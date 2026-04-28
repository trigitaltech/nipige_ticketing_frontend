import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import TaskCard from '../dashboard/TaskCard';
import ProjectCard from '../dashboard/ProjectCard';
import WorkloadCard from '../dashboard/WorkloadCard';
import { getAnalyticReportAPI } from '../../services/api';
import MultiSelectDropdown from '../shared/MultiSelectDropdown';

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        color: '#3b82f6' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b' },
  RESOLVED:    { label: 'Resolved',    color: '#10b981' },
  BACKLOG:     { label: 'Backlog',     color: '#ef4444' },
  CLOSED:      { label: 'Closed',      color: '#64748b' },
};

const SEVERITY_PRIORITY = [
  { label: 'Critical', color: '#9f1239', keys: ['Critical'] },
  { label: 'High',     color: '#e11d48', keys: ['High'] },
  { label: 'Medium',   color: '#f59e0b', keys: ['Medium'] },
  { label: 'Low',      color: '#10b981', keys: ['Low'] },
];

const BRAND = '#3B2FB1';
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const PROJECT_COLORS = [
  '#6366F1', '#8B5CF6', '#0EA5E9', '#14B8A6',
  '#F97316', '#F43F5E', '#64748B', '#DB2777', '#059669',
];

function projectColor(name, idx) {
  if (!name) return PROJECT_COLORS[idx % PROJECT_COLORS.length];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PROJECT_COLORS.length;
  return PROJECT_COLORS[h];
}


function Icon({ name, size = 16 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    grid:   <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    check:  <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>,
    clock:  <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    alert:  <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
    trend:  <svg {...p}><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>,
    folder: <svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>,
    flag:   <svg {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><path d="M4 22V15"/></svg>,
  };
  return icons[name] || null;
}

function StatTile({ label, value, sub, icon, tint = BRAND }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
        <div className="w-7 h-7 rounded-md grid place-items-center" style={{ background: tint + '18', color: tint }}>
          <Icon name={icon} size={14} />
        </div>
      </div>
      <div className="text-[28px] font-bold text-slate-800 leading-none tabular-nums">{value}</div>
      <div className="text-[11.5px] text-slate-500">{sub}</div>
    </div>
  );
}

function DonutChart({ segments, size = 170, thickness = 22, centerLabel, centerValue }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = `${frac * c} ${c - frac * c}`;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={dash} strokeDashoffset={-offset}
              strokeLinecap="butt" />
          );
          offset += frac * c;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 leading-tight">{centerLabel}</div>
        <div className="text-[24px] font-bold text-slate-800 leading-none mt-0.5">{centerValue}</div>
      </div>
    </div>
  );
}

function BarList({ rows }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-baseline justify-between text-[12px] mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: r.color }} />
              <span className="font-medium text-slate-700">{r.label}</span>
            </div>
            <span className="text-slate-600 font-semibold tabular-nums">{r.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ points, height = 170, color = BRAND }) {
  if (!points || points.length < 2) {
    return <div className="flex items-center justify-center text-slate-400 text-[12px]" style={{ height }}>No trend data yet</div>;
  }
  const width = 560;
  const pad = { t: 12, r: 12, b: 24, l: 28 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const max = Math.max(1, ...points.map(p => p.value));
  const xs = (i) => pad.l + (i / (points.length - 1)) * w;
  const ys = (v) => pad.t + h - (v / max) * h;
  const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(p.value).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${xs(points.length - 1).toFixed(1)},${(pad.t + h).toFixed(1)} L${xs(0).toFixed(1)},${(pad.t + h).toFixed(1)} Z`;
  const step = Math.ceil(points.length / 7);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="dov-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={pad.l} x2={pad.l + w} y1={pad.t + h * f} y2={pad.t + h * f} stroke="#eef2f7" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#dov-area)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={xs(i)} cy={ys(p.value)} r="3" fill="#fff" stroke={color} strokeWidth="2" />
      ))}
      {points.map((p, i) => (
        (i % step === 0 || i === points.length - 1) && (
          <text key={`lx${i}`} x={xs(i)} y={height - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.label}</text>
        )
      ))}
      <text x={pad.l - 5} y={pad.t + 5} textAnchor="end" fontSize="10" fill="#94a3b8">{max}</text>
      <text x={pad.l - 5} y={pad.t + h + 2} textAnchor="end" fontSize="10" fill="#94a3b8">0</text>
    </svg>
  );
}

// ---------- Segmented control ----------
function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex bg-slate-100 rounded-lg p-0.5 shrink-0">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${value === o.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- FilterBar ----------
function FilterBar({ filters, setFilters, projectOptions, memberOptions }) {
  const { statuses, severities, dateRange, projectIds, memberIds } = filters;
  const statusOptions = Object.entries(STATUS_CONFIG).map(([id, cfg]) => ({ id, label: cfg.label, dot: cfg.color }));
  const severityOptions = SEVERITY_PRIORITY.map(p => ({ id: p.label, label: p.label, dot: p.color }));
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2">
      <MultiSelectDropdown label="Project"  icon="folder" options={projectOptions} selected={projectIds} onChange={v => setFilters(f => ({ ...f, projectIds: v }))}  width={190} searchable />
      <MultiSelectDropdown label="Member"   icon="users"  options={memberOptions}  selected={memberIds}  onChange={v => setFilters(f => ({ ...f, memberIds: v }))}   width={190} searchable />
      <MultiSelectDropdown label="Status"   icon="filter" options={statusOptions}   selected={statuses}   onChange={v => setFilters(f => ({ ...f, statuses: v }))}    width={170} />
      <MultiSelectDropdown label="Severity" icon="flag"   options={severityOptions} selected={severities} onChange={v => setFilters(f => ({ ...f, severities: v }))}  width={170} />
      <div className="ml-auto">
        <Segmented
          value={dateRange}
          onChange={v => setFilters(f => ({ ...f, dateRange: v }))}
          options={[{ label: '7D', value: '7d' }, { label: '30D', value: '30d' }, { label: '90D', value: '90d' }, { label: 'All', value: 'all' }]}
        />
      </div>
    </div>
  );
}

const OverviewSkeleton = () => (
  <div className="px-5 pt-4 pb-2 space-y-4">
    <div className="grid grid-cols-5 gap-4">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-12 gap-4">
      {(['col-span-3', 'col-span-3', 'col-span-6']).map((cls, i) => (
        <div key={i} className={`${cls} bg-white border border-slate-200 rounded-xl p-5`}>
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-7 bg-white border border-slate-200 rounded-xl">
        <Skeleton className="h-12 w-full rounded-t-xl" />
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-14 w-full mx-4 my-2" />)}
      </div>
      <div className="col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    </div>
  </div>
);

const DEFAULT_FILTERS = { statuses: [], severities: [], dateRange: '30d', projectIds: [], memberIds: [] };

const DashboardOverview = ({ tickets = [], loading = false }) => {
  const { projects } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);
  const today = useMemo(() => new Date(), []);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [apiStats, setApiStats] = useState(null);
  const [apiStatusBreakdown, setApiStatusBreakdown] = useState(null);
  const [apiPriority, setApiPriority] = useState(null);
  const [apiCompletionTrend, setApiCompletionTrend] = useState(null);
  const [apiProjectReport, setApiProjectReport] = useState(null);
  const [apiMemberReport, setApiMemberReport] = useState(null);

  // Build dropdown options from ticket data
  const { projectOptions, memberOptions } = useMemo(() => {
    const projMap = {};
    const memMap = {};
    tickets.forEach(t => {
      const proj = t.project;
      const pid = typeof proj === 'string' ? proj : proj?._id || proj?.id;
      const pname = typeof proj === 'object' ? (proj?.name || '') : '';
      if (pid && pid !== 'unassigned') projMap[pid] = pname || projMap[pid] || pid;

      const a = t.assignTo;
      if (a) {
        const mid = a._id || a.id || a.email || '';
        const mname = a.name || a.username || a.email || 'Unknown';
        if (mid) memMap[mid] = mname;
      }
    });
    // Enrich project names from Redux
    if (Array.isArray(projects)) {
      projects.forEach(p => {
        const id = p._id || p.id;
        if (id) projMap[id] = p.name || projMap[id] || id;
      });
    }
    return {
      projectOptions: Object.entries(projMap).map(([id, name], i) => ({
        id, label: name || id, dot: projectColor(name, i),
      })),
      memberOptions: (Array.isArray(users) && users.length > 0
        ? users.map(u => ({
            id: u._id || u.id,
            label: `${u.name?.first || ''} ${u.name?.last || ''}`.trim() || u.authentication?.userName || 'Unknown',
          }))
        : Object.entries(memMap).map(([id, name]) => ({ id, label: name }))
      ).sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [tickets, projects, users]);

  // Fetch KPI tiles from API whenever any filter changes
  useEffect(() => {
    const toDate = new Date();
    const fromDate = new Date(toDate);
    const rangeDays = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : filters.dateRange === '90d' ? 90 : null;
    if (rangeDays) fromDate.setDate(toDate.getDate() - rangeDays);
    else fromDate.setFullYear(2025);

    const fmt = (d) => d.toISOString().split('T')[0];

    // Map selected project IDs → names for the API
    const projectNames = filters.projectIds
      .map(id => projectOptions.find(p => p.id === id)?.label)
      .filter(Boolean);

    const assigntoId = filters.memberIds[0] ?? null;
    const memberIds = filters.memberIds.length ? filters.memberIds : null;

    getAnalyticReportAPI({
      fromDate: fmt(fromDate),
      toDate: fmt(toDate),
      statuses: filters.statuses,
      projectNames,
      assigntoId,
      memberIds,
    })
      .then(res => {
        const raw = res?.data?.['taskmgt-total-task'];
        if (raw) setApiStats(raw);
        const breakdown = res?.data?.['taskmgt-status-breakdown'];
        if (Array.isArray(breakdown)) setApiStatusBreakdown(breakdown);
        const priority = res?.data?.['taskmgt-status-priority'];
        if (Array.isArray(priority) && priority[0]) setApiPriority(priority[0]);
        const completion = res?.data?.['taskmgt-complition-report'];
        if (Array.isArray(completion)) setApiCompletionTrend(completion);
        const projectReport = res?.data?.['taskmgt-project-report'];
        if (Array.isArray(projectReport)) setApiProjectReport(projectReport);
        const memberReport = res?.data?.['taskmgt-member-report'];
        if (Array.isArray(memberReport)) setApiMemberReport(memberReport);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.dateRange, filters.statuses, filters.projectIds, filters.memberIds, projectOptions]);

  // Apply filters to tickets
  const filteredTickets = useMemo(() => {
    const rangeDays = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : filters.dateRange === '90d' ? 90 : null;
    const cutoff = rangeDays ? new Date(today.getTime() - rangeDays * MS_PER_DAY) : null;
    return tickets.filter(t => {
      if (filters.statuses.length && !filters.statuses.includes(t.status)) return false;
      if (filters.severities.length) {
        const matchedKeys = SEVERITY_PRIORITY.filter(p => filters.severities.includes(p.label)).flatMap(p => p.keys);
        if (!matchedKeys.includes(t.severity)) return false;
      }
      if (filters.projectIds.length) {
        const pid = typeof t.project === 'string' ? t.project : t.project?._id || t.project?.id;
        if (!filters.projectIds.includes(pid)) return false;
      }
      if (filters.memberIds.length) {
        const mid = t.assignTo?._id || t.assignTo?.id || t.assignTo?.email || '';
        if (!filters.memberIds.includes(mid)) return false;
      }
      if (cutoff && t.createdAt && new Date(t.createdAt) < cutoff) return false;
      return true;
    });
  }, [tickets, filters, today]);

  const stats = useMemo(() => {
    const statusCounts = Object.fromEntries(Object.keys(STATUS_CONFIG).map(k => [k, 0]));
    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    filteredTickets.forEach(t => {
      if (statusCounts[t?.status] !== undefined) statusCounts[t.status]++;
      const sev = t?.severity;
      if (sev === 'Critical') severityCounts.Critical++;
      else if (sev === 'High') severityCounts.High++;
      else if (sev === 'Medium') severityCounts.Medium++;
      else if (sev === 'Low') severityCounts.Low++;
    });

    const totalDone = statusCounts.RESOLVED + statusCounts.CLOSED;
    const totalOpen = filteredTickets.length - totalDone;
    const pctComplete = filteredTickets.length ? Math.round((totalDone / filteredTickets.length) * 100) : 0;

    const overdueTickets = filteredTickets.filter(t => {
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
      return t.endDate && new Date(t.endDate) < today;
    });

    const dueSoon = filteredTickets.filter(t => {
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
      if (!t.endDate) return false;
      const d = new Date(t.endDate);
      const diff = Math.round((d - today) / MS_PER_DAY);
      return diff >= 0 && diff <= 7;
    });

    const recentlyDone = filteredTickets.filter(t => {
      if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
      if (!t.updatedAt) return false;
      return Math.round((today - new Date(t.updatedAt)) / MS_PER_DAY) <= 7;
    });

    const resolvedWithDates = filteredTickets.filter(t =>
      (t.status === 'RESOLVED' || t.status === 'CLOSED') && t.createdAt && t.updatedAt
    );
    let avgCompletionDays = null;
    if (resolvedWithDates.length > 0) {
      const sum = resolvedWithDates.reduce((a, t) =>
        a + Math.max(0, new Date(t.updatedAt) - new Date(t.createdAt)), 0);
      avgCompletionDays = (sum / resolvedWithDates.length / MS_PER_DAY).toFixed(1);
    }

    // 30-day trend: resolved/closed per day
    const days = 30;
    const trend = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      return { d, label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }), value: 0 };
    });
    filteredTickets.forEach(t => {
      if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return;
      if (!t.updatedAt) return;
      const updated = new Date(t.updatedAt);
      updated.setHours(0, 0, 0, 0);
      const idx = trend.findIndex(p => p.d.getTime() === updated.getTime());
      if (idx >= 0) trend[idx].value++;
    });

    // By project
    const projectMap = {};
    filteredTickets.forEach(t => {
      const proj = t.project;
      const id = typeof proj === 'string' ? proj : proj?._id || proj?.id || 'unassigned';
      const name = typeof proj === 'object' ? (proj?.name || 'Unknown') : null;
      if (!projectMap[id]) projectMap[id] = { id, name, tickets: [] };
      if (name && !projectMap[id].name) projectMap[id].name = name;
      projectMap[id].tickets.push(t);
    });
    if (Array.isArray(projects)) {
      projects.forEach(p => {
        const id = p._id || p.id;
        if (projectMap[id]) projectMap[id].name = p.name || projectMap[id].name;
      });
    }
    const projectList = Object.values(projectMap)
      .filter(p => p.id !== 'unassigned' && p.tickets.length > 0)
      .sort((a, b) => b.tickets.length - a.tickets.length);

    // By member — use full users list; fall back to ticket assignees if users not loaded
    const memberList = Array.isArray(users) && users.length > 0
      ? users.map(u => {
          const id = u._id || u.id;
          const name = `${u.name?.first || ''} ${u.name?.last || ''}`.trim() || u.authentication?.userName || 'Unknown';
          const tickets = filteredTickets.filter(t => {
            const a = t.assignTo;
            return (a?._id || a?.id || a?.email) === id;
          });
          return { id, name, tickets };
        }).sort((a, b) => b.tickets.length - a.tickets.length)
      : (() => {
          const memberMap = {};
          filteredTickets.forEach(t => {
            const a = t.assignTo;
            if (!a) return;
            const id = a._id || a.id || a.email || 'unknown';
            const name = a.name || a.username || a.email || 'Unknown';
            if (!memberMap[id]) memberMap[id] = { id, name, tickets: [] };
            memberMap[id].tickets.push(t);
          });
          return Object.values(memberMap).sort((a, b) => b.tickets.length - a.tickets.length);
        })();

    return {
      statusCounts, severityCounts, totalDone, totalOpen,
      pctComplete, overdueTickets, dueSoon, recentlyDone,
      avgCompletionDays, trend, projectList, memberList,
    };
  }, [filteredTickets, projects, users, today]);

  const statusSegments = apiStatusBreakdown
    ? apiStatusBreakdown
        .map(item => {
          const cfg = STATUS_CONFIG[item.status];
          return cfg ? { label: cfg.label, color: cfg.color, value: Number(item.total) } : null;
        })
        .filter(s => s && s.value > 0)
    : Object.entries(STATUS_CONFIG)
        .map(([key, cfg]) => ({ label: cfg.label, color: cfg.color, value: stats.statusCounts[key] }))
        .filter(s => s.value > 0);

  const statusTotal = apiStatusBreakdown
    ? apiStatusBreakdown.reduce((sum, item) => sum + Number(item.total), 0)
    : filteredTickets.length;

  const severityRows = SEVERITY_PRIORITY.map(p => ({
    label: p.label,
    color: p.color,
    value: apiPriority
      ? Number(apiPriority[p.label.toLowerCase()] ?? 0)
      : p.keys.reduce((a, k) => a + (stats.severityCounts[k] || 0), 0),
  }));

  const trendPoints = useMemo(() => {
    if (!apiCompletionTrend) return stats.trend;
    const days = 30;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const points = Array.from({ length: days }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (days - 1 - i));
      return { d, value: 0, label: `${d.getMonth() + 1}/${d.getDate()}` };
    });
    apiCompletionTrend.forEach(item => {
      const date = new Date(item.completed_date);
      date.setHours(0, 0, 0, 0);
      const idx = points.findIndex(p => p.d.getTime() === date.getTime());
      if (idx >= 0) points[idx].value = Number(item.completed_tasks);
    });
    return points;
  }, [apiCompletionTrend, stats.trend]);

  const trendTotal = apiCompletionTrend
    ? apiCompletionTrend.reduce((a, item) => a + Number(item.completed_tasks), 0)
    : stats.trend.reduce((a, p) => a + p.value, 0);

  if (loading && tickets.length === 0) return <OverviewSkeleton />;

  return (
    <ScrollArea className="flex-1 min-h-0 mx-2 mb-2">
    <div className="px-5 pt-4 pb-4 space-y-4">

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        projectOptions={projectOptions}
        memberOptions={memberOptions}
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-5 gap-4">
        <StatTile
          label="Total tasks"
          value={apiStats ? apiStats.total_tasks : filteredTickets.length}
          sub="in current view"
          icon="grid"
          tint={BRAND}
        />
        <StatTile
          label="Completion rate"
          value={apiStats
            ? `${Math.round((Number(apiStats.completed_tasks) / Math.max(1, Number(apiStats.total_tasks))) * 100)}%`
            : `${stats.pctComplete}%`}
          sub={apiStats ? `${apiStats.completed_tasks} completed` : `${stats.totalDone} resolved`}
          icon="check"
          tint="#10b981"
        />
        <StatTile
          label="Open tasks"
          value={apiStats ? apiStats.open_tasks : stats.totalOpen}
          sub="still in progress"
          icon="clock"
          tint="#f59e0b"
        />
        <StatTile
          label="Overdue"
          value={apiStats ? apiStats.overdue_tasks : stats.overdueTickets.length}
          sub="past due date"
          icon="alert"
          tint="#ef4444"
        />
        <StatTile
          label="Avg completion"
          value={apiStats ? `${apiStats.avg_completion_days}d` : (stats.avgCompletionDays !== null ? `${stats.avgCompletionDays}d` : '—')}
          sub="created → resolved"
          icon="trend"
          tint="#6366F1"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-4">

        {/* Status donut */}
        <div className="col-span-3 bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-0.5">Status breakdown</div>
          <div className="text-[11px] text-slate-400 mb-3">All {statusTotal} tasks</div>
          <div className="flex justify-center mb-4">
            <DonutChart segments={statusSegments} centerLabel="Total" centerValue={statusTotal} size={150} thickness={20} />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {statusSegments.map(s => (
              <div key={s.label} className="flex items-center gap-2 text-[11.5px]">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="text-slate-600 flex-1 truncate">{s.label}</span>
                <span className="text-slate-800 font-semibold tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority + alerts */}
        <div className="col-span-3 bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-[13px] font-semibold text-slate-800 mb-0.5">Priority</div>
          <div className="text-[11px] text-slate-400 mb-3">By severity level</div>
          <BarList rows={severityRows} />
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Alerts</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
                  <Icon name="alert" size={13} /> Overdue
                </span>
                <span className="font-bold text-slate-800">{apiPriority ? Number(apiPriority.overdue) : stats.overdueTickets.length}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                  <Icon name="clock" size={13} /> Due this week
                </span>
                <span className="font-bold text-slate-800">{apiPriority ? Number(apiPriority.due_this_week) : stats.dueSoon.length}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                  <Icon name="folder" size={13} /> Active projects
                </span>
                <span className="font-bold text-slate-800">{apiPriority ? Number(apiPriority.active_projects) : stats.projectList.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trend chart */}
        <div className="col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-[13px] font-semibold text-slate-800">Completion trend</div>
              <div className="text-[11px] text-slate-400">Tasks resolved per day · last 30 days</div>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-bold text-slate-800 leading-none tabular-nums">{trendTotal}</div>
              <div className="text-[10.5px] text-emerald-600 font-semibold mt-1">resolved this period</div>
            </div>
          </div>
          <TrendChart points={trendPoints} height={200} />
        </div>
      </div>

      {/* Projects + Members */}
      <div className="grid grid-cols-12 gap-4">
        <ProjectCard projectList={stats.projectList} projectColor={projectColor} today={today} apiProjects={apiProjectReport} />
        <WorkloadCard memberList={stats.memberList} today={today} apiMembers={apiMemberReport} />
      </div>

      {/* Task lists */}
      <div className="grid grid-cols-12 gap-4">
        <TaskCard
          title="Overdue"
          subtitle="Needs immediate attention"
          dotColor="bg-rose-500"
          count={stats.overdueTickets.length}
          countClassName="text-rose-600 bg-rose-50"
          tickets={stats.overdueTickets.slice(0, 8)}
          today={today}
          emptyMessage="No overdue tasks."
        />
        <TaskCard
          title="Due this week"
          subtitle="Next 7 days"
          dotColor="bg-amber-500"
          count={stats.dueSoon.length}
          countClassName="text-amber-700 bg-amber-50"
          tickets={stats.dueSoon.slice(0, 8)}
          today={today}
          emptyMessage="Nothing due this week."
        />
        <TaskCard
          title="Recently resolved"
          subtitle="Last 7 days"
          dotColor="bg-emerald-500"
          count={stats.recentlyDone.length}
          countClassName="text-emerald-700 bg-emerald-50"
          tickets={stats.recentlyDone.slice(0, 8)}
          today={today}
          emptyMessage="Nothing resolved recently."
        />
      </div>
    </div>
    </ScrollArea>
  );
};

export default DashboardOverview;
