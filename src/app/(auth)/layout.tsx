import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-primary-foreground font-black text-xl font-display transition-transform group-hover:scale-105">
              IV
            </div>
            <span className="font-extrabold tracking-tight text-foreground text-2xl uppercase font-display">
              IRON<span className="text-primary font-normal">VALE</span>
            </span>
          </Link>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Member & Athlete Portal
          </p>
        </div>

        <div className="flex justify-center">{children}</div>
      </div>
    </div>
  );
}

