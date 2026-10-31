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
          <Link href="/" className="inline-block group">
            <span className="font-display font-extrabold text-2xl tracking-tight text-foreground">
              Ironvale
            </span>
          </Link>
          <p className="text-xs font-mono tracking-wider text-muted-foreground">
            Member portal
          </p>
        </div>

        <div className="flex justify-center">{children}</div>
      </div>
    </div>
  );
}