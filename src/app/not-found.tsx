import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start justify-center min-h-[50vh] px-4 container mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold font-display text-foreground">
        404 Not found
      </h1>
      <p className="text-sm text-muted-foreground font-mono">
        The requested page does not exist or has been moved.
      </p>
      <div className="pt-2">
        <Link href="/">
          <Button variant="outline" size="sm" className="font-mono text-xs">
            Return home
          </Button>
        </Link>
      </div>
    </div>
  );
}
