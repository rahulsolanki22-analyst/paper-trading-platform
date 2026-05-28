import React, { useEffect, useState } from "react";
import { fetchMLSignal } from "../api/mlApi";

const MLSignalPanel = ({ symbol }) => {
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    fetchMLSignal(symbol)
      .then((data) => {
        setSignal(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("ML Signal error:", err);
        setError("Failed to load ML signal");
        setLoading(false);
      });
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <h3 className="text-card-foreground text-sm font-semibold mb-3">
          ML Signal
        </h3>
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <h3 className="text-card-foreground text-sm font-semibold mb-3">
          ML Signal
        </h3>
        <div className="text-destructive text-sm font-semibold">{error || "No signal available"}</div>
      </div>
    );
  }

  const { buy_confidence, hold_confidence, sell_confidence, dominant_signal } =
    signal;

  const getSignalColor = (signalType) => {
    switch (signalType) {
      case "BUY":
        return "text-emerald-600 dark:text-emerald-400";
      case "SELL":
        return "text-red-600 dark:text-red-400";
      case "HOLD":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getBarColor = (signalType) => {
    switch (signalType) {
      case "BUY":
        return "bg-emerald-500 dark:bg-emerald-400";
      case "SELL":
        return "bg-red-500 dark:bg-red-400";
      case "HOLD":
        return "bg-amber-500 dark:bg-amber-400";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-card-foreground text-sm font-semibold">ML Signal</h3>
        <span
          className={`text-xs font-bold px-2 py-1 rounded bg-muted ${getSignalColor(
            dominant_signal
          )}`}
        >
          {dominant_signal}
        </span>
      </div>

      {/* BUY Confidence */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">BUY</span>
          <span className="text-card-foreground font-medium">{buy_confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-all"
            style={{ width: `${buy_confidence}%` }}
          />
        </div>
      </div>

      {/* HOLD Confidence */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-amber-600 dark:text-amber-400 font-semibold">HOLD</span>
          <span className="text-card-foreground font-medium">{hold_confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all"
            style={{ width: `${hold_confidence}%` }}
          />
        </div>
      </div>

      {/* SELL Confidence */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-600 dark:text-red-400 font-semibold">SELL</span>
          <span className="text-card-foreground font-medium">{sell_confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-red-500 dark:bg-red-400 h-2 rounded-full transition-all"
            style={{ width: `${sell_confidence}%` }}
          />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground italic">
          ML signals are for educational purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
};

export default MLSignalPanel;

