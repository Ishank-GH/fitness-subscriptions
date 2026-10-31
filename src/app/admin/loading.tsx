export default function AdminLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-border pb-6 space-y-3">
        <div className="h-8 w-48 bg-border/80 rounded-sm" />
        <div className="h-4 w-64 bg-border/50 rounded-sm" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-sm border border-border bg-card p-5 space-y-3"
          >
            <div className="h-3 w-24 bg-border/60 rounded-sm" />
            <div className="h-8 w-20 bg-border/80 rounded-sm" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-sm border border-border bg-card p-6">
        <div className="h-6 w-48 bg-border/80 rounded-sm mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-10 w-full bg-border/40 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
