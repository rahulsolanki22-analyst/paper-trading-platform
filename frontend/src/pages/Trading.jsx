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
  Activity,
  Database,
  Zap,
  ShieldCheck,
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
  const { symbol, setSymbol } = useTradingStore();
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

      {/* Stock Search */}
      <div
        className="animate-fade-in-up relative z-50"
        style={fadeStyle(0.15)}
      >
        <StockSearch onSelect={setSymbol} />
      </div>

      {/* Stats Grid */}
      <div
        className="animate-fade-in-up grid grid-cols-1 gap-4 sm:grid-cols-3"
        style={fadeStyle(0.2)}
      >
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Selected Symbol
            </p>
          </div>
          <p className="font-mono text-2xl font-semibold text-black">{symbol}</p>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Execution Mode
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 border border-emerald-200">
            Paper Wallet Active
          </span>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Data Stream
            </p>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            Live Quotes (~10s auto-refresh)
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        className="animate-fade-in-up grid grid-cols-12 gap-4 lg:gap-5"
        style={fadeStyle(0.25)}
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
          <TradePanel symbol={symbol} onTrade={onTrade} />
          <PendingOrders />
          <Portfolio refresh={refresh} />
        </DashboardSidebar>
      </div>
    </div>
  );
};

export default Trading;
