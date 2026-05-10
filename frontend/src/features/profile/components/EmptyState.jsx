import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { glassCard } from "./glass";

export function EmptyState({ title, description, className }) {
  return (
    <div
      className={cn(
        glassCard("flex flex-col items-center justify-center gap-2 px-6 py-14 text-center"),
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Inbox className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
