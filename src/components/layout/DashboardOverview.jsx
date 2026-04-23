import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const SEVERITY_BUCKETS = [
  { key: 'High',   label: 'High',   flagColor: '#E11D48', barColor: '#E11D48' },
  { key: 'Medium', label: 'Medium', flagColor: '#F59E0B', barColor: '#F59E0B' },
  { key: 'Low',    label: 'Low',    flagColor: '#10B981', barColor: '#10B981' },
];

const STATUS_CONFIG = [
  { key: 'RESOLVED',    label: 'Resolved',    color: '#10B981', icon: 'check' },
  { key: 'OPEN',        label: 'Open',        color: '#3B82F6', icon: 'calendar' },
  { key: 'CLOSED',      label: 'Closed',      color: '#F59E0B', icon: 'review' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#8B5CF6', icon: 'progress' },
  { key: 'BACKLOG',     label: 'Backlog',     color: '#a18072', icon: 'backlog' },
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const Flag = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M4 2v20h2v-8h12l-2-4 2-4H6V2H4z" />
  </svg>
);

const StatusIcon = ({ name, color }) => {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'check') return (
    <svg {...common}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  );
  if (name === 'calendar') return (
    <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  );
  if (name === 'review') return (
    <svg {...common}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  );
  if (name === 'backlog') return (
    <svg {...common}><circle cx="12" cy="12" r="9" strokeDasharray="3 3"/></svg>
  );
  return (
    <svg {...common}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
  );
};

