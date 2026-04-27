import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MemberRow from './MemberRow';

const WorkloadCard = ({ memberList, today }) => {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? memberList.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : memberList;

  return (
    <div className="col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[13px] font-semibold text-slate-800">Workload by member</div>
            <div className="text-[11px] text-slate-400">{memberList.length} members</div>
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
            placeholder="Search members…"
            className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-[#3B2FB1] focus:ring-1 focus:ring-[#3B2FB1]/20 placeholder:text-slate-400"
          />
        </div>
      </div>
      <ScrollArea className="px-4 py-1 h-[400px]">
        {filtered.length > 0 ? filtered.map(({ id, name, tickets }) => (
          <MemberRow key={id} id={id} name={name} tickets={tickets} today={today} />
        )) : (
          <div className="p-8 text-center text-slate-400 text-[13px]">
            {search ? 'No members match your search.' : 'No assignee data.'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default WorkloadCard;
