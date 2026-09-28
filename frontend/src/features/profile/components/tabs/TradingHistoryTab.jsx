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
        className="border-dashed border-gray-200 bg-transparent py-16 shadow-none"
      />
    );
  }

  return (
    <div className={cn(glassCard("overflow-hidden p-0"))}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 hover:bg-transparent">
              <TableHead className="text-zinc-550">Stock</TableHead>
              <TableHead className="text-zinc-550">Side</TableHead>
              <TableHead className="text-right text-zinc-550">Price</TableHead>
              <TableHead className="text-right text-zinc-550">Qty</TableHead>
              <TableHead className="text-zinc-550">Date</TableHead>
              <TableHead className="text-right text-zinc-550">P&amp;L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((t) => (
              <TableRow
                key={t.id}
                className="border-gray-100 transition-colors hover:bg-gray-50/50"
              >
                <TableCell>
                  <div className="font-mono text-sm font-semibold text-zinc-900">{t.symbol}</div>
                  <div className="text-xs text-zinc-500">{t.name}</div>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase",
                      t.side === "BUY" ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"
                    )}
                  >
                    {t.side}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums text-zinc-750">
                  ₹{t.price.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-700">{t.quantity}</TableCell>
                <TableCell className="text-xs text-zinc-500">{fmtDate(t.date)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono text-sm font-semibold tabular-nums",
                    t.pnl == null
                      ? "text-zinc-400 font-normal"
                      : t.pnl >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
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
