export default function GlobalLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-4">
      <div className="h-8 w-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
      <p className="text-xs font-mono text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  );
}
