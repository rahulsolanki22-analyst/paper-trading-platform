import { cn } from "@/lib/utils";

export function glassCard(className) {
  return cn(
    "rounded-2xl border border-border bg-card text-card-foreground shadow-sm backdrop-blur-xl",
    "transition-all duration-300 hover:shadow-md",
    className
  );
}
