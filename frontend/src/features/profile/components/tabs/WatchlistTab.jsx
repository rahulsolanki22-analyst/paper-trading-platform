import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "../EmptyState";
import { glassCard } from "../glass";

export function WatchlistTab({ items, onRemove, onAdd }) {
  if (!items?.length) {
    return (
      <EmptyState
        title="Watchlist is empty"
        description="Add symbols from the trading desk or use the quick-add row below."
        className="border-dashed border-gray-200 bg-transparent py-16 shadow-none"
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((row) => (
        <div
          key={row.symbol}
          className={cn(
            glassCard(
              "flex flex-col gap-4 p-4 transition-transform duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between bg-white border-gray-200"
            )
          )}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-base font-bold tracking-tight text-zinc-900">{row.symbol}</span>
              <span className="text-xs text-zinc-500">{row.name}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono tabular-nums text-zinc-700 font-medium">₹{row.price.toLocaleString("en-IN")}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                  row.changePct >= 0 ? "bg-emerald-500/15 text-emerald-650" : "bg-red-500/15 text-red-650"
                )}
              >
                {row.changePct >= 0 ? "+" : ""}
                {row.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-zinc-700 hover:text-zinc-900"
              onClick={() => onAdd?.(row)}
            >
              <Plus className="size-3.5" />
              Track
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => onRemove?.(row.symbol)}
            >
              <Minus className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
