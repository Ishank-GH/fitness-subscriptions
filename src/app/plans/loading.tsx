export default function PlansLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="h-3 w-28 bg-muted/60 rounded mx-auto" />
        <div className="h-10 w-80 bg-muted/80 rounded mx-auto" />
        <div className="h-4 w-96 bg-muted/40 rounded mx-auto" />
      </div>

      {/* 3-Plan Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((card) => (
          <div key={card} className="rounded border border-border bg-card p-6 space-y-6">
            <div className="space-y-2">
              <div className="h-5 w-36 bg-muted/70 rounded" />
              <div className="h-3 w-48 bg-muted/40 rounded" />
            </div>
            <div className="h-10 w-32 bg-muted/80 rounded" />
            <div className="h-12 bg-muted/20 border border-border/40 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-muted/30 rounded" />
              <div className="h-3 w-5/6 bg-muted/30 rounded" />
              <div className="h-3 w-4/6 bg-muted/30 rounded" />
            </div>
            <div className="h-10 bg-muted/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}