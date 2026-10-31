export default function PlansLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="max-w-2xl space-y-4">
        <div className="h-4 w-24 bg-border/60 rounded-sm" />
        <div className="h-10 w-64 bg-border/80 rounded-sm" />
        <div className="h-12 w-full max-w-md bg-border/40 rounded-sm" />
      </div>

      {/* Plan Selector Skeleton */}
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex w-full gap-1 p-1 rounded-sm bg-card border border-border">
          <div className="h-12 flex-1 bg-border/50 rounded-sm" />
          <div className="h-12 flex-1 bg-border/50 rounded-sm" />
          <div className="h-12 flex-1 bg-border/50 rounded-sm" />
        </div>

        <div className="h-[400px] w-full rounded-sm border border-border bg-card" />
      </div>
    </div>
  );
}
