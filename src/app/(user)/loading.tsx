export default function UserPortalLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-border pb-6 space-y-3">
        <div className="h-8 w-64 bg-border/80 rounded-sm" />
        <div className="h-4 w-48 bg-border/50 rounded-sm" />
      </div>

      {/* Cards Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 rounded-sm border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="h-6 w-32 bg-border/80 rounded-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="h-16 bg-border/40 rounded-sm" />
            <div className="h-16 bg-border/40 rounded-sm" />
            <div className="h-16 bg-border/40 rounded-sm" />
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="h-6 w-32 bg-border/80 rounded-sm" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-border/40 rounded-sm" />
            <div className="h-4 w-5/6 bg-border/40 rounded-sm" />
            <div className="h-4 w-4/6 bg-border/40 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
