import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { fetchCandles, fetchIndicators } from "../../api/marketApi";
import useTradingStore from "../../store/tradingStore";
import useThemeStore from "../../store/themeStore";
import CompanyDetails from "../CompanyDetails";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Camera, MousePointer, TrendingUp, Minus, Trash2, PenTool, Sun, Moon } from "lucide-react";

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
];

const TradingChart = ({ symbol = "AAPL" }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRefs = useRef({});
  const { timeframe, setTimeframe, indicators } = useTradingStore();
  const { currentTheme } = useThemeStore();
  // Minimal OHLC display (updates on hover, falls back to latest candle)
  const [hoverOhlc, setHoverOhlc] = useState(null);
  const [lastOhlc, setLastOhlc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [takingScreenshot, setTakingScreenshot] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [chartThemeMode, setChartThemeMode] = useState(currentTheme);

  useEffect(() => {
    setChartThemeMode(currentTheme);
  }, [currentTheme]);

  // Drawing states
  const [activeTool, setActiveTool] = useState(null);
  const activeToolRef = useRef(null);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  const [firstPoint, setFirstPoint] = useState(null);
  const firstPointRef = useRef(null);
  useEffect(() => {
    firstPointRef.current = firstPoint;
  }, [firstPoint]);

  const drawingsRef = useRef({ hLines: [], trendLines: [] });

  const clearDrawings = () => {
    // Clear Horizontal Price Lines
    if (seriesRefs.current.candles) {
      drawingsRef.current.hLines.forEach((line) => {
        try {
          seriesRefs.current.candles.removePriceLine(line);
        } catch (e) {
          // ignore
        }
      });
    }
    // Clear Trend Lines (Series)
    if (chartInstanceRef.current) {
      drawingsRef.current.trendLines.forEach((s) => {
        try {
          chartInstanceRef.current.removeSeries(s);
        } catch (e) {
          // ignore
        }
      });
    }
    drawingsRef.current = { hLines: [], trendLines: [] };
    setFirstPoint(null);
  };

  const handleScreenshot = () => {
    if (!chartInstanceRef.current) return;
    try {
      setTakingScreenshot(true);
      
      // Lightweight charts has a built-in method for this
      const canvas = chartInstanceRef.current.takeScreenshot();
      const image = canvas.toDataURL("image/png");
      
      const link = document.createElement("a");
      link.href = image;
      link.download = `${symbol}-chart-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      setTakingScreenshot(false);
    }
  };

  // Update chart options when chart theme changes
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    const isLight = chartThemeMode === "light";
    const activeTheme = useThemeStore.getState().getTheme();
    const colors = activeTheme.colors;

    const chartBg = isLight ? "#ffffff" : (colors.chartBg || "#020617");
    const chartGrid = isLight ? "#e5e7eb" : (colors.chartGrid || "#1e293b");
    const chartBorder = isLight ? "#d1d5db" : (colors.chartBorder || "#334155");
    const chartText = isLight ? "#111827" : (colors.chartText || "#e5e7eb");

    chartInstanceRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: chartBg },
        textColor: chartText,
      },
      grid: {
        vertLines: { color: chartGrid },
        horzLines: { color: chartGrid },
      },
      rightPriceScale: {
        borderColor: chartBorder,
      },
      timeScale: {
        borderColor: chartBorder,
      },
    });
  }, [chartThemeMode]);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    const activeTheme = useThemeStore.getState().getTheme();
    const colors = activeTheme.colors;
    const isLight = useThemeStore.getState().currentTheme === "light";

    const chartBg = isLight ? "#ffffff" : (colors.chartBg || "#020617");
    const chartText = isLight ? "#111827" : (colors.chartText || "#e5e7eb");
    const chartGrid = isLight ? "#e5e7eb" : (colors.chartGrid || "#1e293b");
    const chartBorder = isLight ? "#d1d5db" : (colors.chartBorder || "#334155");

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 600,
      layout: {
        background: { type: ColorType.Solid, color: chartBg },
        textColor: chartText,
        fontSize: 12,
      },
      grid: {
        vertLines: { color: chartGrid, style: 1 },
        horzLines: { color: chartGrid, style: 1 },
      },
      rightPriceScale: {
        borderColor: chartBorder,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: colors.chartBorder,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0, // Disable crosshair lines (only show tooltip)
        vertLine: {
          visible: false, // Hide vertical line
        },
        horzLine: {
          visible: false, // Hide horizontal line
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartInstanceRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
    });
    seriesRefs.current.candles = candleSeries;

    // Tooltip handling
    chart.subscribeCrosshairMove((param) => {
      if (param.point === undefined || !param.time || param.point.x < 0 || param.point.y < 0) {
        setHoverOhlc(null);
        return;
      }

      const candleData = param.seriesData.get(candleSeries);

      if (candleData) {
        setHoverOhlc({
          time: param.time, // kept for future use
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
        });
      } else {
        setHoverOhlc(null);
      }
    });

    // Chart click handling for drawing tools
    chart.subscribeClick((param) => {
      const tool = activeToolRef.current;
      if (!tool || !param.point || !param.time) return;

      const cSeries = seriesRefs.current.candles;
      if (!cSeries) return;

      const price = cSeries.coordinateToPrice(param.point.y);
      if (price === null) return;

      const time = param.time;

      if (tool === "hline") {
        const line = cSeries.createPriceLine({
          price: price,
          color: "#3b82f6",
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: "H-Line",
        });
        drawingsRef.current.hLines.push(line);
        setActiveTool(null); // Reset tool to cursor
      } else if (tool === "trendline") {
        const fp = firstPointRef.current;
        if (!fp) {
          // Store first point
          setFirstPoint({ time, price });
        } else {
          // Draw trend line
          const trendSeries = chart.addLineSeries({
            color: "#22c55e",
            lineWidth: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          });
          trendSeries.setData([
            { time: fp.time, value: fp.price },
            { time: time, value: price },
          ]);
          drawingsRef.current.trendLines.push(trendSeries);
          setFirstPoint(null);
          setActiveTool(null); // Reset tool to cursor
        }
      }
    });

    // Resize handler
    const resize = () => {
      if (chartRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
        seriesRefs.current = {};
      }
    };
  }, []);

  // Load candles and volume
  useEffect(() => {
    if (!chartInstanceRef.current || !seriesRefs.current.candles) return;

    clearDrawings();
    setLoading(true);
    setError(null);
    fetchCandles(symbol, timeframe)
      .then((candles) => {
        if (!chartInstanceRef.current) return;

        if (!candles || candles.length === 0) {
          setError("No chart data available. Please try a different symbol or timeframe.");
          setLoading(false);
          return;
        }

        // Format candles for lightweight-charts
        const formattedCandles = candles.map((c) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        seriesRefs.current.candles.setData(formattedCandles);

        // Keep last candle OHLC as the default display (when not hovering)
        const last = formattedCandles[formattedCandles.length - 1];
        if (last) {
          setLastOhlc({
            time: last.time,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
          });
        }

        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching candles:", err);
        const errorMessage = err.response?.data?.detail || 
                           err.message || 
                           "Unable to load chart data. Yahoo Finance may be temporarily unavailable. Please try again in a few moments.";
        setError(errorMessage);
        setLoading(false);
      });
  }, [symbol, timeframe]);

  // Load indicators
  useEffect(() => {
    if (!chartInstanceRef.current) return;

    const activeIndicators = Object.entries(indicators)
      .filter(([_, active]) => active)
      .map(([name]) => name);

    if (activeIndicators.length === 0) {
      // Remove all indicator series
      Object.keys(seriesRefs.current).forEach((key) => {
        if (key !== "candles" && seriesRefs.current[key]) {
          try {
            chartInstanceRef.current.removeSeries(seriesRefs.current[key]);
          } catch (e) {
            // Series might already be removed
          }
          delete seriesRefs.current[key];
        }
      });
      return;
    }

    fetchIndicators(symbol, timeframe, activeIndicators)
      .then((indicatorData) => {
        if (!chartInstanceRef.current || !indicatorData.time) return;

        const times = indicatorData.time;

        // SMA
        if (indicators.sma && indicatorData.sma_20) {
          if (!seriesRefs.current.sma20) {
            seriesRefs.current.sma20 = chartInstanceRef.current.addLineSeries({
              color: "#3b82f6",
              lineWidth: 2,
              title: "SMA 20",
            });
          }
          const smaData = times.map((t, i) => ({
            time: t,
            value: indicatorData.sma_20[i] || null,
          })).filter((d) => d.value !== null && d.value > 0);
          seriesRefs.current.sma20.setData(smaData);
        } else if (seriesRefs.current.sma20) {
          chartInstanceRef.current.removeSeries(seriesRefs.current.sma20);
          delete seriesRefs.current.sma20;
        }

        if (indicators.sma && indicatorData.sma_50) {
          if (!seriesRefs.current.sma50) {
            seriesRefs.current.sma50 = chartInstanceRef.current.addLineSeries({
              color: "#8b5cf6",
              lineWidth: 2,
              title: "SMA 50",
            });
          }
          const smaData = times.map((t, i) => ({
            time: t,
            value: indicatorData.sma_50[i] || null,
          })).filter((d) => d.value !== null && d.value > 0);
          seriesRefs.current.sma50.setData(smaData);
        } else if (seriesRefs.current.sma50) {
          chartInstanceRef.current.removeSeries(seriesRefs.current.sma50);
          delete seriesRefs.current.sma50;
        }

        // EMA
        if (indicators.ema && indicatorData.ema_20) {
          if (!seriesRefs.current.ema20) {
            seriesRefs.current.ema20 = chartInstanceRef.current.addLineSeries({
              color: "#f59e0b",
              lineWidth: 2,
              title: "EMA 20",
            });
          }
          const emaData = times.map((t, i) => ({
            time: t,
            value: indicatorData.ema_20[i] || null,
          })).filter((d) => d.value !== null && d.value > 0);
          seriesRefs.current.ema20.setData(emaData);
        } else if (seriesRefs.current.ema20) {
          chartInstanceRef.current.removeSeries(seriesRefs.current.ema20);
          delete seriesRefs.current.ema20;
        }

        if (indicators.ema && indicatorData.ema_50) {
          if (!seriesRefs.current.ema50) {
            seriesRefs.current.ema50 = chartInstanceRef.current.addLineSeries({
              color: "#ec4899",
              lineWidth: 2,
              title: "EMA 50",
            });
          }
          const emaData = times.map((t, i) => ({
            time: t,
            value: indicatorData.ema_50[i] || null,
          })).filter((d) => d.value !== null && d.value > 0);
          seriesRefs.current.ema50.setData(emaData);
        } else if (seriesRefs.current.ema50) {
          chartInstanceRef.current.removeSeries(seriesRefs.current.ema50);
          delete seriesRefs.current.ema50;
        }

        // VWAP
        if (indicators.vwap && indicatorData.vwap) {
          if (!seriesRefs.current.vwap) {
            seriesRefs.current.vwap = chartInstanceRef.current.addLineSeries({
              color: "#10b981",
              lineWidth: 2,
              title: "VWAP",
            });
          }
          const vwapData = times.map((t, i) => ({
            time: t,
            value: indicatorData.vwap[i] || null,
          })).filter((d) => d.value !== null && d.value > 0);
          seriesRefs.current.vwap.setData(vwapData);
        } else if (seriesRefs.current.vwap) {
          chartInstanceRef.current.removeSeries(seriesRefs.current.vwap);
          delete seriesRefs.current.vwap;
        }

        // MACD (needs separate pane - simplified for now, show as overlay)
        // Note: Full MACD with histogram requires a separate chart pane
        // For now, we'll show MACD line and signal line
        if (indicators.macd && indicatorData.macd) {
          if (!seriesRefs.current.macd) {
            seriesRefs.current.macd = chartInstanceRef.current.addLineSeries({
              color: "#06b6d4",
              lineWidth: 2,
              title: "MACD",
              priceScaleId: "macd",
            });
          }
          const macdData = times.map((t, i) => ({
            time: t,
            value: indicatorData.macd[i] || null,
          })).filter((d) => d.value !== null);
          seriesRefs.current.macd.setData(macdData);
        } else if (seriesRefs.current.macd) {
          chartInstanceRef.current.removeSeries(seriesRefs.current.macd);
          delete seriesRefs.current.macd;
        }

        // RSI (needs separate pane - for now, skip as it's 0-100 scale)
        // RSI would need a separate chart pane to display properly
      })
      .catch((err) => {
        console.error("Error fetching indicators:", err);
      });
  }, [symbol, timeframe, indicators]);

  const ohlc = hoverOhlc || lastOhlc;
  const fmt = (v) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(2) : "—");

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-lg font-semibold">{symbol}</span>
            {loading ? <span className="text-muted-foreground text-sm">Loading…</span> : null}
            {error ? <span className="text-destructive text-sm">Data unavailable</span> : null}
          </div>
          <div className="bg-muted flex w-fit gap-1 rounded-lg p-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                type="button"
                onClick={() => setTimeframe(tf.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  timeframe === tf.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-background/80"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowToolbar(!showToolbar)}
              disabled={!!error}
              className="flex items-center justify-center rounded-lg p-2 transition-colors bg-transparent border-none text-black hover:bg-zinc-200/50"
              title={showToolbar ? "Hide Drawing Toolbar" : "Show Drawing Toolbar"}
            >
              <PenTool className="h-5 w-5 text-black" />
            </button>
            <button
              onClick={() => setChartThemeMode(chartThemeMode === "light" ? "dark" : "light")}
              disabled={!!error}
              className="flex items-center justify-center rounded-lg p-2 transition-colors bg-transparent border-none text-black hover:bg-zinc-200/50"
              title={chartThemeMode === "light" ? "Switch to Dark Chart" : "Switch to Light Chart"}
            >
              {chartThemeMode === "light" ? (
                <Moon className="h-5 w-5 text-black" />
              ) : (
                <Sun className="h-5 w-5 text-black" />
              )}
            </button>
            <button
              onClick={handleScreenshot}
              disabled={takingScreenshot || !!error}
              className="flex items-center justify-center rounded-lg p-2 transition-colors bg-transparent border-none text-black hover:bg-zinc-200/50 disabled:opacity-50"
              title="Take Screenshot"
            >
              <Camera className="h-5 w-5 text-black" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-4">
        <div className="text-muted-foreground mb-2 flex h-6 items-center gap-4 text-xs tabular-nums">
          <span>
            <span className="text-muted-foreground/80">O</span> {fmt(ohlc?.open)}
          </span>
          <span>
            <span className="text-muted-foreground/80">H</span> {fmt(ohlc?.high)}
          </span>
          <span>
            <span className="text-muted-foreground/80">L</span> {fmt(ohlc?.low)}
          </span>
          <span>
            <span className="text-muted-foreground/80">C</span> {fmt(ohlc?.close)}
          </span>
          {hoverOhlc ? <span className="text-muted-foreground/70">(hover)</span> : null}
        </div>

        {error ? (
          <div className="border-destructive/40 bg-destructive/10 mb-4 rounded-lg border p-4">
            <p className="text-destructive text-sm">{error}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Try another symbol or refresh. The data provider may be temporarily unavailable.
            </p>
          </div>
        ) : null}

        <div className="flex gap-4">
          {/* Drawing Toolbar */}
          {!error && showToolbar && (
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-2.5 h-[600px] justify-start items-center shadow-lg backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  setActiveTool(null);
                  setFirstPoint(null);
                }}
                className={`rounded-lg p-2.5 transition-colors ${
                  activeTool === null
                    ? "bg-white text-black font-semibold"
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
                title="Cursor Mode"
              >
                <MousePointer className="h-5 w-5" />
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setActiveTool("trendline");
                  setFirstPoint(null);
                }}
                className={`rounded-lg p-2.5 transition-colors ${
                  activeTool === "trendline"
                    ? "bg-white text-black font-semibold"
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
                title="Trend Line Tool"
              >
                <TrendingUp className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool("hline");
                  setFirstPoint(null);
                }}
                className={`rounded-lg p-2.5 transition-colors ${
                  activeTool === "hline"
                    ? "bg-white text-black font-semibold"
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
                title="Horizontal Line Tool"
              >
                <Minus className="h-5 w-5" />
              </button>

              <div className="w-6 border-b border-white/10 my-1" />

              <button
                type="button"
                onClick={clearDrawings}
                className="rounded-lg p-2.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Clear All Drawings"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Chart Area */}
          <div className="flex-1 min-w-0 relative">
            {!error ? <div ref={chartRef} style={{ height: "600px", width: "100%" }} /> : null}
            
            {/* Visual Prompts for drawing mode */}
            {activeTool && (
              <div className="absolute top-4 left-4 z-10 rounded-lg bg-zinc-950/90 border border-white/10 px-3.5 py-1.5 text-xs text-white backdrop-blur flex items-center gap-2 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>
                  {activeTool === "hline"
                    ? "Click on the chart to place a Horizontal Line"
                    : firstPoint
                    ? "Click to place the end point of the Trend Line"
                    : "Click to place the start point of the Trend Line"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool(null);
                    setFirstPoint(null);
                  }}
                  className="ml-2 text-muted-foreground hover:text-white font-bold"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {error ? (
              <div className="flex items-center justify-center border border-dashed border-white/10 rounded-xl" style={{ height: "600px", width: "100%" }}>
                <div className="text-muted-foreground text-center text-sm">Chart data unavailable</div>
              </div>
            ) : null}
          </div>
        </div>

        <CompanyDetails symbol={symbol} />
      </CardContent>
    </Card>
  );
};

export default TradingChart;
