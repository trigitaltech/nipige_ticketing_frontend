import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        color: '#3b82f6' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b' },
  RESOLVED:    { label: 'Resolved',    color: '#10b981' },
  BACKLOG:     { label: 'Backlog',     color: '#ef4444' },
  CLOSED:      { label: 'Closed',      color: '#64748b' },
};

const RISK = {
  high:    'bg-rose-50 text-rose-700 border-rose-200',
  med:     'bg-amber-50 text-amber-700 border-amber-200',
  low:     'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const HEALTH_MAP = {
  'At risk':  'high',
  'Monitor':  'med',
  'On track': 'low',
};

const ProjectRow = ({ name, color, tasks, today }) => {
  const total = Math.max(tasks.length, 1);
  const done = tasks.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const pct = Math.round((done / total) * 100);
  const overdueCt = tasks.filter(t => {
    if (t.status === 'RESOLVED' || t.status === 'CLOSED') return false;
    return t.endDate && new Date(t.endDate) < today;
  }).length;
  const inProg = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const segs = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    label: cfg.label, color: cfg.color, value: tasks.filter(t => t.status === key).length,
  }));
  const riskLevel = overdueCt > 5 ? 'high' : overdueCt > 2 ? 'med' : 'low';
  const riskLabel = { high: 'At risk', med: 'Monitor', low: 'On track' }[riskLevel];

  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_72px_72px_90px] gap-3 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
          <div className="font-semibold text-slate-800 text-[13px] truncate">{name}</div>
        </div>
        <div className="text-[10.5px] text-slate-400 mt-0.5 ml-[18px]">{tasks.length} tasks · {inProg} in progress</div>
      </div>
      <div>
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mb-1">
          {segs.filter(s => s.value > 0).map((s, i) => (
            <div key={i} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0 text-[10px] text-slate-500">
          {segs.filter(s => s.value > 0).slice(0, 4).map((s, i) => (
            <span key={i} className="inline-flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-sm" style={{ background: s.color }} /> {s.label} <b className="text-slate-700">{s.value}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="text-right tabular-nums">
        <div className="text-[14px] font-bold text-slate-800">{pct}%</div>
        <div className="text-[10px] text-slate-400">done</div>
      </div>
      <div className="text-right tabular-nums">
        <div className={`text-[14px] font-bold ${overdueCt ? 'text-rose-600' : 'text-slate-300'}`}>{overdueCt}</div>
        <div className="text-[10px] text-slate-400">overdue</div>
      </div>
      <div className="flex justify-end">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${RISK[riskLevel]}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" /> {riskLabel}
        </span>
      </div>
    </div>
  );
};

const ApiProjectRow = ({ row, color }) => {
  const total = Math.max(Number(row.total_tasks), 1);
  const segs = [
    { label: 'Open',        color: STATUS_CONFIG.OPEN.color,        value: Number(row.open_tasks) },
    { label: 'In Progress', color: STATUS_CONFIG.IN_PROGRESS.color,  value: Number(row.in_progress_tasks) },
    { label: 'Resolved',    color: STATUS_CONFIG.RESOLVED.color,     value: Number(row.resolved_tasks) },
    { label: 'Backlog',     color: STATUS_CONFIG.BACKLOG.color,      value: Number(row.backlog_tasks) },
    { label: 'Closed',      color: STATUS_CONFIG.CLOSED.color,       value: Number(row.closed_tasks) },
  ];
  const pct = Number(row.progress_percent);
  const overdueCt = Number(row.overdue_tasks);
  const inProg = Number(row.in_progress_tasks);
  const riskLevel = HEALTH_MAP[row.health_status] ?? (overdueCt > 5 ? 'high' : overdueCt > 2 ? 'med' : 'low');
  const riskLabel = row.health_status || { high: 'At risk', med: 'Monitor', low: 'On track' }[riskLevel];

  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_72px_72px_90px] gap-3 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
          <div className="font-semibold text-slate-800 text-[13px] truncate">{row.project_name}</div>
        </div>
        <div className="text-[10.5px] text-slate-400 mt-0.5 ml-[18px]">{row.total_tasks} tasks · {inProg} in progress</div>
      </div>
      <div>
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mb-1">
          {segs.filter(s => s.value > 0).map((s, i) => (
            <div key={i} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0 text-[10px] text-slate-500">
          {segs.filter(s => s.value > 0).slice(0, 4).map((s, i) => (
            <span key={i} className="inline-flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-sm" style={{ background: s.color }} /> {s.label} <b className="text-slate-700">{s.value}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="text-right tabular-nums">
        <div className="text-[14px] font-bold text-slate-800">{pct}%</div>
        <div className="text-[10px] text-slate-400">done</div>
      </div>
      <div className="text-right tabular-nums">
        <div className={`text-[14px] font-bold ${overdueCt ? 'text-rose-600' : 'text-slate-300'}`}>{overdueCt}</div>
        <div className="text-[10px] text-slate-400">overdue</div>
      </div>
      <div className="flex justify-end">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${RISK[riskLevel]}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" /> {riskLabel}
        </span>
      </div>
    </div>
  );
};

const ProjectCard = ({ projectList, projectColor, today, apiProjects }) => {
  const [search, setSearch] = useState('');

  const useApi = Array.isArray(apiProjects) && apiProjects.length > 0;

  const filtered = useApi
    ? (search.trim()
        ? apiProjects.filter(p => p.project_name?.toLowerCase().includes(search.toLowerCase()))
        : apiProjects)
    : (search.trim()
        ? projectList.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()))
        : projectList);

  const count = useApi ? apiProjects.length : projectList.length;

  return (
    <div className="col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[13px] font-semibold text-slate-800">All projects</div>
            <div className="text-[11px] text-slate-400">{count} projects with tasks</div>
          </div>
        </div>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-[#3B2FB1] focus:ring-1 focus:ring-[#3B2FB1]/20 placeholder:text-slate-400"
          />
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_72px_72px_90px] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/60">
        <div>Project</div>
        <div>Status distribution</div>
        <div className="text-right">Done</div>
        <div className="text-right">Overdue</div>
        <div className="text-right">Health</div>
      </div>
      <ScrollArea className="h-[400px]">
        {filtered.length > 0 ? (
          useApi
            ? filtered.map((row, i) => (
                <ApiProjectRow key={row.project_name} row={row} color={projectColor(row.project_name, i)} />
              ))
            : filtered.map((p, i) => (
                <ProjectRow key={p.id} name={p.name || 'Unnamed'} color={projectColor(p.name, i)} tasks={p.tickets} today={today} />
              ))
        ) : (
          <div className="p-8 text-center text-slate-400 text-[13px]">
            {search ? 'No projects match your search.' : 'No project data available.'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ProjectCard;
