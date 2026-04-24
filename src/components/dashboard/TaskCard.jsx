import { ScrollArea } from '@/components/ui/scroll-area';
import TaskRow from './TaskRow';

const TaskCard = ({ title, subtitle, dotColor, count, countClassName, tickets, today, emptyMessage }) => (
  <div className="col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div>
        <div className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full inline-block ${dotColor}`} />
          {title}
        </div>
        <div className="text-[11px] text-slate-400">{subtitle}</div>
      </div>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${countClassName}`}>
        {count}
      </span>
    </div>
    <ScrollArea className="h-[380px] px-5 pb-3">
      {tickets.length > 0
        ? tickets.map(t => <TaskRow key={t._id || t.id} ticket={t} today={today} />)
        : <div className="text-[12px] text-slate-400 py-6 text-center">{emptyMessage}</div>
      }
    </ScrollArea>
  </div>
);

export default TaskCard;
