import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MS_PER_MIN = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MIN;

const presets = [
  { label: '15m', ms: 15 * MS_PER_MIN },
  { label: '30m', ms: 30 * MS_PER_MIN },
  { label: '1h',  ms: 1 * MS_PER_HOUR },
  { label: '2h',  ms: 2 * MS_PER_HOUR },
  { label: '4h',  ms: 4 * MS_PER_HOUR },
  { label: '8h',  ms: 8 * MS_PER_HOUR },
];

const msToHM = (ms) => {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalMinutes = Math.floor(safeMs / MS_PER_MIN);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
};

const hmToMs = (hours, minutes) =>
  (Math.max(0, Number(hours) || 0) * 60 + Math.max(0, Number(minutes) || 0)) * MS_PER_MIN;

const formatDisplay = (ms) => {
  const { hours, minutes } = msToHM(ms);
  if (!hours && !minutes) return '';
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

const clockIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const chevUp = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const chevDown = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Stepper = ({ label, value, onChange, min = 0, max, step = 1 }) => {
  const clamp = (n) => {
    let v = Number.isFinite(n) ? n : 0;
    if (v < min) v = min;
    if (typeof max === 'number' && v > max) v = max;
    return v;
  };

  return (
    <div className="flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-center">
        {label}
      </div>
      <div className="flex items-stretch rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={String(value).padStart(2, '0')}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          onFocus={(e) => e.target.select()}
          className="w-full text-center text-[20px] font-bold tabular-nums text-slate-800 bg-transparent outline-none py-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <div className="flex flex-col border-l border-slate-100">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onChange(clamp(value + step))}
            className="flex-1 px-2 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            {chevUp}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onChange(clamp(value - step))}
            className="flex-1 px-2 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 border-t border-slate-100 transition-colors"
          >
            {chevDown}
          </button>
        </div>
      </div>
    </div>
  );
};

const EstimateTimePicker = ({ valueMs = 0, onChange, triggerClassName = '', placeholder = 'Set estimate' }) => {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(() => msToHM(valueMs).hours);
  const [minutes, setMinutes] = useState(() => msToHM(valueMs).minutes);

  useEffect(() => {
    if (!open) {
      const { hours: h, minutes: m } = msToHM(valueMs);
      setHours(h);
      setMinutes(m);
    }
  }, [valueMs, open]);

  const commit = (h, m) => {
    onChange(hmToMs(h, m));
  };

  const handleHours = (h) => {
    setHours(h);
    commit(h, minutes);
  };

  const handleMinutes = (m) => {
    const capped = m >= 60 ? 59 : m;
    setMinutes(capped);
    commit(hours, capped);
  };

  const applyPreset = (ms) => {
    const { hours: h, minutes: m } = msToHM(ms);
    setHours(h);
    setMinutes(m);
    onChange(ms);
    setOpen(false);
  };

  const clear = () => {
    setHours(0);
    setMinutes(0);
    onChange(0);
  };

  const display = formatDisplay(valueMs);
  const hasValue = Boolean(display);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-transparent bg-transparent text-[13px] font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-200 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all ${triggerClassName}`}
        >
          <span className={hasValue ? 'text-slate-500' : 'text-slate-400'}>{clockIcon}</span>
          <span className={`tabular-nums ${hasValue ? 'text-slate-800' : 'text-slate-400 font-medium'}`}>
            {hasValue ? display : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-3 z-[1100]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Time estimate</div>
          {hasValue && (
            <button
              type="button"
              onClick={clear}
              className="text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-end gap-2">
          <Stepper label="Hours" value={hours} onChange={handleHours} min={0} max={99} />
          <div className="pb-2 text-[20px] font-bold text-slate-300 tabular-nums">:</div>
          <Stepper label="Minutes" value={minutes} onChange={handleMinutes} min={0} max={59} step={5} />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Presets</div>
          <div className="grid grid-cols-6 gap-1">
            {presets.map((p) => {
              const active = valueMs === p.ms;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.ms)}
                  className={`py-1 rounded-md text-[11px] font-bold tabular-nums transition-colors border ${
                    active
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EstimateTimePicker;
