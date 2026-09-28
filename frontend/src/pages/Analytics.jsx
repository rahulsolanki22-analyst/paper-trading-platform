import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalyticsSummary, getTradeAnalysis, getEquityCurve } from "../api/analyticsApi";
import { fetchPortfolioValuation } from "../api/portfolioApi";
import { getDiaryAnalytics } from "../api/diaryApi";
import useAuthStore from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Award, Frown, Brain, PieChart as PieIcon, Activity } from "lucide-react";

const formatCurrency = (val, showPlus = false) => {
  if (val === undefined || val === null) return "₹0";
  const absVal = Math.abs(val).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (val < 0) {
    return `-₹${absVal}`;
  }
  return `${showPlus ? "+" : ""}₹${absVal}`;
};

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

const Analytics = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [valuation, setValuation] = useState(null);
  const [summary, setSummary] = useState(null);
  const [equityData, setEquityData] = useState([]);
  const [tradeAnalysis, setTradeAnalysis] = useState(null);
  const [diaryAnalytics, setDiaryAnalytics] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("portfolio");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [valData, sumData, eqData, analData, diaryData] = await Promise.all([
          fetchPortfolioValuation().catch(() => null),
          getAnalyticsSummary().catch(() => null),
          getEquityCurve().catch(() => ({ data: [] })),
          getTradeAnalysis().catch(() => null),
          getDiaryAnalytics().catch(() => null),
        ]);
        
        setValuation(valData);
        setSummary(sumData);
        setEquityData(eqData?.data || []);
        setTradeAnalysis(analData);
        setDiaryAnalytics(diaryData);
      } catch (err) {
        console.error("Failed to load portfolio/analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <span>Loading portfolio dashboard...</span>
      </div>
    );
  }

  // Calculate allocation weights for the pie chart
  const pieData = (valuation?.holdings || [])
    .filter((h) => h.quantity > 0)
    .map((h) => ({
      name: h.symbol,
      value: h.current_value,
    }));

  const totalHoldingsValue = valuation?.holdings?.reduce((sum, h) => sum + (h.current_value || 0), 0) || 0;
  
  // Calculate total portfolio return (Invested + Cash vs Initial ₹100,000)
  const initialCapital = 100000.0;
  const currentTotalValue = (valuation?.cash_balance || 0) + totalHoldingsValue;
  const totalReturnVal = currentTotalValue - initialCapital;
  const totalReturnPct = (totalReturnVal / initialCapital) * 100;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Portfolio &amp; Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Live asset tracking, allocation metrics, and performance analytics.
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-fit">
          <TabsList>
            <TabsTrigger value="portfolio" className="flex items-center gap-1.5"><PieIcon className="w-4 h-4" />Portfolio</TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1.5"><Activity className="w-4 h-4" />Performance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "portfolio" ? (
        <div className="space-y-6">
          {/* Portfolio Metric Row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Total Portfolio Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatCurrency(currentTotalValue)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`flex items-center text-xs font-semibold ${totalReturnVal >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    <TrendingUp className={`w-3.5 h-3.5 mr-0.5 ${totalReturnVal < 0 ? "rotate-180" : ""}`} />
                    {formatCurrency(totalReturnVal, true)} ({totalReturnPct.toFixed(2)}%)
                  </span>
                  <span className="text-xs text-muted-foreground">All-time</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Holdings Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatCurrency(totalHoldingsValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Across {valuation?.holdings?.filter(h => h.quantity > 0).length || 0} active assets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Cash Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatCurrency(valuation?.cash_balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Available buying power
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Today's Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold tabular-nums ${(valuation?.daily_portfolio_pnl || 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(valuation?.daily_portfolio_pnl, true)}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Based on live daily stock returns
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Visualizers Row (Line Chart + Donut Allocation Chart) */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 columns: Equity Curve */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Equity Growth Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {equityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          stroke="#71717a"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="#71717a"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          domain={["dataMin - 5000", "dataMax + 5000"]}
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "12px",
                            color: "var(--card-foreground)",
                            fontSize: "12px",
                          }}
                          formatter={(value) => [formatCurrency(value), "Portfolio Value"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorVal)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Not enough historical snapshots to draw equity curve.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right 1 column: Asset Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[200px] w-full relative flex items-center justify-center">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "12px",
                            color: "var(--card-foreground)",
                            fontSize: "12px",
                          }}
                          formatter={(value) => [
                            `${((value / totalHoldingsValue) * 100).toFixed(1)}%`,
                            formatCurrency(value),
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted-foreground text-sm">No assets owned.</div>
                  )}
                  {pieData.length > 0 && (
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Invested</span>
                      <span className="text-lg font-bold mt-0.5 text-foreground">{formatCurrency(totalHoldingsValue)}</span>
                    </div>
                  )}
                </div>
                
                {/* Custom Legends */}
                {pieData.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-3 text-xs w-full max-h-[80px] overflow-y-auto pr-1">
                    {pieData.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-mono font-medium text-foreground">{item.name}</span>
                        <span className="text-muted-foreground">({((item.value / totalHoldingsValue) * 100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Current Live Holdings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Current Holdings</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-4 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Symbol</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">LTP</TableHead>
                    <TableHead className="text-right">Invested Value</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right pr-6">P&amp;L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuation?.holdings?.filter((h) => h.quantity > 0).map((h) => {
                    const investedVal = h.avg_buy_price * h.quantity;
                    const pnlPct = ((h.current_value - investedVal) / investedVal) * 100;
                    return (
                      <TableRow
                        key={h.symbol}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/trade?symbol=${encodeURIComponent(h.symbol)}`)}
                      >
                        <TableCell className="font-semibold pl-6 text-foreground">{h.symbol}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-foreground">{h.quantity}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-foreground">{formatCurrency(h.avg_buy_price)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-foreground">{formatCurrency(h.current_price)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-foreground">{formatCurrency(investedVal)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-foreground">{formatCurrency(h.current_value)}</TableCell>
                        <TableCell className={`text-right font-semibold pr-6 tabular-nums ${h.unrealized_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          <div className="flex flex-col items-end">
                            <span>{formatCurrency(h.unrealized_pnl, true)}</span>
                            <span className="text-xs font-normal">
                              {h.unrealized_pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!valuation?.holdings || valuation.holdings.filter((h) => h.quantity > 0).length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground py-12 text-center text-sm">
                        No active holdings in portfolio. Search and buy assets on the trade page!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Tab 2: Performance statistics */
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {summary?.win_rate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.win_count || 0} Wins / {summary?.loss_count || 0} Losses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Profit Factor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {summary?.profit_factor !== null && summary?.profit_factor !== undefined
                    ? summary.profit_factor.toFixed(2)
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Gross Profits vs. Gross Losses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Realized P&amp;L
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold tabular-nums ${(summary?.total_realized_pnl || 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(summary?.total_realized_pnl, true)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed transaction returns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Total Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-foreground">{summary?.total_trades || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.total_buys || 0} Buy orders / {summary?.total_sells || 0} Sell orders
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left 2 Columns: Metrics & Psychological Insights */}
            <div className="md:col-span-2 space-y-6">
              {/* Detailed metrics list */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Detailed Trading Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border py-2">
                    <span className="text-muted-foreground">Average Realized Profit</span>
                    <span className="font-semibold text-emerald-500 tabular-nums">
                      {formatCurrency(summary?.average_win, true)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border py-2">
                    <span className="text-muted-foreground">Average Realized Loss</span>
                    <span className="font-semibold text-red-500 tabular-nums">
                      {formatCurrency(summary?.average_loss)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border py-2">
                    <span className="text-muted-foreground">Average Holding Duration</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {diaryAnalytics?.average_holding_time_mins
                        ? `${(diaryAnalytics.average_holding_time_mins / 60).toFixed(1)} hours`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Most Common Emotion</span>
                    <span className="font-semibold text-foreground">
                      {diaryAnalytics?.most_common_emotion ? (
                        <Badge variant="secondary" className="border border-border bg-muted text-foreground">
                          <Brain className="w-3.5 h-3.5 mr-1" />
                          {diaryAnalytics.most_common_emotion}
                        </Badge>
                      ) : (
                        "No logs"
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Psychological Insights */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <CardTitle className="text-base font-semibold text-foreground">Behavioral Insights</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  {diaryAnalytics ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase font-semibold">FOMO Trades</span>
                          <p className="text-2xl font-bold mt-1 text-yellow-600">{diaryAnalytics.fomo_trade_count}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {diaryAnalytics.fomo_trade_count > 2 
                            ? "Caution: Multiple trades were marked with FOMO. Consider waiting for support retests."
                            : "Excellent discipline. You are avoiding emotional chasing."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase font-semibold">Average Trade Profit</span>
                          <p className={`text-2xl font-bold mt-1 ${diaryAnalytics.average_profit >= Math.abs(diaryAnalytics.average_loss) ? "text-emerald-500" : "text-red-500"}`}>
                            {formatCurrency(diaryAnalytics.average_profit, true)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Compared to average loss of {formatCurrency(diaryAnalytics.average_loss)}.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">Log trades in your diary to populate emotional analytics.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Notable Trades */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Notable Trades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary?.best_trade && (
                  <div className="border-emerald-500/20 bg-emerald-500/5 rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 blur-xl"></div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider">
                        Best Trade
                      </span>
                    </div>
                    <div className="flex items-end justify-between mt-1">
                      <div className="min-w-0">
                        <p className="text-lg font-bold font-mono truncate text-foreground">{summary.best_trade.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {summary.best_trade.date ? new Date(summary.best_trade.date).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-emerald-500 tabular-nums">
                        {formatCurrency(summary.best_trade.pnl, true)}
                      </span>
                    </div>
                  </div>
                )}
                {summary?.worst_trade && (
                  <div className="border-red-500/20 bg-red-500/5 rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-full translate-x-8 -translate-y-8 blur-xl"></div>
                    <div className="flex items-center gap-1.5">
                      <Frown className="w-4 h-4 text-red-500" />
                      <span className="text-red-500 text-xs font-semibold uppercase tracking-wider">
                        Worst Trade
                      </span>
                    </div>
                    <div className="flex items-end justify-between mt-1">
                      <div className="min-w-0">
                        <p className="text-lg font-bold font-mono truncate text-foreground">{summary.worst_trade.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {summary.worst_trade.date ? new Date(summary.worst_trade.date).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-red-500 tabular-nums">
                        {formatCurrency(summary.worst_trade.pnl)}
                      </span>
                    </div>
                  </div>
                )}
                {!summary?.best_trade && !summary?.worst_trade && (
                  <div className="py-20 text-center text-muted-foreground text-sm">
                    No completed trades logged yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Historical Symbols Traded list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Symbol Analysis ({tradeAnalysis?.total_symbols_traded || 0} traded)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-4 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Symbol</TableHead>
                    <TableHead className="text-right">Buys</TableHead>
                    <TableHead className="text-right">Sells</TableHead>
                    <TableHead className="text-right">Total Invested</TableHead>
                    <TableHead className="text-right">Total Sold</TableHead>
                    <TableHead className="text-right pr-6">Realized P&amp;L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeAnalysis?.by_symbol?.map((s) => (
                    <TableRow
                      key={s.symbol}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/trade?symbol=${encodeURIComponent(s.symbol)}`)}
                    >
                      <TableCell className="font-semibold pl-6 text-foreground">{s.symbol}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-foreground">{s.total_buys}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-foreground">{s.total_sells}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-foreground">{formatCurrency(s.total_buy_value)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-foreground">{formatCurrency(s.total_sell_value)}</TableCell>
                      <TableCell className={`text-right font-semibold pr-6 tabular-nums ${s.realized_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {formatCurrency(s.realized_pnl, true)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!tradeAnalysis?.by_symbol || tradeAnalysis.by_symbol.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-12 text-center text-sm">
                        No trade history recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;
