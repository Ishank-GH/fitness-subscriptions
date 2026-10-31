export default function AdminLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-border pb-6 flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-3 w-36 bg-muted/60 rounded" />
          <div className="h-8 w-64 bg-muted/80 rounded" />
        </div>
        <div className="h-8 w-28 bg-muted/40 rounded" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded border border-border bg-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-muted/40 rounded" />
              <div className="h-7 w-7 rounded bg-muted/40" />
            </div>
            <div className="h-8 w-32 bg-muted/70 rounded" />
            <div className="h-3 w-28 bg-muted/30 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded border border-border bg-card p-6 space-y-4">
        <div className="h-5 w-44 bg-muted/60 rounded" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-10 bg-muted/20 rounded border border-border/40" />
          ))}
        </div>
      </div>
    </div>
  );
}