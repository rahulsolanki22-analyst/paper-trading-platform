import { getAnalyticsSummary, getEquityCurve } from "@/api/analyticsApi";
import { fetchMe } from "@/api/authApi";
import { fetchPortfolioValuation } from "@/api/portfolioApi";
import { fetchStocks } from "@/api/stocksApi";
import { getTradeHistory } from "@/api/tradingApi";
import { getWatchlist } from "@/api/watchlistApi";

function initialsFromUser(username, email) {
  const u = (username || "").trim();
  if (u.length >= 2) return u.slice(0, 2).toUpperCase();
  const e = (email || "").trim();
  if (e.length >= 2) return e.slice(0, 2).toUpperCase();
  return "PT";
}

function formatChartDate(isoDate) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return String(isoDate).slice(0, 7);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return String(isoDate).slice(0, 7);
  }
}

function mapOrderToTradeRow(o) {
  const pnl =
    o.order_type === "SELL" && o.realized_pnl != null ? Number(o.realized_pnl) : null;
  return {
    id: String(o.id),
    symbol: o.symbol,
    name: o.symbol,
    side: o.order_type,
    price: Number(o.price),
    quantity: o.quantity,
    date: o.timestamp,
    pnl,
  };
}

function buildStockIndex(stocks) {
  const map = {};
  (stocks || []).forEach((s) => {
    if (s?.symbol) map[s.symbol] = s;
  });
  return map;
}

export async function fetchWatchlistMerged() {
  const [watchRes, stocks] = await Promise.all([
    getWatchlist().catch(() => ({ watchlist: [] })),
    fetchStocks().catch(() => []),
  ]);
  const stockMap = buildStockIndex(stocks);
  return (watchRes?.watchlist || []).map((w) => {
    const s = stockMap[w.symbol];
    return {
      symbol: w.symbol,
      name: s?.name || w.symbol,
      // Watchlist API now returns INR-converted price under `current_price_inr`
      price: Number(w.current_price_inr ?? w.current_price) || 0,
      changePct: s?.change_pct != null ? Number(s.change_pct) : 0,
    };
  });
}

/**
 * Loads profile dashboard data from backend APIs (parallel).
 */
export async function fetchProfileCore() {
  // Core data should be fast and not depend on external market-data calls.
  const [me, orders, equityRes] = await Promise.all([
    fetchMe().catch(() => null),
    getTradeHistory(200).catch(() => []),
    getEquityCurve(120).catch(() => ({ data: [] })),
  ]);

  let portfolioSeries = (equityRes?.data || []).map((p) => ({
    date: formatChartDate(p.date),
    value: Number(p.value) || 0,
    _rawDate: p.date,
  }));

  if (portfolioSeries.length === 0) {
    portfolioSeries = [{ date: "Now", value: 100000 }];
  } else if (portfolioSeries.length === 1) {
    portfolioSeries = [{ ...portfolioSeries[0], date: portfolioSeries[0].date || "Point" }];
  }

  const mappedOrders = (orders || []).map(mapOrderToTradeRow);
  const recentTrades = mappedOrders.slice(0, 8);
  const tradingHistory = mappedOrders;

  const user = {
    id: me?.id != null ? String(me.id) : "me",
    username: me?.username || "Trader",
    email: me?.email || "",
    accountType: "Free",
    avatarUrl: null,
    initials: initialsFromUser(me?.username, me?.email),
  };

  return {
    // Keep shape compatible with existing consumers
    stats: {
      totalBalance: 0,
      profitLoss: 0,
      profitLossPercent: 0,
      winRate: 0,
      totalTrades: mappedOrders.length,
      activePositions: 0,
    },
    portfolioSeries,
    recentTrades,
    tradingHistory,
    watchlist: [],
    user,
  };
}

export async function fetchProfileExtras() {
  // Extras may be slow because they can hit yfinance/market data.
  const [summary, valuation, watchRes, stocks] = await Promise.all([
    getAnalyticsSummary().catch(() => ({})),
    fetchPortfolioValuation().catch(() => ({})),
    getWatchlist().catch(() => ({ watchlist: [] })),
    fetchStocks().catch(() => []),
  ]);

  const holdings = valuation?.holdings || [];
  const activePositions = holdings.filter((h) => Number(h.quantity) > 0).length;

  const stats = {
    totalBalance: Number(summary.total_portfolio_value) || Number(valuation.total_portfolio_value) || 0,
    profitLoss: Number(summary.total_return) || 0,
    profitLossPercent: Number(summary.total_return_percent) || 0,
    winRate: Number(summary.win_rate) || 0,
    totalTrades: Number(summary.total_trades) || 0,
    activePositions,
  };

  const dailyPnl = typeof valuation?.daily_portfolio_pnl === "number" ? Number(valuation.daily_portfolio_pnl) : 0;
  const prevValue = stats.totalBalance - dailyPnl;
  const dailyPnlPercent = prevValue > 0 ? (dailyPnl / prevValue) * 100 : 0;

  const stockMap = buildStockIndex(stocks);
  const watchlist = (watchRes?.watchlist || []).map((w) => {
    const s = stockMap[w.symbol];
    return {
      symbol: w.symbol,
      name: s?.name || w.symbol,
      price: Number(w.current_price_inr ?? w.current_price) || 0,
      changePct: s?.change_pct != null ? Number(s.change_pct) : 0,
    };
  });

  return { stats, watchlist, dailyPnl, dailyPnlPercent };
}

export async function fetchProfileData() {
  // Backward-compatible: core first, then merge extras.
  const core = await fetchProfileCore();
  const extras = await fetchProfileExtras();
  return { ...core, ...extras };
}
