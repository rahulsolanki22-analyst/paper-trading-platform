import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const chartTooltip = {
  contentStyle: {
    background: "rgba(9, 9, 11, 0.92)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontSize: "12px",
  },
  labelStyle: { color: "rgba(255,255,255,0.7)" },
};

export function OverviewTab({ stats, dailyPnl, dailyPnlPercent, portfolioSeries, recentTrades }) {
  const hasTrades = recentTrades?.length > 0;
  const fallbackBalance = Number(portfolioSeries?.[portfolioSeries.length - 1]?.value) || 0;
  const totalBalance = Number(stats?.totalBalance) || fallbackBalance;
  const winRate = Number(stats?.winRate) || 0;
  const activePositions = Number(stats?.activePositions) || 0;
  const todayPnl = typeof dailyPnl === "number" ? dailyPnl : 0;
  const todayPnlPct = typeof dailyPnlPercent === "number" ? dailyPnlPercent : 0;

  // Calculate overall performance percentage from portfolio series
  const overallPerformance = portfolioSeries && portfolioSeries.length > 1 
    ? ((portfolioSeries[portfolioSeries.length - 1].value - portfolioSeries[0].value) / portfolioSeries[0].value) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={cn(glassCard("p-6"))}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Here's your portfolio overview and recent activity</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Today's Date</div>
            <div className="text-lg font-semibold">{new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Main Portfolio Chart */}
      <div className={cn(glassCard("p-6"))}>
        <div className="mb-6 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Portfolio Performance</h3>
            <p className="text-sm text-muted-foreground">6-month simulated curve with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-lg border ${overallPerformance >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <span className={`text-xs font-medium ${overallPerformance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {overallPerformance >= 0 ? '+' : ''}{overallPerformance.toFixed(1)}%
              </span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="text-xs font-medium text-blue-400">AI Active</span>
            </div>
          </div>
        </div>
        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.14 245)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="oklch(0.72 0.14 245)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1e6 ? `₹${(v / 1e6).toFixed(1)}M` : `₹${(v / 1e3).toFixed(0)}k`
                }
              />
              <Tooltip
                {...chartTooltip}
                formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="oklch(0.72 0.14 245)"
                strokeWidth={2}
                fill="url(#pvFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cn(glassCard("p-4"))}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            ₹{totalBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground">Current portfolio value</div>
        </div>
        
        <div className={cn(glassCard("p-4"))}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Today's P&L</span>
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {todayPnl >= 0 ? "+" : "−"}₹{Math.abs(todayPnl).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
          <div className={`text-xs ${todayPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {todayPnlPct >= 0 ? "+" : ""}
            {todayPnlPct.toFixed(2)}% today
          </div>
        </div>
        
        <div className={cn(glassCard("p-4"))}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Win Rate</span>
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          </div>
          <div className="text-xl font-bold text-white mb-1">{winRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">
            {stats?.totalTrades ? `${Math.round(stats.totalTrades * winRate / 100)}/${stats.totalTrades} trades` : 'Closed trades'}
          </div>
        </div>
        
        <div className={cn(glassCard("p-4"))}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Positions</span>
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
          </div>
          <div className="text-xl font-bold text-white mb-1">{activePositions} Active</div>
          <div className="text-xs text-muted-foreground">Open holdings</div>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className={cn(glassCard("p-6"))}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Recent Trading Activity</h3>
          <button className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all trades →
          </button>
        </div>
        {hasTrades ? (
          <div className="overflow-x-auto rounded-xl ring-1 ring-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                    Symbol
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Side</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Quantity</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Price</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">
                    P&L
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.map((t) => (
                  <TableRow
                    key={t.id}
                    className="border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <TableCell className="font-mono text-xs font-medium">{t.symbol}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase",
                          t.side === "BUY"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        )}
                      >
                        {t.side}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.quantity || "100"}</TableCell>
                    <TableCell className="font-mono text-xs">₹{t.price?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-xs font-semibold tabular-nums",
                        t.pnl == null
                          ? "text-muted-foreground"
                          : t.pnl >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                      )}
                    >
                      {t.pnl == null
                        ? "—"
                        : `${t.pnl >= 0 ? "+" : ""}₹${Math.abs(t.pnl).toLocaleString("en-IN")}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No recent trades"
            description="Execute paper trades from the desk to populate this list."
            className="flex-1 border-dashed border-white/10 bg-transparent py-16 shadow-none"
          />
        )}
      </div>
    </div>
  );
}
