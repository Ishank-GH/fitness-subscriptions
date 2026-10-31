import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-card p-6 sm:p-8 space-y-4 max-w-xl mx-auto my-6",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold font-display text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <div className="pt-2">
          {action.href ? (
            <Link href={action.href}>
              <Button size="sm" variant="outline" className="font-mono text-xs">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={action.onClick}
              className="font-mono text-xs"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}