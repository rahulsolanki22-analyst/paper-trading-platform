import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import TradingChart from "../components/Chart/TradingChart";
import TradePanel from "../components/TradePanel";
import Portfolio from "../components/Portfolio";
import StockSearch from "../components/StockSearch";
import StockNews from "../components/News/StockNews";
import MLSignalPanel from "../components/MLSignalPanel";
import Indicators from "../components/Chart/Indicators";
import Watchlist from "../components/Watchlist/Watchlist";
import AlertsPanel from "../components/Watchlist/AlertsPanel";
import PendingOrders from "../components/PendingOrders";
import DashboardSidebar from "../components/ui/DashboardSidebar";
import useTradingStore from "../store/tradingStore";
import useLanguageStore from "../store/languageStore";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Activity,
  Layers,
  Monitor,
  Database,
  Zap,
} from "lucide-react";

function fadeStyle(delay) {
  return {
    opacity: 0,
    animationDelay: `${delay}s`,
  };
}

const Trading = () => {
  const [searchParams] = useSearchParams();
  const { translate } = useLanguageStore();
  const { symbol, setSymbol, tradingMode, setTradingMode } = useTradingStore();
  const [refresh, setRefresh] = React.useState(0);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  useEffect(() => {
    const urlSymbol = searchParams.get("symbol");
    if (urlSymbol) {
      setSymbol(urlSymbol);
    }
  }, [searchParams, setSymbol]);

  const onTrade = () => setRefresh((r) => r + 1);

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      {/* Page Header */}
      <div
        className="animate-fade-in-up"
        style={fadeStyle(0.1)}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black">
              {translate("paperTrading")}
            </h1>
            <p className="text-sm text-gray-500">
              Charts, signals, and paper execution in one workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Banner */}
      <div
        className="animate-fade-in-up"
        style={fadeStyle(0.15)}
      >
        {tradingMode === "VIEWER" ? (
          <div className="flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-amber-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-md transition-all duration-300">
            <div>
              <p className="font-semibold text-amber-700 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {translate("viewerMode")}
              </p>
              <p className="mt-1 text-sm text-amber-600/80">
                {translate("viewerModeDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTradingMode("PAPER")}
              className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
            >
              {translate("enablePaperTrading")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between shadow-sm hover:shadow-md transition-all duration-300">
            <div>
              <p className="font-semibold text-emerald-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {translate("paperTradingMode")}
              </p>
              <p className="mt-1 text-sm text-emerald-600/80">
                {translate("paperTradingModeDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTradingMode("VIEWER")}
              className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow"
            >
              {translate("switchToViewerMode")}
            </button>
          </div>
        )}
      </div>

      {/* Stock Search */}
      <div
        className="animate-fade-in-up"
        style={fadeStyle(0.2)}
      >
        <StockSearch onSelect={setSymbol} />
      </div>

      {/* Stats Grid */}
      <div
        className="animate-fade-in-up grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        style={fadeStyle(0.25)}
      >
          <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Symbol
            </p>
          </div>
          <p className="font-mono text-2xl font-semibold text-black">{symbol}</p>
        </div>

          <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Mode
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            tradingMode === "PAPER"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}>
            {tradingMode}
          </span>
        </div>

          <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Panels
            </p>
          </div>
          <p className="font-medium text-black">
            {tradingMode === "PAPER" ? "Orders & portfolio" : "View only"}
          </p>
        </div>

          <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Data
            </p>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            Quotes ~10s refresh
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        className="animate-fade-in-up grid grid-cols-12 gap-4 lg:gap-5"
        style={fadeStyle(0.3)}
      >
        <div className="col-span-12 space-y-4 xl:col-span-8">
          <TradingChart symbol={symbol} />
          <StockNews symbol={symbol} />
        </div>

        <DashboardSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((s) => !s)}>
          <Watchlist currentSymbol={symbol} />
          <AlertsPanel currentSymbol={symbol} />
          <MLSignalPanel symbol={symbol} />
          <Indicators />

          {tradingMode === "PAPER" && (
            <>
              <TradePanel symbol={symbol} onTrade={onTrade} />
              <PendingOrders />
              <Portfolio refresh={refresh} />
            </>
          )}

          {tradingMode === "VIEWER" && (
            <div className="rounded-[24px] border border-gray-100 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <Eye className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">
                {translate("enablePaperTrading")} — {translate("portfolio")}
              </p>
            </div>
          )}
        </DashboardSidebar>
      </div>
    </div>
  );
};

export default Trading;
