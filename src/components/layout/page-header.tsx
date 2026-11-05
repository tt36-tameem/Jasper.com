import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  count?: number;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  count,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-5", className)}>
      <div>
        <h1 className="text-[18px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 text-zinc-400 font-normal">
              [{count.toLocaleString()}]
            </span>
          )}
        </h1>
        {description && (
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
      )}
    </div>
  );
}
