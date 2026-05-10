import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPortfolioValuation } from "../api/portfolioApi";
import { autoLoginDemo } from "../utils/autoLogin";
import useAuthStore from "../store/authStore";
import useLanguageStore from "../store/languageStore";
import useTradingStore from "../store/tradingStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Portfolio = ({ refresh }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousValue, setPreviousValue] = useState(null);
  const { isAuthenticated } = useAuthStore();
  const { translate } = useLanguageStore();
  const { setSymbol } = useTradingStore();
  const navigate = useNavigate();
  const pollingRef = useRef(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const loadPortfolio = async () => {
      setLoading(true);
      
      // Auto-login if not authenticated
      if (!isAuthenticated) {
        try {
          await autoLoginDemo();
        } catch (error) {
          console.error('Auto-login failed:', error);
          setLoading(false);
          return;
        }
      }
      
      try {
        const newData = await fetchPortfolioValuation();
        if (data && newData.total_portfolio_value) {
          setPreviousValue(data.total_portfolio_value);
        }
        setData(newData);
        setLoading(false);
      } catch (err) {
        console.error("Portfolio error:", err);
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [refresh, isAuthenticated]);

  // Live polling every 10s with visibility pause/resume
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAndSet = async () => {
      if (inFlightRef.current) return; // avoid overlapping calls
      inFlightRef.current = true;
      try {
        const newData = await fetchPortfolioValuation();
        setData((prev) => {
          if (prev && newData?.total_portfolio_value) {
            setPreviousValue(prev.total_portfolio_value);
          }
          return newData;
        });
      } catch (e) {
        // silent fail to avoid alert noise during polling
      } finally {
        inFlightRef.current = false;
      }
    };

    const start = () => {
      if (pollingRef.current) return;
      // first tick slight delay to not clash with initial load
      pollingRef.current = setInterval(fetchAndSet, 10000);
    };
    const stop = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        fetchAndSet(); // immediate refresh on return
        start();
      }
    };

    // start polling if tab visible
    if (!document.hidden) {
      start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [isAuthenticated]);

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6">{translate("loading")}</CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-destructive py-6">{translate("error")}</CardContent>
      </Card>
    );
  }

  const dailyPnL =
    typeof data.daily_portfolio_pnl === 'number'
      ? data.daily_portfolio_pnl
      : (previousValue ? data.total_portfolio_value - previousValue : 0);

  const totalUnrealizedPnL = data.holdings.reduce(
    (sum, h) => sum + (h.unrealized_pnl || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate("portfolio")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg border border-border p-3">
            <div className="text-muted-foreground mb-1 text-xs">{translate("cashBalance")}</div>
            <div className="font-semibold tabular-nums">
              ₹{data.cash_balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg border border-border p-3">
            <div className="text-muted-foreground mb-1 text-xs">{translate("totalValue")}</div>
            <div className="font-semibold tabular-nums">
              ₹{data.total_portfolio_value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {previousValue !== null ? (
          <div className="bg-muted/50 rounded-lg border border-border p-3">
            <div className="text-muted-foreground mb-1 text-xs">{translate("dailyPL")}</div>
            <div
              className={`text-lg font-semibold tabular-nums ${
                dailyPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {dailyPnL >= 0 ? "+" : ""}
              ₹{dailyPnL.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>
          </div>
        ) : null}

        {data.holdings.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <p>{translate("noHoldings")}</p>
            <p className="mt-2 text-sm">{translate("startTrading")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-muted-foreground py-2 text-left font-normal">{translate("symbol")}</th>
                  <th className="text-muted-foreground py-2 text-right font-normal">{translate("qty")}</th>
                  <th className="text-muted-foreground py-2 text-right font-normal">{translate("avgPrice")}</th>
                  <th className="text-muted-foreground py-2 text-right font-normal">{translate("ltp")}</th>
                  <th className="text-muted-foreground py-2 text-right font-normal">{translate("pl")}</th>
                </tr>
              </thead>
              <tbody>
                {data.holdings.map((h) => {
                  const pnlPercent =
                    ((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100;
                  return (
                    <tr
                      key={h.symbol}
                      onClick={() => {
                        setSymbol(h.symbol);
                        navigate(`/trade?symbol=${encodeURIComponent(h.symbol)}`);
                      }}
                      className="border-border hover:bg-muted/50 cursor-pointer border-b transition-colors"
                    >
                      <td className="py-3 font-semibold">{h.symbol}</td>
                      <td className="py-3 text-right tabular-nums">{h.quantity}</td>
                      <td className="py-3 text-right tabular-nums">₹{h.avg_buy_price.toFixed(2)}</td>
                      <td className="py-3 text-right tabular-nums">₹{h.current_price.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <div
                          className={`font-semibold tabular-nums ${
                            h.unrealized_pnl >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {h.unrealized_pnl >= 0 ? "+" : ""}
                          ₹{h.unrealized_pnl.toFixed(2)}
                        </div>
                        <div
                          className={`text-xs tabular-nums ${
                            pnlPercent >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {pnlPercent >= 0 ? "+" : ""}
                          {pnlPercent.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {data.holdings.length > 0 ? (
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={4} className="text-muted-foreground py-2 text-right">
                      Total unrealized P&amp;L:
                    </td>
                    <td className="py-2 text-right">
                      <div
                        className={`font-bold tabular-nums ${
                          totalUnrealizedPnL >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {totalUnrealizedPnL >= 0 ? "+" : ""}
                        ₹{totalUnrealizedPnL.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Portfolio;
