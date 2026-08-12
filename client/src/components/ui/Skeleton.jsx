const Skeleton = ({ className = "", style = {}, ...props }) => (
  <div
    className={`rounded-lg animate-pulse ${className}`}
    style={{ background: "rgba(255,255,255,0.07)", ...style }}
    {...props}
  />
);

export const SkeletonCard = () => (
  <div
    className="rounded-2xl p-5 border border-white/10 space-y-3 shadow-lg"
    style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)" }}
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <div className="flex items-center justify-between pt-2 border-t border-white/5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3 border-b border-white/5">
    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-5 w-16 rounded-full" />
  </div>
);

export const SkeletonStat = () => (
  <div
    className="rounded-2xl p-5 border border-white/10 space-y-3 shadow-lg"
    style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)" }}
  >
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-20" />
  </div>
);

export default Skeleton;
