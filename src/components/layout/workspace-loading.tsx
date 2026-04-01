import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-emerald-950/5 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="mt-4 h-10 w-80 rounded-2xl" />
        <Skeleton className="mt-4 h-4 w-full max-w-3xl rounded-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[28px] border border-emerald-950/5 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
          >
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="mt-5 h-10 w-32 rounded-2xl" />
            <Skeleton className="mt-4 h-3 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] border border-emerald-950/5 bg-white/90 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <Skeleton className="h-4 w-48 rounded-full" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-[22px]" />
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-emerald-950/5 bg-[#071510] p-6 shadow-[0_30px_80px_rgba(6,23,17,0.35)]">
          <Skeleton className="h-4 w-40 rounded-full bg-white/15" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-[22px] bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
