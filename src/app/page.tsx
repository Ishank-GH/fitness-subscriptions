export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-4">
        <span className="inline-block text-xs font-semibold tracking-widest text-primary uppercase border border-primary/30 px-3 py-1 rounded">
          Agarkar Athletics
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          High-Performance Fitness Subscriptions
        </h1>
        <p className="text-muted-foreground text-lg">
          Institutional athletic management, flexible payment terms, and dynamic billing cycles.
        </p>
      </div>
    </main>
  );
}

