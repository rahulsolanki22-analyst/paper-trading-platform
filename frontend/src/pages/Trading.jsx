import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import TradingChart from "../components/Chart/TradingChart";
import TradePanel from "../components/TradePanel";
import Portfolio from "../components/Portfolio";
import StockSearch from "../components/StockSearch";
import StockNews from "../components/News/StockNews";
import MLSignalPanel from "../components/MLSignalPanel";
import Indicators from "../components/Chart/Indicators";
import LanguageSelector from "../components/LanguageSelector";
import Watchlist from "../components/Watchlist/Watchlist";
import AlertsPanel from "../components/Watchlist/AlertsPanel";
import PendingOrders from "../components/PendingOrders";
import useTradingStore from "../store/tradingStore";
import useAuthStore from "../store/authStore";
import useLanguageStore from "../store/languageStore";

const Trading = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { translate } = useLanguageStore();
  const {
    symbol,
    setSymbol,
    tradingMode,
    setTradingMode,
  } = useTradingStore();
  const { user, logout } = useAuthStore();
  const [refresh, setRefresh] = React.useState(0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Read symbol from URL on mount
  useEffect(() => {
    const urlSymbol = searchParams.get("symbol");
    if (urlSymbol) {
      setSymbol(urlSymbol);
    }
  }, [searchParams, setSymbol]);

  const onTrade = () => setRefresh((r) => r + 1);

  return (
    <div className="p-4 bg-slate-950 min-h-screen text-slate-200">
      {/* Header with User Info */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-200">{translate('paperTrading')}</h1>
          {user && (
            <span className="text-slate-400 text-sm">
              {translate('welcome')}, <span className="text-slate-200 font-semibold">{user.username}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={() => navigate("/analytics")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
          >
            📊 Analytics
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-slate-300 hover:text-slate-200 text-sm"
          >
            {translate('home')}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
          >
            {translate('logout')}
          </button>
        </div>
      </div>

      {/* Trading Mode Banner */}
      <div className="mb-4">
        {tradingMode === "VIEWER" ? (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-yellow-200 font-semibold">{translate('viewerMode')}</p>
              <p className="text-yellow-300/70 text-sm mt-1">
                {translate('viewerModeDesc')}
              </p>
            </div>
            <button
              onClick={() => setTradingMode("PAPER")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {translate('enablePaperTrading')}
            </button>
          </div>
        ) : (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-green-200 font-semibold">{translate('paperTradingMode')}</p>
              <p className="text-green-300/70 text-sm mt-1">
                {translate('paperTradingModeDesc')}
              </p>
            </div>
            <button
              onClick={() => setTradingMode("VIEWER")}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {translate('switchToViewerMode')}
            </button>
          </div>
        )}
      </div>

      {/* Stock Search */}
      <div className="mb-4">
        <StockSearch onSelect={setSymbol} />
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column - Chart and News */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Chart */}
          <TradingChart symbol={symbol} />


          {/* News */}
          <StockNews symbol={symbol} />
        </div>

        {/* Right Column - Trading Tools */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Watchlist */}
          <Watchlist currentSymbol={symbol} />

          {/* Price Alerts */}
          <AlertsPanel currentSymbol={symbol} />

          {/* ML Signal Panel */}
          <MLSignalPanel symbol={symbol} />

          {/* Indicators Panel */}
          <Indicators />

          {/* Paper Trading Section - Only visible in PAPER mode */}
          {tradingMode === "PAPER" && (
            <>
              <TradePanel symbol={symbol} onTrade={onTrade} />
              <PendingOrders />
              <Portfolio refresh={refresh} />
            </>
          )}

          {/* Viewer Mode Message */}
          {tradingMode === "VIEWER" && (
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <p className="text-slate-400 text-sm text-center">
                {translate('enablePaperTrading')} {translate('portfolio')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trading;

