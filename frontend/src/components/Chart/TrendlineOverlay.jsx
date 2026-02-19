import React, { useEffect, useRef, useState, useCallback } from "react";

// Simple trendline overlay for lightweight-charts
// Props:
// - chart: chart instance from lightweight-charts
// - series: main candle series instance
// - symbol: current symbol
// - timeframe: current timeframe
// - containerRef: ref to the chart container div (to size the canvas)
const TrendlineOverlay = ({ chart, series, symbol, timeframe, containerRef }) => {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState("idle"); // idle | draw
  const [tempLine, setTempLine] = useState(null); // {p1:{time,price}, p2:{time,price}}
  const linesRef = useRef([]); // array of lines

  const storageKey = `trendlines:${symbol}:${timeframe}`;

  // Helpers: coordinate <-> time/price
  const xyToTimePrice = useCallback(
    (x, y) => {
      if (!chart || !series) return null;
      try {
        const time = chart.timeScale().coordinateToTime(x);
        const price = series.priceScale().coordinateToPrice(y);
        if (!time || price == null) return null;
        return { time, price };
      } catch (e) {
        return null;
      }
    },
    [chart, series]
  );

  const timePriceToXY = useCallback(
    (time, price) => {
      if (!chart || !series) return null;
      try {
        const x = chart.timeScale().timeToCoordinate(time);
        const y = series.priceScale().priceToCoordinate(price);
        if (x == null || y == null) return null;
        return { x, y };
      } catch (e) {
        return null;
      }
    },
    [chart, series]
  );

  // Load/save lines
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          linesRef.current = parsed;
        }
      } else {
        linesRef.current = [];
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const saveLines = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(linesRef.current));
    } catch {}
  }, [storageKey]);

  // Resize canvas to container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const el = containerRef?.current;
    if (!canvas || !el) return;
    const dpr = window.devicePixelRatio || 1;
    const width = el.clientWidth;
    const height = el.clientHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [containerRef]);

  // Draw all lines
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // style
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#60a5fa"; // blue-400

    const drawLine = (p1, p2) => {
      const a = timePriceToXY(p1.time, p1.price);
      const b = timePriceToXY(p2.time, p2.price);
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    // existing lines
    for (const line of linesRef.current) {
      if (line?.p1 && line?.p2) drawLine(line.p1, line.p2);
    }

    // temp line while drawing
    if (tempLine?.p1 && tempLine?.p2) {
      ctx.setLineDash([6, 6]);
      drawLine(tempLine.p1, tempLine.p2);
      ctx.setLineDash([]);
    }
  }, [tempLine, timePriceToXY]);

  // Redraw on chart changes
  useEffect(() => {
    if (!chart) return;
    const onVisibleRange = () => draw();
    chart.timeScale().subscribeVisibleTimeRangeChange(onVisibleRange);
    const resize = () => {
      resizeCanvas();
      draw();
    };
    window.addEventListener("resize", resize);
    // initial
    resizeCanvas();
    draw();

    return () => {
      try { chart.timeScale().unsubscribeVisibleTimeRangeChange(onVisibleRange); } catch {}
      window.removeEventListener("resize", resize);
    };
  }, [chart, draw, resizeCanvas]);

  // Mouse handlers
  const onMouseDown = (e) => {
    if (mode !== "draw" || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = xyToTimePrice(x, y);
    if (!p) return;

    if (!tempLine || !tempLine.p1) {
      setTempLine({ p1: p, p2: null });
    } else if (tempLine.p1 && !tempLine.p2) {
      // complete the line
      const newLine = { p1: tempLine.p1, p2: p, id: Date.now() };
      linesRef.current = [...linesRef.current, newLine];
      setTempLine(null);
      setMode("idle");
      saveLines();
      draw();
    }
  };

  const onMouseMove = (e) => {
    if (mode !== "draw" || !tempLine?.p1 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = xyToTimePrice(x, y);
    if (!p) return;
    setTempLine((prev) => (prev ? { ...prev, p2: p } : prev));
  };

  // Redraw when tempLine changes for interactive preview
  useEffect(() => {
    draw();
  }, [tempLine, draw]);

  // Allow cancel with ESC and right-click
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setTempLine(null);
        setMode("idle");
        draw();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draw]);

  const onContextMenu = (e) => {
    if (mode === "draw") {
      e.preventDefault();
      setTempLine(null);
      setMode("idle");
      draw();
    }
  };

  // Toolbar actions
  const handleStartDraw = () => setMode((m) => (m === "draw" ? "idle" : "draw"));
  const handleClear = () => {
    linesRef.current = [];
    saveLines();
    draw();
  };

  // Redraw when symbol/timeframe changes (lines reloaded above)
  useEffect(() => {
    resizeCanvas();
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  return (
    <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 5 }}>
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          onClick={handleStartDraw}
          className={`px-2 py-1 text-xs rounded text-slate-200 ${
            mode === "draw" ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-700 hover:bg-slate-600"
          }`}
        >
          {mode === "draw" ? "Drawing… (Esc to cancel)" : "Draw TL"}
        </button>
        <button
          onClick={handleClear}
          className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
        >
          Clear
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onContextMenu={onContextMenu}
        className="absolute inset-0 z-20"
        style={{ cursor: mode === "draw" ? "crosshair" : "default", pointerEvents: mode === "draw" ? "auto" : "none" }}
      />
    </div>
  );
};

export default TrendlineOverlay;
