import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import useMarketsHubStore from "@/store/marketsHubStore";
import axios from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const _API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const WS_URL = _API.replace(/^http/, "ws") + "/api/markets/ws/markets-hub";

const TICKER_ITEMS = [
  { symbol: "ES=F", label: "S&P Futures" },
  { symbol: "YM=F", label: "Dow Futures" },
  { symbol: "NQ=F", label: "Nasdaq Futures" },
  { symbol: "RTY=F", label: "Russell 2000" },
  { symbol: "^VIX", label: "VIX" },
  { symbol: "GC=F", label: "Gold" },
  { symbol: "BTC-USD", label: "Bitcoin USD" },
  { symbol: "CL=F", label: "Crude Oil" },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatPrice(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  const digits = v >= 100 ? 2 : 4;
  return v.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(2, digits),
    maximumFractionDigits: digits,
  });
}

function formatPct(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function Sparkline({ points = [], stroke = "#22c55e", symbol = "" }) {
  const w = 120;
  const h = 28;
  const rawData = Array.isArray(points) ? points : [];
  // Use data or fallback smooth curve for visual consistency
  const data = rawData.length >= 2 ? rawData : [10, 12, 11, 14, 13, 16, 15, 18, 17, 19];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);

  const pointsArr = data.map((val, i) => {
    const x = i * step;
    const y = h - 3 - ((val - min) / span) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${pointsArr.join(" L ")}`;
  const areaD = `M 0,${h} L ${pointsArr.join(" L ")} L ${w},${h} Z`;
  const cleanId = String(symbol || "default").replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `sparkline-grad-${cleanId}`;

  return (
    <div className="h-[28px] w-full overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function MovementBadge({ changePct }) {
  const isUp = typeof changePct === "number" ? changePct >= 0 : Number(changePct) >= 0;
  const cls = isUp
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";

  return (
    <Badge variant="secondary" className={cn("border font-semibold", cls)}>
      {typeof changePct === "number" && Number.isFinite(changePct) ? formatPct(changePct) : "—"}
    </Badge>
  );
}

export default function MarketsHub() {
  const navigate = useNavigate();

  const {
    connection,
    indices,
    trending,
    topGainers,
    topLosers,
    news,
    featured,
    setConnectionStatus,
    setLastMessageAt,
    setTickerIndices,
    setNews,
    setFeatured,
    hydrateFromHttp,
  } = useMarketsHubStore();

  const [loading, setLoading] = useState(true);
  const [tickerBusy, setTickerBusy] = useState(true);

  // News topic search
  const [newsTopicInput, setNewsTopicInput] = useState("");
  const [activeNewsTopic, setActiveNewsTopic] = useState("");
  const [newsLoading, setNewsLoading] = useState(false);

  const handleNewsSearch = async (topic) => {
    const term = (topic || "").trim();
    setNewsLoading(true);
    try {
      const resp = await axios.get("/api/markets/news", {
        params: term ? { symbol: term } : {},
      });
      const articles = resp.data?.articles || resp.data || [];
      setNews(articles);
      setFeatured(articles[0] || null);
      setActiveNewsTopic(term);
    } catch (err) {
      console.error("Failed to search news:", err);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleClearNewsSearch = () => {
    setNewsTopicInput("");
    handleNewsSearch("");
  };

  // Quote lookup
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const searchAbortRef = useRef(null);

  const quoteLookupWrapRef = useRef(null);
  const [dropdownRect, setDropdownRect] = useState(null);

  // Watchlist preview

  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistItems, setWatchlistItems] = useState([]);

  // WS
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const goToTrade = (symbol) => {
    if (!symbol) return;
    navigate(`/trade?symbol=${encodeURIComponent(symbol)}`);
  };

  const getNewsOriginalLink = (item) => {
    return (
      item?.link ||
      item?.url ||
      item?.source_url ||
      item?.original_url ||
      item?.originalLink ||
      item?.originalUrl ||
      null
    );
  };

  const openNewsOriginalLink = (item) => {
    const url = getNewsOriginalLink(item);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // NOTE: featured/secondaryNews declarations below (existing duplicates) were removed by build fix.


  const indicesBySymbol = useMemo(() => {
    const map = new Map();
    (Array.isArray(indices) ? indices : []).forEach((it) => {
      map.set(String(it.symbol || ""), it);
    });
    return map;
  }, [indices]);

  const computeDropdownRect = () => {
    const el = quoteLookupWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  // ----- HTTP fallback fetch -----
  const fetchInitial = async () => {
    setLoading(true);
    try {
      const [idx, tr, gain, lose, n] = await Promise.all([
        axios.get("/api/markets/indices"),
        axios.get("/api/markets/trending"),
        axios.get("/api/markets/top-gainers"),
        axios.get("/api/markets/top-losers"),
        axios.get("/api/markets/news"),
      ]);

      hydrateFromHttp({
        indices: idx.data?.indices || idx.data?.data || idx.data || [],
        trending: tr.data?.trending || tr.data || [],
        topGainers: gain.data?.top_gainers || gain.data?.topGainers || [],
        topLosers: lose.data?.top_losers || lose.data?.topLosers || [],
        news: n.data?.articles || n.data || [],
      });

      const featuredItem = (n.data?.articles || [])[0] || null;
      setFeatured(featuredItem);
    } catch (e) {
      setConnectionStatus("error", e?.message || "Failed to load markets");
    } finally {
      setLoading(false);
      setTickerBusy(false);
    }
  };

  useEffect(() => {
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- WebSocket realtime updates -----
  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      setConnectionStatus("connecting");

      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setConnectionStatus("connected");
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg?.type === "ticker") {
              setLastMessageAt();
              const payload = msg?.data || {};
              const idx = payload?.indices || [];
              setTickerIndices(idx);
            }
          } catch {
            // ignore
          }
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setConnectionStatus("error", "WebSocket error");
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnectionStatus("disconnected");
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(connect, 3000);
        };
      } catch (e) {
        if (!isMounted) return;
        setConnectionStatus("error", e?.message || "WS connect failed");
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      isMounted = false;
      try {
        wsRef.current?.close?.();
      } catch {
        // ignore
      }
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Debounced quote lookup search -----
  useEffect(() => {
    setSearchErr("");
    if (!searchQ || searchQ.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    const t = setTimeout(async () => {
      try {
        if (searchAbortRef.current) searchAbortRef.current.abort?.();
        const abort = new AbortController();
        searchAbortRef.current = abort;

        const res = await axios.get(`/api/markets/search`, {
          params: { q: searchQ.trim() },
          signal: abort.signal,
        });

        setSearchResults(Array.isArray(res.data?.results) ? res.data.results : []);
      } catch (e) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        setSearchErr("Search failed");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [searchQ, setSearchErr]);

  useEffect(() => {
    if (!searchResults.length) return;
    computeDropdownRect();

    const onScroll = () => computeDropdownRect();
    const onResize = () => computeDropdownRect();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults.length]);

  // ----- Auto refresh news every 30s (HTTP) -----
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const resp = await axios.get(`/api/markets/news`, {
          params: activeNewsTopic ? { symbol: activeNewsTopic } : {},
        });
        const articles = resp.data?.articles || resp.data || [];
        setNews(Array.isArray(articles) ? articles : []);
      } catch {
        // ignore
      }
    }, 30000);

    return () => clearInterval(id);
  }, [setNews, activeNewsTopic]);


  useEffect(() => {
    refreshWatchlistPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddWatchlist = async (symbol) => {
    try {
      await axios.post(`/watchlist/add`, null, { params: { symbol } });
      await refreshWatchlistPreview();
    } catch {
      // ignore
    }
  };

  const handleRemoveWatchlist = async (symbol) => {
    try {
      await axios.delete(`/watchlist/${encodeURIComponent(symbol)}`);
      await refreshWatchlistPreview();
    } catch {
      // ignore
    }
  };

  const watchSymbols = useMemo(
    () => new Set((watchlistItems || []).map((w) => String(w.symbol || "").toUpperCase())),
    [watchlistItems]
  );

  const featuredNews = useMemo(() => featured, [featured]);
  const secondaryNews = useMemo(() => {
    const all = Array.isArray(news) ? news : [];
    return all.slice(1, 6);
  }, [news]);
  const liveNews = useMemo(() => {
    const all = Array.isArray(news) ? news : [];
    if (all.length > 6) {
      return all.slice(6, 40);
    }
    return all.slice(1, 40);
  }, [news]);

  const refreshWatchlistPreview = async () => {
    try {
      setWatchlistLoading(true);
      const resp = await axios.get("/watchlist/preview");
      const items = Array.isArray(resp.data?.items) ? resp.data.items : [];
      setWatchlistItems(items);
    } catch {
      setWatchlistItems([]);
    } finally {
      setWatchlistLoading(false);
    }
  };


  return (
    <div className="mx-auto max-w-7xl">
      {/* Top ticker bar */}
      <div className="sticky top-0 z-50 -mx-4 mb-4 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-x-auto px-4 py-2.5 scrollbar-none">
          {TICKER_ITEMS.map((item) => {
            const it = indicesBySymbol.get(item.symbol);
            const price = it?.native_price;
            const ch = it?.change_pct;
            const up = Number(ch) >= 0;
            const strokeColor = up ? "#10b981" : "#f43f5e";

            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => goToTrade(item.symbol)}
                className="group flex min-w-[200px] shrink-0 flex-col justify-between rounded-xl border border-border bg-card p-3 text-left transition-all hover:bg-muted/50 hover:border-border/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/20 shadow-sm"
              >
                {/* Header: Label & Movement Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {item.label}
                  </span>
                  <MovementBadge changePct={typeof ch === "number" ? ch : 0} />
                </div>

                {/* Price & Symbol Row */}
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "font-mono text-base font-bold tabular-nums tracking-tight transition-colors",
                      up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {typeof price === "number" ? formatPrice(price) : "—"}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {item.symbol}
                  </span>
                </div>

                {/* Sparkline Chart Area */}
                <div className="mt-2.5 w-full opacity-85 transition-opacity group-hover:opacity-100">
                  <Sparkline
                    points={it?.sparkline || []}
                    stroke={strokeColor}
                    symbol={item.symbol}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Page header + status row */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Markets Hub</h1>
          <p className="text-muted-foreground text-sm">Real-time quotes, movers, and watchlist prices.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-border bg-card px-3 py-2 sm:block">
            <div className="text-xs text-muted-foreground">{connection.status === "connected" ? "Live" : "Connecting"}</div>
          </div>
        </div>
      </div>

      {/* News Topic Search Bar */}
      <Card className="mb-5">
        <CardContent className="py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNewsSearch(newsTopicInput);
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Input
                value={newsTopicInput}
                onChange={(e) => setNewsTopicInput(e.target.value)}
                placeholder="Search news topic (e.g. gold, crude oil, stocks, bitcoin, tech)..."
                className="h-11 rounded-xl bg-background border-input text-foreground placeholder:text-muted-foreground"
              />
              {activeNewsTopic && (
                <button
                  type="button"
                  onClick={handleClearNewsSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={newsLoading}
                className="h-11 rounded-xl px-6 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 border border-white/10"
              >
                {newsLoading ? "Searching..." : "Search Topic"}
              </Button>
              {activeNewsTopic && (
                <Badge variant="secondary" className="flex items-center gap-1.5 h-11 px-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active: {activeNewsTopic}
                </Badge>
              )}
            </div>
          </form>
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            <span className="text-xs text-muted-foreground">Popular topics:</span>
            {["gold", "crude oil", "stocks", "bitcoin", "tech", "fed"].map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  setNewsTopicInput(topic);
                  handleNewsSearch(topic);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs border transition-all",
                  activeNewsTopic.toLowerCase() === topic.toLowerCase()
                    ? "border-black/30 bg-black/10 text-black dark:border-white/40 dark:bg-white/20 dark:text-white font-medium"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-white"
                )}
              >
                {topic.charAt(0).toUpperCase() + topic.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3-column responsive layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Top News</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : featuredNews ? (
                <>
                  {(featuredNews.image || featuredNews.urlToImage || featuredNews.thumbnail || featuredNews.image_url) ? (
                    <div className="relative overflow-hidden rounded-xl border border-white/10 mb-3 bg-black/20">
                      <img
                        src={featuredNews.image || featuredNews.urlToImage || featuredNews.thumbnail || featuredNews.image_url}
                        alt={featuredNews.title || "News headline"}
                        className="aspect-[16/9] w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null}

                  <div>
                    <div className="text-lg font-semibold leading-snug">{featuredNews.title || "Market headline"}</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {featuredNews.source || "News"} •{" "}
                      {featuredNews.published_at ? new Date(featuredNews.published_at * 1000).toLocaleString() : "Just now"}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground line-clamp-3">{featuredNews.summary || ""}</div>

                    {featuredNews.link ? (
                      <Button variant="secondary" className="mt-3" onClick={() => window.open(featuredNews.link, "_blank", "noopener,noreferrer")}>
                        Open
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">No news available.</div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {secondaryNews.length ? (
              secondaryNews.map((n, idx) => (
                <button
                  key={`${n.title}-${idx}`}
                  type="button"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:bg-white/10"
                  onClick={() => openNewsOriginalLink(n)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium line-clamp-2">{n.title || ""}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {(n.source || "News").trim()} • {n.published_at ? new Date(n.published_at * 1000).toLocaleTimeString() : ""}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {n.symbol ? (
                        <span className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs font-mono text-muted-foreground">{n.symbol}</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">No secondary news.</div>
            )}
          </div>
        </div>

        {/* CENTER */}
        <div className="space-y-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Live News Feed</CardTitle>
              <div className="text-xs text-muted-foreground">Auto refresh • 30s</div>
            </CardHeader>

            <CardContent>
              <div className="max-h-[520px] overflow-y-auto pr-2">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                        <Skeleton className="h-6 w-24" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="mt-2 h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : liveNews?.length ? (
                  <div className="space-y-2">
                    {liveNews.map((n, idx) => (
                      <button
                        key={`${n.title}-${idx}`}
                        type="button"
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:bg-white/10"
                        onClick={() => openNewsOriginalLink(n)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium line-clamp-2">{n.title || ""}</div>
                            <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                              {(n.source || "News").trim()} • {n.published_at ? new Date(n.published_at * 1000).toLocaleTimeString() : ""}
                            </div>
                            {n.summary ? <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{n.summary}</div> : null}
                          </div>

                          {n.symbol ? (
                            <div className="shrink-0">
                              <span className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs font-mono text-muted-foreground">{n.symbol}</span>
                            </div>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">No live news right now.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">My Watchlist</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {watchlistLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : watchlistItems.length ? (
                watchlistItems.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:bg-white/10"
                    onClick={() => goToTrade(item.symbol)}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm">{item.symbol}</div>
                      <div className="text-xs text-muted-foreground">{item.name || ""}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MovementBadge changePct={item.change_pct} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWatchlist(item.symbol);
                        }}
                        className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-white/10"
                      >
                        ✕
                      </button>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
                  No items in watchlist
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Quick Search</CardTitle>
            </CardHeader>

            <CardContent>
              <div ref={quoteLookupWrapRef} className="relative">
                <Input
                  placeholder="Search stocks or cryptos..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="border-white/20 bg-white/5 text-foreground placeholder:text-muted-foreground"
                />

                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Loading...
                  </div>
                )}

                {searchErr && (
                  <div className="mt-2 text-xs text-red-400">{searchErr}</div>
                )}

                {searchResults.length > 0 &&
                  dropdownRect &&
                  createPortal(
                    <div
                      style={{
                        position: "fixed",
                        top: `${dropdownRect.top}px`,
                        left: `${dropdownRect.left}px`,
                        width: `${dropdownRect.width}px`,
                        maxHeight: "300px",
                        zIndex: 1000,
                      }}
                      className="overflow-y-auto rounded-xl border border-white/20 bg-background shadow-lg"
                    >
                      {searchResults.map((r, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full border-b border-white/10 bg-white/5 px-4 py-3 text-left transition-all last:border-0 hover:bg-white/10"
                          onClick={() => {
                            goToTrade(r.symbol);
                            setSearchQ("");
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-mono text-sm">{r.symbol}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{r.name}</div>
                            </div>
                            {watchSymbols.has(String(r.symbol).toUpperCase()) ? (
                              <span className="text-xs text-emerald-400">★</span>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Top Gainers</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {(topGainers || []).slice(0, 3).map((m) => {
                const up = Number(m.change_pct) >= 0;
                return (
                  <button
                    key={m.symbol}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:bg-white/10"
                    onClick={() => goToTrade(m.symbol)}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm">{m.symbol}</div>
                      <div className="text-xs text-muted-foreground">{m.name || ""}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("text-sm font-semibold tabular-nums", up ? "text-emerald-300" : "text-red-300")}>{formatPrice(m.native_price)}</div>
                      <MovementBadge changePct={m.change_pct} />
                    </div>
                  </button>
                );
              })}
              {!((topGainers || []).length) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No gainers available</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Top Losers</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {(topLosers || []).slice(0, 3).map((m) => {
                const up = Number(m.change_pct) >= 0;
                return (
                  <button
                    key={m.symbol}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:bg-white/10"
                    onClick={() => goToTrade(m.symbol)}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm">{m.symbol}</div>
                      <div className="text-xs text-muted-foreground">{m.name || ""}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("text-sm font-semibold tabular-nums", up ? "text-emerald-300" : "text-red-300")}>{formatPrice(m.native_price)}</div>
                      <MovementBadge changePct={m.change_pct} />
                    </div>
                  </button>
                );
              })}
              {!((topLosers || []).length) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">No losers available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}