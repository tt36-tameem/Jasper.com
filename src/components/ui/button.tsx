import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "rounded-lg border-border bg-background hover:bg-muted hover:text-foreground",
        secondary:
          "rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "rounded-lg hover:bg-muted hover:text-foreground",
        destructive:
          "rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
        /* Filter pill — inactive state */
        pill:
          "rounded-full border border-zinc-200 bg-white text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200 transition-colors cursor-pointer",
        /* Filter pill — active/selected state */
        "pill-active":
          "rounded-full border border-zinc-900 bg-zinc-900 text-xs text-white hover:bg-zinc-800 hover:border-zinc-800 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-600 dark:hover:border-zinc-500 transition-colors cursor-pointer",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs:      "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-7 gap-1 px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg:      "h-9 gap-1.5 px-4",
        icon:    "size-8 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 rounded-lg",
        /* Pill sizes */
        pill:    "h-7 gap-1 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
