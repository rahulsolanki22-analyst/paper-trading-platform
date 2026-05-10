import {
  Activity,
  BarChart3,
  Layers,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { glassCard } from "./glass";

function StatCard({ icon: Icon, label, value, sub, trend }) {
  return (
    <div
      className={cn(
        glassCard("group relative overflow-hidden p-4 md:p-5"),
        "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.04] before:to-transparent"
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-mono text-xl font-semibold tracking-tight tabular-nums md:text-2xl">{value}</p>
          {sub ? (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium tabular-nums",
                trend === "up" && "text-emerald-400",
                trend === "down" && "text-red-400",
                !trend && "text-muted-foreground"
              )}
            >
              {trend === "up" ? <TrendingUp className="size-3.5" /> : null}
              {trend === "down" ? <TrendingDown className="size-3.5" /> : null}
              {sub}
            </p>
          ) : null}
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105">
          <Icon className="size-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

export function StatsSection({ stats }) {
  const pl = stats.profitLoss;
  const plPositive = pl >= 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon={Wallet}
        label="Total balance"
        value={`₹${stats.totalBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
        sub={null}
      />
      <StatCard
        icon={plPositive ? TrendingUp : TrendingDown}
        label="Profit / Loss"
        value={`${plPositive ? "+" : "−"}₹${Math.abs(pl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
        sub={`${plPositive ? "+" : ""}${stats.profitLossPercent?.toFixed(2) ?? "0"}% vs start`}
        trend={plPositive ? "up" : "down"}
      />
      <StatCard
        icon={Percent}
        label="Win rate"
        value={`${stats.winRate.toFixed(1)}%`}
        sub="Closed trades"
      />
      <StatCard
        icon={BarChart3}
        label="Total trades"
        value={String(stats.totalTrades)}
        sub="All time"
      />
      <StatCard
        icon={Layers}
        label="Active positions"
        value={String(stats.activePositions)}
        sub="Open holdings"
      />
      <StatCard
        icon={Activity}
        label="Risk profile"
        value="Balanced"
        sub="Paper mode"
      />
    </div>
  );
}
