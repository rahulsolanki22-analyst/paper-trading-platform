import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState } from "../EmptyState";
import { glassCard } from "../glass";

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function TradingHistoryTab({ trades }) {
  if (!trades?.length) {
    return (
      <EmptyState
        title="No trading history"
        description="Your executed orders will appear here with full detail."
        className="border-dashed border-white/10 bg-transparent py-16 shadow-none"
      />
    );
  }

  return (
    <div className={cn(glassCard("overflow-hidden p-0"))}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Stock</TableHead>
              <TableHead className="text-muted-foreground">Side</TableHead>
              <TableHead className="text-right text-muted-foreground">Price</TableHead>
              <TableHead className="text-right text-muted-foreground">Qty</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-right text-muted-foreground">P&amp;L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((t) => (
              <TableRow
                key={t.id}
                className="border-white/5 transition-colors hover:bg-white/[0.03]"
              >
                <TableCell>
                  <div className="font-mono text-sm font-medium">{t.symbol}</div>
                  <div className="text-xs text-muted-foreground">{t.name}</div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase",
                      t.side === "BUY" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                    )}
                  >
                    {t.side}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  ₹{t.price.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(t.date)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono text-sm font-semibold tabular-nums",
                    t.pnl == null
                      ? "text-muted-foreground font-normal"
                      : t.pnl >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                  )}
                >
                  {t.pnl == null
                    ? "—"
                    : `${t.pnl >= 0 ? "+" : "−"}₹${Math.abs(t.pnl).toLocaleString("en-IN")}`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
