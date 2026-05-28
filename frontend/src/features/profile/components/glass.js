import { cn } from "@/lib/utils";

export function glassCard(className) {
  return cn(
    "rounded-2xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-xl",
    "transition-all duration-300 hover:border-gray-300 hover:shadow-md",
    className
  );
}
