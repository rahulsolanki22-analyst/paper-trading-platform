import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addMarketsStock, getMarketsStocks, removeMarketsStock, searchStocks } from "../api/marketsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMarketsStocks();
        setStocks(res.stocks || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setErrMsg("");
    setSelected(null);
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await searchStocks(query.trim());
        setSuggestions(Array.isArray(res) ? res : []);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const refresh = async () => {
    const res = await getMarketsStocks();
    setStocks(res.stocks || []);
  };

  const handleAdd = async () => {
    const symbol = (selected?.symbol || query || "").trim().toUpperCase();
    if (!symbol) return;
    setAdding(true);
    setErrMsg("");
    try {
      await addMarketsStock(symbol);
      setQuery("");
      setSuggestions([]);
      setSelected(null);
      await refresh();
    } catch (e) {
      setErrMsg(e?.response?.data?.detail || "Could not add symbol");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (symbol, e) => {
    e?.stopPropagation?.();
    setErrMsg("");
    try {
      await removeMarketsStock(symbol);
      setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
    } catch (e2) {
      setErrMsg(e2?.response?.data?.detail || "Could not remove symbol");
    }
  };

  const formatInr = (v) => (typeof v === "number" ? v.toLocaleString("en-IN") : "—");
  const formatUsd = (v) =>
    typeof v === "number"
      ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Markets</h1>
        <p className="text-muted-foreground text-sm">
          Select a symbol to open it in the trading desk.
        </p>
      </div>

      {/* Search / Add section (Markets page only) */}
      <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol (e.g. TSLA, RELIANCE.NS)…"
              className="h-11 rounded-xl bg-zinc-950/40"
            />

            {suggestions.length > 0 ? (
              <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 shadow-2xl">
                <div className="max-h-72 overflow-y-auto">
                  {suggestions.map((sug) => (
                    <button
                      key={sug.symbol}
                      type="button"
                      onClick={() => {
                        setSelected(sug);
                        setQuery(`${sug.symbol}`);
                        setSuggestions([]);
                      }}
                      className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-semibold">{sug.symbol}</div>
                        <div className="text-muted-foreground line-clamp-1 text-xs">{sug.name}</div>
                      </div>
                      <div className="text-muted-foreground shrink-0 text-xs">{sug.exchange || ""}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            className="h-11 rounded-xl"
            disabled={adding || !query.trim()}
            onClick={handleAdd}
          >
            {adding ? "Adding…" : "Add stock"}
          </Button>
        </div>

        {errMsg ? (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errMsg}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="text-muted-foreground col-span-full py-12 text-center text-sm">
            Loading markets…
          </div>
        ) : stocks.length === 0 ? (
          <div className="text-muted-foreground col-span-full py-12 text-center text-sm">
            No stocks added yet. Use the search box above to add symbols.
          </div>
        ) : (
          stocks.map((s) => (
          <Card
            key={s.symbol}
            className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:bg-muted/40 hover:shadow-lg"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/trade?symbol=${encodeURIComponent(s.symbol)}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/trade?symbol=${encodeURIComponent(s.symbol)}`);
              }
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="font-mono text-base">{s.symbol}</CardTitle>
                  <p className="text-muted-foreground line-clamp-1 text-xs">{s.name}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    s.change_pct >= 0
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400"
                  }
                >
                  {s.change_pct}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-lg font-semibold tabular-nums">
                  {s.native_currency && s.native_currency !== "INR" ? (
                    <>
                      ₹{formatInr(s.price_inr)}{" "}
                      <span className="text-muted-foreground text-sm">(${formatUsd(s.native_price)})</span>
                    </>
                  ) : (
                    <>₹{formatInr(s.price_inr)}</>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  title="Remove"
                  onClick={(e) => handleRemove(s.symbol, e)}
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Stocks;