const Donut = ({ slices, size = 140, stroke = 22 }) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={stroke}
      />
      {slices.map((s) => {
        const length = (s.value / total) * circumference;
        const dashoffset = -offset;
        offset += length;
        if (!length) return null;
        return (
          <circle
            key={s.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={dashoffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
    </svg>
  );
};

const PriorityBar = ({ count, max, color }) => {
  const bars = 30;
  const active = max > 0 ? Math.round((count / max) * bars) : 0;
  return (
    <div className="flex items-end gap-[2px] h-10">
      {Array.from({ length: bars }).map((_, i) => {
        // Deterministic pseudo-random height so re-renders don't shuffle
        const height = 40 + ((i * 37) % 55);
        const isActive = i < active;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${height}%`,
              background: isActive ? color : `${color}33`,
            }}
          />
        );
      })}
    </div>
  );
};

const TrendBadge = ({ value, down = true }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${down ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {down ? <polyline points="6 9 12 15 18 9" /> : <polyline points="6 15 12 9 18 15" />}
    </svg>
    {value}
  </span>
);

const avgDaysForStatus = (tickets, status) => {
  const matched = tickets.filter((t) => t?.status === status && t?.createdAt && t?.updatedAt);
  if (matched.length === 0) return null;
  const totalMs = matched.reduce((sum, t) => {
    const diff = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
    return sum + Math.max(0, diff);
  }, 0);
  return (totalMs / matched.length / MS_PER_DAY);
};

const OverviewSkeleton = () => {
  const cardBase = 'bg-white border border-slate-200 rounded-xl p-4';
  return (
    <div className="grid grid-cols-12 gap-4 px-5 pt-4">
      <div className={`${cardBase} col-span-12 xl:col-span-5`}>
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className={`${cardBase} col-span-12 xl:col-span-5`}>
        <Skeleton className="h-4 w-56 mb-4" />
        <div className="flex items-center gap-5">
          <Skeleton className="h-[140px] w-[140px] rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-2 flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className={`${cardBase} flex-1`}>
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardOverview = ({ tickets = [], loading = false }) => {
  if (loading && tickets.length === 0) {
    return <OverviewSkeleton />;
  }
  const stats = useMemo(() => {
    const severityCounts = { High: 0, Medium: 0, Low: 0 };
    const statusCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, BACKLOG: 0, CLOSED: 0 };

    tickets.forEach((t) => {
      const sev = t?.severity;
      if (sev === 'Critical' || sev === 'High') severityCounts.High += 1;
      else if (sev === 'Medium') severityCounts.Medium += 1;
      else if (sev === 'Low') severityCounts.Low += 1;

      const st = t?.status;
      if (st && statusCounts[st] !== undefined) statusCounts[st] += 1;
    });

    const totalBySeverity = severityCounts.High + severityCounts.Medium + severityCounts.Low;
    const maxSeverity = Math.max(severityCounts.High, severityCounts.Medium, severityCounts.Low, 1);

    return {
      severityCounts,
      totalBySeverity,
      maxSeverity,
      statusCounts,
      totalTickets: tickets.length,
      avgReviewDays: avgDaysForStatus(tickets, 'CLOSED'),
      avgCompletionDays: avgDaysForStatus(tickets, 'RESOLVED'),
    };
  }, [tickets]);

  const statusSlices = STATUS_CONFIG.map((cfg) => ({
    key: cfg.key,
    label: cfg.label,
    color: cfg.color,
    icon: cfg.icon,
    value: stats.statusCounts[cfg.key] || 0,
  }));

  const cardBase = 'bg-white border border-slate-200 rounded-xl p-4';

  return (
    <div className="grid grid-cols-12 gap-4 px-5 pt-4">
      {/* Priority Overview */}
      <div className={`${cardBase} col-span-12 xl:col-span-5`}>
        <h3 className="text-[14px] font-semibold text-slate-800 mb-3">Priority Overview</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {SEVERITY_BUCKETS.map((b) => (
            <div key={b.key} className="flex items-center gap-2">
              <Flag color={b.flagColor} />
              <div>
                <div className="text-[22px] font-bold leading-none text-slate-900">{stats.severityCounts[b.key]}</div>
                <div className="text-[12px] text-slate-500">{b.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {SEVERITY_BUCKETS.map((b) => (
            <PriorityBar
              key={b.key}
              count={stats.severityCounts[b.key]}
              max={stats.maxSeverity}
              color={b.barColor}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {SEVERITY_BUCKETS.map((b) => {
            const pct = stats.totalBySeverity > 0
              ? Math.round((stats.severityCounts[b.key] / stats.totalBySeverity) * 100)
              : 0;
            return (
              <div key={b.key}>
                <div className="text-[14px] font-bold text-slate-900">{pct}<span className="text-[12px] text-slate-500">%</span></div>
                <div className="text-[11px] text-slate-500">{b.label} Priority</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Status Overview */}
      <div className={`${cardBase} col-span-12 xl:col-span-5`}>
        <h3 className="text-[14px] font-semibold text-slate-800 mb-3">Progress Status Overview</h3>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Donut slices={statusSlices} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[11px] text-slate-500">Total</div>
              <div className="text-[18px] font-bold text-slate-900 leading-none mt-0.5">{stats.totalTickets}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">task{stats.totalTickets !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {statusSlices.map((s) => {
              const pct = stats.totalTickets > 0 ? Math.round((s.value / stats.totalTickets) * 100) : 0;
              return (
                <div key={s.key} className="flex items-center justify-between gap-2 px-3 py-1.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon name={s.icon} color={s.color} />
                    <span className="text-[13px] font-medium text-slate-700 truncate">{s.label}</span>
                  </div>
                  <span className="text-[13px] font-semibold text-slate-600 tabular-nums">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Avg Review & Completion Time stacked */}
      <div className="col-span-12 xl:col-span-2 flex flex-col gap-4">
        <div className={`${cardBase} flex-1`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-[13px] font-semibold text-slate-700">Avg. Review Time</h3>
            {stats.avgReviewDays !== null && <TrendBadge value="12.5%" down />}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-slate-900 leading-none">
              {stats.avgReviewDays !== null ? stats.avgReviewDays.toFixed(1) : '—'}
            </span>
            <span className="text-[12px] text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Based on CLOSED tickets</div>
        </div>

        <div className={`${cardBase} flex-1`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-[13px] font-semibold text-slate-700">Avg. Completion Time</h3>
            {stats.avgCompletionDays !== null && <TrendBadge value="8.7%" down />}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-slate-900 leading-none">
              {stats.avgCompletionDays !== null ? stats.avgCompletionDays.toFixed(1) : '—'}
            </span>
            <span className="text-[12px] text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Based on RESOLVED tickets</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
