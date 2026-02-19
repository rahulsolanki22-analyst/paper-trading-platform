import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPortfolioValuation } from "../api/portfolioApi";
import { autoLoginDemo } from "../utils/autoLogin";
import useAuthStore from "../store/authStore";
import useLanguageStore from "../store/languageStore";
import useTradingStore from "../store/tradingStore";

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
      <div className="bg-slate-900 p-4 rounded border border-slate-700">
        <div className="text-slate-400">{translate('loading')}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-900 p-4 rounded border border-slate-700">
        <div className="text-red-400">{translate('error')}</div>
      </div>
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
    <div className="bg-slate-900 p-4 rounded border border-slate-700">
      <h3 className="text-slate-200 text-lg font-semibold mb-4">{translate('portfolio')}</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800 p-3 rounded">
          <div className="text-slate-400 text-xs mb-1">{translate('cashBalance')}</div>
          <div className="text-slate-200 font-semibold">
            ₹{data.cash_balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-slate-800 p-3 rounded">
          <div className="text-slate-400 text-xs mb-1">{translate('totalValue')}</div>
          <div className="text-slate-200 font-semibold">
            ₹{data.total_portfolio_value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Daily P&L */}
      {previousValue !== null && (
        <div className="mb-4 p-3 bg-slate-800 rounded">
          <div className="text-slate-400 text-xs mb-1">{translate('dailyPL')}</div>
          <div
            className={`text-lg font-semibold ${
              dailyPnL >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {dailyPnL >= 0 ? "+" : ""}
            ₹{dailyPnL.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        </div>
      )}

      {/* Holdings Table */}
      {data.holdings.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>{translate('noHoldings')}</p>
          <p className="text-sm mt-2">{translate('startTrading')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 text-slate-400 font-normal">{translate('symbol')}</th>
                <th className="text-right py-2 text-slate-400 font-normal">{translate('qty')}</th>
                <th className="text-right py-2 text-slate-400 font-normal">{translate('avgPrice')}</th>
                <th className="text-right py-2 text-slate-400 font-normal">{translate('ltp')}</th>
                <th className="text-right py-2 text-slate-400 font-normal">{translate('pl')}</th>
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
                    className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                  >
                    <td className="py-3 text-slate-200 font-semibold">
                      {h.symbol}
                    </td>
                    <td className="py-3 text-right text-slate-300">
                      {h.quantity}
                    </td>
                    <td className="py-3 text-right text-slate-300">
                      ₹{h.avg_buy_price.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-slate-300">
                      ₹{h.current_price.toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <div
                        className={`font-semibold ${
                          h.unrealized_pnl >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {h.unrealized_pnl >= 0 ? "+" : ""}
                        ₹{h.unrealized_pnl.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs ${
                          pnlPercent >= 0 ? "text-green-400" : "text-red-400"
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
            {data.holdings.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700">
                  <td colSpan="4" className="py-2 text-slate-400 text-right">
                    Total Unrealized P&L:
                  </td>
                  <td className="py-2 text-right">
                    <div
                      className={`font-bold ${
                        totalUnrealizedPnL >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {totalUnrealizedPnL >= 0 ? "+" : ""}
                      ₹{totalUnrealizedPnL.toFixed(2)}
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
