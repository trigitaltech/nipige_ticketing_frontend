import { ScrollArea } from '@/components/ui/scroll-area';
import MemberRow from './MemberRow';

const WorkloadCard = ({ memberList, today }) => (
  <div className="col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
    <div className="px-5 py-3.5 border-b border-slate-100">
      <div className="text-[13px] font-semibold text-slate-800">Workload by member</div>
      <div className="text-[11px] text-slate-400">{memberList.length} assignees</div>
    </div>
    <ScrollArea className="px-4 py-1 h-[440px]">
      {memberList.length > 0 ? memberList.map(({ id, name, tickets }) => (
        <MemberRow key={id} id={id} name={name} tickets={tickets} today={today} />
      )) : (
        <div className="p-8 text-center text-slate-400 text-[13px]">No assignee data.</div>
      )}
    </ScrollArea>
  </div>
);

export default WorkloadCard;
