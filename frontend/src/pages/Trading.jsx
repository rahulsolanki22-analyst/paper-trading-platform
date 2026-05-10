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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="mx-auto max-w-[1800px] space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {translate("paperTrading")}
        </h1>
        <p className="text-muted-foreground text-sm">
          Charts, signals, and paper execution in one workspace.
        </p>
      </div>

      {tradingMode === "VIEWER" ? (
        <Card className="border-amber-500/35 bg-amber-500/5">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                {translate("viewerMode")}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {translate("viewerModeDesc")}
              </p>
            </div>
            <Button onClick={() => setTradingMode("PAPER")}>
              {translate("enablePaperTrading")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/35 bg-emerald-500/5">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                {translate("paperTradingMode")}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {translate("paperTradingModeDesc")}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setTradingMode("VIEWER")}>
              {translate("switchToViewerMode")}
            </Button>
          </CardContent>
        </Card>
      )}

      <StockSearch onSelect={setSymbol} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Symbol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary font-mono text-xl font-semibold">{symbol}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm">
              {tradingMode}
            </Badge>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Panels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {tradingMode === "PAPER" ? "Orders & portfolio" : "View only"}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Quotes ~10s refresh</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
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
            <Card>
              <CardContent className="text-muted-foreground py-8 text-center text-sm">
                {translate("enablePaperTrading")} — {translate("portfolio")}
              </CardContent>
            </Card>
          )}
        </DashboardSidebar>
      </div>
    </div>
  );
};

export default Trading;
