import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassCard } from "./glass";

export function ErrorState({ message, onRetry, className }) {
  return (
    <div
      className={cn(
        glassCard("flex flex-col items-center justify-center gap-4 px-6 py-12 text-center"),
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 ring-1 ring-destructive/30">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Something went wrong</p>
        <p className="max-w-md text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
