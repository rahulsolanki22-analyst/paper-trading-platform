import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "../../api/watchlistApi";
import useAuthStore from "../../store/authStore";
import useTradingStore from "../../store/tradingStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Watchlist = ({ currentSymbol }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { setSymbol } = useTradingStore();
  const navigate = useNavigate();

  const formatInr = (value) =>
    typeof value === "number" ? value.toLocaleString("en-IN") : "—";

  const formatUsd = (value) =>
    typeof value === "number"
      ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

  const loadWatchlist = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getWatchlist();
      setItems(data.watchlist || []);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, [isAuthenticated]);

  const handleAddCurrent = async () => {
    if (!currentSymbol) return;
    setAdding(true);
    try {
      await addToWatchlist(currentSymbol);
      await loadWatchlist();
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (symbol, e) => {
    e.stopPropagation();
    try {
      await removeFromWatchlist(symbol);
      setItems(items.filter((i) => i.symbol !== symbol));
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
    }
  };

  const handleSelect = (sym) => {
    setSymbol(sym);
    navigate(`/trade?symbol=${encodeURIComponent(sym)}`);
  };

  const isInWatchlist = items.some((i) => i.symbol === currentSymbol);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Watchlist</CardTitle>
        {currentSymbol && !isInWatchlist ? (
          <Button type="button" size="sm" disabled={adding} onClick={handleAddCurrent}>
            {adding ? "Adding…" : `+ ${currentSymbol}`}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground py-6 text-center text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            Empty watchlist. Add the active symbol with the button above.
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.symbol}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(item.symbol)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(item.symbol);
                  }
                }}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                  item.symbol === currentSymbol
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-muted/40 hover:bg-muted/70"
                }`}
              >
                <div>
                  <div className="font-mono font-semibold">{item.symbol}</div>
                  <div className="text-muted-foreground text-sm tabular-nums">
                    {item?.native_currency && item.native_currency !== "INR" ? (
                      <>
                        ₹{formatInr(item.current_price_inr)}{" "}
                        <span className="text-muted-foreground/80">
                          (${formatUsd(item.native_price)})
                        </span>
                      </>
                    ) : (
                      <>₹{formatInr(item.current_price_inr ?? item.current_price)}</>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleRemove(item.symbol, e)}
                  title="Remove"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Watchlist;
