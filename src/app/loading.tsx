export default function GlobalLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="h-14 w-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute font-black text-sm font-display text-primary uppercase tracking-tighter">
          IV
        </div>
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground animate-pulse">
        Loading Ironvale Platform...
      </p>
    </div>
  );
}