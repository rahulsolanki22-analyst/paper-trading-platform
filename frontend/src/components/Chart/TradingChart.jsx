import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { fetchCandles, fetchIndicators } from "../../api/marketApi";
import useTradingStore from "../../store/tradingStore";
import CompanyDetails from "../CompanyDetails";

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
  // Minimal OHLC display (updates on hover, falls back to latest candle)
  const [hoverOhlc, setHoverOhlc] = useState(null);
  const [lastOhlc, setLastOhlc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 600,
      layout: {
        background: { type: ColorType.Solid, color: "#020617" },
        textColor: "#e5e7eb",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#1e293b", style: 1 },
        horzLines: { color: "#1e293b", style: 1 },
      },
      rightPriceScale: {
        borderColor: "#334155",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "#334155",
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
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-semibold text-lg">{symbol}</span>
          {loading && (
            <span className="text-slate-400 text-sm">Loading...</span>
          )}
          {error && (
            <span className="text-red-400 text-sm">⚠️ Data unavailable</span>
          )}
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-1 bg-slate-800 rounded p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                timeframe === tf.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Minimal OHLC strip (fixed height so chart never “jumps”) */}
      <div className="h-6 mb-2 flex items-center gap-4 text-xs text-slate-400 tabular-nums">
        <span>
          <span className="text-slate-500">O:</span> {fmt(ohlc?.open)}
        </span>
        <span>
          <span className="text-slate-500">H:</span> {fmt(ohlc?.high)}
        </span>
        <span>
          <span className="text-slate-500">L:</span> {fmt(ohlc?.low)}
        </span>
        <span>
          <span className="text-slate-500">C:</span> {fmt(ohlc?.close)}
        </span>
        {hoverOhlc && (
          <span className="text-slate-500">(hover)</span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-red-400/70 text-xs mt-2">
            Tip: Try refreshing the page or selecting a different symbol. Yahoo Finance may be experiencing temporary issues.
          </p>
        </div>
      )}

      {/* Chart container */}
      {!error && <div ref={chartRef} style={{ height: "600px", width: "100%" }} />}
      {error && (
        <div className="flex items-center justify-center" style={{ height: "600px", width: "100%" }}>
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-400">Chart data unavailable</p>
          </div>
        </div>
      )}

      {/* Company Details Section */}
      <CompanyDetails symbol={symbol} />
    </div>
  );
};

export default TradingChart;
