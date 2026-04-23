import { Skeleton } from '@/components/ui/skeleton';

const TicketCardSkeleton = () => {
  return (
    <div className="bg-white border-[1.5px] border-gray-100 rounded-xl p-5">
      {/* Header: id + severity pill */}
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-3/5 mb-3" />

      {/* Project pill */}
      <Skeleton className="h-4 w-24 rounded-full mb-3" />

      {/* Category + attachments row */}
      <div className="flex items-center gap-4 mb-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-8" />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-start pt-3.5 border-t border-[#EBECF0]">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
    </div>
  );
};

export default TicketCardSkeleton;
