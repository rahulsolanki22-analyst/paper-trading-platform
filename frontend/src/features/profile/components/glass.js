import { cn } from "@/lib/utils";

export function glassCard(className) {
  return cn(
    "rounded-2xl border border-white/10 bg-zinc-950/45 shadow-2xl shadow-black/40 backdrop-blur-xl",
    "transition-all duration-300 hover:border-white/[0.14] hover:shadow-black/50",
    className
  );
}
