import Link from "next/link";
import { type LucideIcon, FolderOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded border border-border bg-card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6",
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shrink-0">
        <Icon className="h-6 w-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold font-display uppercase tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      {action && (
        <div className="pt-2">
          {action.href ? (
            <Link href={action.href}>
              <Button size="sm" className="gap-2 font-semibold">
                {action.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={action.onClick} className="font-semibold">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}