export default function UserPortalLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-border pb-6 space-y-2">
        <div className="h-4 w-28 bg-muted/60 rounded" />
        <div className="h-8 w-64 bg-muted/80 rounded" />
        <div className="h-3 w-48 bg-muted/40 rounded" />
      </div>

      {/* Cards Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded border border-border bg-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-border/50">
            <div className="space-y-1.5">
              <div className="h-3 w-32 bg-muted/40 rounded" />
              <div className="h-6 w-48 bg-muted/70 rounded" />
            </div>
            <div className="h-6 w-24 bg-muted/50 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 bg-muted/20 border border-border/50 rounded" />
            <div className="h-24 bg-muted/20 border border-border/50 rounded" />
            <div className="h-24 bg-muted/20 border border-border/50 rounded" />
          </div>
        </div>

        <div className="rounded border border-border bg-card p-6 space-y-4">
          <div className="h-5 w-36 bg-muted/60 rounded" />
          <div className="h-20 bg-muted/20 border border-border/40 rounded" />
          <div className="h-20 bg-muted/20 border border-border/40 rounded" />
        </div>
      </div>
    </div>
  );
}