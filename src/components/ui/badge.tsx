import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary border-transparent text-primary-foreground",
        secondary:   "bg-secondary border-transparent text-secondary-foreground",
        destructive: "bg-destructive/10 border-destructive/20 text-destructive",
        outline:     "border-border text-foreground",
        ghost:       "border-transparent text-muted-foreground",

        /* ── Lead Status Variants ──────────────────────────── */
        new:          "bg-blue-50    border-blue-100    text-blue-600    dark:bg-blue-950/40    dark:border-blue-800/40    dark:text-blue-400",
        contacted:    "bg-amber-50   border-amber-100   text-amber-600   dark:bg-amber-950/40   dark:border-amber-800/40   dark:text-amber-400",
        qualified:    "bg-violet-50  border-violet-100  text-violet-600  dark:bg-violet-950/40  dark:border-violet-800/40  dark:text-violet-400",
        proposal:     "bg-orange-50  border-orange-100  text-orange-600  dark:bg-orange-950/40  dark:border-orange-800/40  dark:text-orange-400",
        closed:       "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400",
        lost:         "bg-zinc-100   border-zinc-200    text-zinc-500    dark:bg-zinc-800       dark:border-zinc-700       dark:text-zinc-400",
        unqualified:  "bg-red-50     border-red-100     text-red-600     dark:bg-red-950/40     dark:border-red-800/40     dark:text-red-400",
        callbooked:   "bg-violet-50  border-violet-100  text-violet-700  dark:bg-violet-950/40  dark:border-violet-800/40  dark:text-violet-300",
        deposit:      "bg-amber-50   border-amber-100   text-amber-700   dark:bg-amber-950/40   dark:border-amber-800/40   dark:text-amber-300",
        won:          "bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800/40 dark:text-emerald-300",
        noshow:       "bg-orange-50  border-orange-100  text-orange-600  dark:bg-orange-950/40  dark:border-orange-800/40  dark:text-orange-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const DOT_COLOR: Record<string, string> = {
  new:         "bg-blue-400",
  contacted:   "bg-amber-400",
  qualified:   "bg-violet-400",
  proposal:    "bg-orange-400",
  closed:      "bg-emerald-400",
  lost:        "bg-zinc-400",
  unqualified: "bg-red-400",
  callbooked:  "bg-violet-500",
  deposit:     "bg-amber-500",
  won:         "bg-emerald-500",
  noshow:      "bg-orange-400",
};

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  const dot = variant && DOT_COLOR[variant as string];

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render: render ?? ((p) => (
      <span {...p}>
        {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot)} />}
        {(props as { children?: React.ReactNode }).children}
      </span>
    )),
    state: { slot: "badge", variant },
  });
}

export { Badge, badgeVariants };
