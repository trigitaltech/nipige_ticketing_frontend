import { useState } from 'react';
import { X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DAY_NAMES, MONTHS, STATUS_OPTIONS } from './constants';
import { sanitizeTimeInput } from './utils';

const DayModal = ({ dayIndex, date, data, projects, initialTime, onSave, onClose }) => {
  const [form, setForm] = useState({ ...data, time: initialTime || data.time });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    onSave(dayIndex, form);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/[0.32] flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] w-[400px] max-w-[92vw] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between py-[15px] px-[18px] border-b border-slate-100">
          <span className="text-sm font-bold text-slate-900">
            {DAY_NAMES[date.getDay()]}, {MONTHS[date.getMonth()]} {date.getDate()}
          </span>
          <button
            className="w-7 h-7 rounded-md border-0 bg-slate-100 flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-200 transition-colors"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        <div className="py-4 px-[18px] flex flex-col gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em] mb-1">Project</label>
            <Select value={form.projectNames} onValueChange={v => set('projectNames', v)}>
              <SelectTrigger className="h-9 text-[13px] w-full"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {Array.isArray(projects) && projects.map(p => {
                  const name = p.name || 'Untitled';
                  return <SelectItem key={p._id || p.id} value={name}>{name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em] mb-1">Work Description</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg py-2 px-2.5 text-[13px] resize-y outline-none text-slate-700 bg-slate-50 focus:border-[#3B2FB1] focus:shadow-[0_0_0_2px_rgba(59,47,177,0.12)]"
              placeholder="Describe work done..."
              value={form.workDescription}
              onChange={e => set('workDescription', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2.5">
            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em] mb-1">Time</label>
              <input
                className="w-full h-9 border border-slate-200 rounded-lg px-2.5 text-[13px] outline-none text-slate-700 bg-slate-50 focus:border-[#3B2FB1] focus:shadow-[0_0_0_2px_rgba(59,47,177,0.12)]"
                placeholder="e.g. 2h 30m"
                value={form.time}
                onChange={e => set('time', sanitizeTimeInput(e.target.value))}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.06em] mb-1">Status</label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="h-9 text-[13px] w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 py-3 px-[18px] border-t border-slate-100">
          <button
            className="h-[34px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer inline-flex items-center transition-colors bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="h-[34px] px-4 rounded-lg text-[13px] font-semibold cursor-pointer border-0 inline-flex items-center gap-2 transition-colors bg-[#3B2FB1] text-white hover:bg-[#2d2490] disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Spinner className="size-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayModal;
