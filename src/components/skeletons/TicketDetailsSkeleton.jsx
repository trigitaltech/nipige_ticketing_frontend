import { Skeleton } from '@/components/ui/skeleton';

const TicketDetailsSkeleton = () => {
  return (
    <div className="h-svh flex flex-col overflow-hidden">
      <div className="relative flex flex-1 overflow-hidden">
        {/* ===== LEFT: Main content ===== */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {/* Sticky mini top bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between gap-2 px-5 py-2.5 bg-white/90 backdrop-blur border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-md" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pt-5 pb-8 max-w-[960px]">
            {/* Title */}
            <Skeleton className="h-8 w-3/4 mb-4" />

            {/* Hero chips */}
            <div className="flex items-center flex-wrap gap-2 mb-6">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Property rows */}
            <div className="space-y-2 mb-7">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-dashed border-slate-100">
                  <div className="flex items-center gap-2 w-[130px] shrink-0">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-48" />
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-[100px] w-full rounded-md" />
            </div>

            {/* Attachments */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                    <Skeleton className="h-[100px] w-full rounded-none" />
                    <div className="p-2 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <Skeleton className="h-3 w-20 mb-3" />
              <div className="flex gap-3 mb-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="flex-1 h-20 rounded-md" />
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3 mb-4">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== RIGHT: Activity sidebar ===== */}
        <div className="hidden min-[1101px]:flex w-[320px] border-l border-slate-200 flex-col">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsSkeleton;
