import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalyticsSummary, getTradeAnalysis } from "../api/analyticsApi";
import useAuthStore from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Analytics = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [tradeAnalysis, setTradeAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [summaryData, analysisData] = await Promise.all([
          getAnalyticsSummary(),
          getTradeAnalysis(),
        ]);
        setSummary(summaryData);
        setTradeAnalysis(analysisData);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <p className="text-muted-foreground text-sm">
          Portfolio metrics and per-symbol realized performance.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Portfolio value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums">
              ₹{summary?.total_portfolio_value?.toLocaleString("en-IN") || "0"}
            </p>
            <p
              className={
                (summary?.total_return || 0) >= 0 ? "text-emerald-600 text-sm dark:text-emerald-400" : "text-red-600 text-sm dark:text-red-400"
              }
            >
              {(summary?.total_return || 0) >= 0 ? "+" : ""}₹
              {summary?.total_return?.toLocaleString("en-IN") || "0"} (
              {summary?.total_return_percent?.toFixed(2) || 0}%)
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Realized P&amp;L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-lg font-semibold tabular-nums ${
                (summary?.total_realized_pnl || 0) >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {(summary?.total_realized_pnl || 0) >= 0 ? "+" : ""}₹
              {summary?.total_realized_pnl?.toLocaleString("en-IN") || "0"}
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Win rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary text-lg font-semibold tabular-nums">
              {summary?.win_rate?.toFixed(1) || 0}%
            </p>
            <p className="text-muted-foreground text-sm">
              {summary?.win_count || 0}W / {summary?.loss_count || 0}L
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold tabular-nums">{summary?.total_trades || 0}</p>
            <p className="text-muted-foreground text-sm">
              {summary?.total_buys || 0} buys / {summary?.total_sells || 0} sells
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trades">Trade analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border py-2">
                  <span className="text-muted-foreground">Profit factor</span>
                  <span className="font-medium tabular-nums">
                    {summary?.profit_factor?.toFixed(2) ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-2">
                  <span className="text-muted-foreground">Average win</span>
                  <span className="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                    +₹{summary?.average_win?.toLocaleString("en-IN") || "0"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-2">
                  <span className="text-muted-foreground">Average loss</span>
                  <span className="font-medium text-red-600 tabular-nums dark:text-red-400">
                    ₹{summary?.average_loss?.toLocaleString("en-IN") || "0"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-2">
                  <span className="text-muted-foreground">Cash</span>
                  <span className="font-medium tabular-nums">
                    ₹{summary?.cash_balance?.toLocaleString("en-IN") || "0"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Holdings value</span>
                  <span className="font-medium tabular-nums">
                    ₹{summary?.holdings_value?.toLocaleString("en-IN") || "0"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notable trades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary?.best_trade && (
                  <div className="border-emerald-500/30 bg-emerald-500/5 rounded-lg border p-4">
                    <p className="text-emerald-600 mb-1 text-xs font-medium uppercase dark:text-emerald-400">
                      Best
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{summary.best_trade.symbol}</span>
                      <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                        +₹{summary.best_trade.pnl?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
                {summary?.worst_trade && (
                  <div className="border-red-500/30 bg-red-500/5 rounded-lg border p-4">
                    <p className="text-red-600 mb-1 text-xs font-medium uppercase dark:text-red-400">
                      Worst
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{summary.worst_trade.symbol}</span>
                      <span className="font-semibold text-red-600 tabular-nums dark:text-red-400">
                        ₹{summary.worst_trade.pnl?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
                {!summary?.best_trade && !summary?.worst_trade && (
                  <p className="text-muted-foreground py-6 text-center text-sm">No completed trades yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                By symbol ({tradeAnalysis?.total_symbols_traded || 0} traded)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Buys</TableHead>
                    <TableHead className="text-right">Sells</TableHead>
                    <TableHead className="text-right">Buy value</TableHead>
                    <TableHead className="text-right">Sell value</TableHead>
                    <TableHead className="text-right">Realized P&amp;L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeAnalysis?.by_symbol?.map((s) => (
                    <TableRow
                      key={s.symbol}
                      className="cursor-pointer"
                      onClick={() => navigate(`/trade?symbol=${encodeURIComponent(s.symbol)}`)}
                    >
                      <TableCell className="font-medium">{s.symbol}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.total_buys}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.total_sells}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{s.total_buy_value?.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{s.total_sell_value?.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          s.realized_pnl >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {s.realized_pnl >= 0 ? "+" : ""}₹{s.realized_pnl?.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!tradeAnalysis?.by_symbol || tradeAnalysis.by_symbol.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                        No trades yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
