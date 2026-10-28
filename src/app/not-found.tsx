import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <span className="text-xs font-mono uppercase tracking-widest text-primary border border-primary/30 px-3 py-1 rounded">
        404
      </span>
      <h1 className="text-3xl font-extrabold uppercase font-display tracking-tight text-foreground sm:text-4xl">
        Page Not Found
      </h1>
      <p className="text-muted-foreground text-sm max-w-md">
        The requested training section or page does not exist or has been relocated.
      </p>
      <Link href="/">
        <Button variant="default" size="sm">
          Return Home
        </Button>
      </Link>
    </main>
  );
}

