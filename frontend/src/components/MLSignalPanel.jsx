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
      <div className="bg-slate-900 p-4 rounded border border-slate-700">
        <h3 className="text-slate-200 text-sm font-semibold mb-3">
          ML Signal
        </h3>
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="bg-slate-900 p-4 rounded border border-slate-700">
        <h3 className="text-slate-200 text-sm font-semibold mb-3">
          ML Signal
        </h3>
        <div className="text-red-400 text-sm">{error || "No signal available"}</div>
      </div>
    );
  }

  const { buy_confidence, hold_confidence, sell_confidence, dominant_signal } =
    signal;

  const getSignalColor = (signalType) => {
    switch (signalType) {
      case "BUY":
        return "text-green-400";
      case "SELL":
        return "text-red-400";
      case "HOLD":
        return "text-yellow-400";
      default:
        return "text-slate-400";
    }
  };

  const getBarColor = (signalType) => {
    switch (signalType) {
      case "BUY":
        return "bg-green-500";
      case "SELL":
        return "bg-red-500";
      case "HOLD":
        return "bg-yellow-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="bg-slate-900 p-4 rounded border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-200 text-sm font-semibold">ML Signal</h3>
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${getSignalColor(
            dominant_signal
          )} bg-slate-800`}
        >
          {dominant_signal}
        </span>
      </div>

      {/* BUY Confidence */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-green-400">BUY</span>
          <span className="text-slate-300">{buy_confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className={`bg-green-500 h-2 rounded-full transition-all`}
            style={{ width: `${buy_confidence}%` }}
          />
        </div>
      </div>

      {/* HOLD Confidence */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-yellow-400">HOLD</span>
          <span className="text-slate-300">{hold_confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className={`bg-yellow-500 h-2 rounded-full transition-all`}
            style={{ width: `${hold_confidence}%` }}
          />
        </div>
      </div>

      {/* SELL Confidence */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-400">SELL</span>
          <span className="text-slate-300">{sell_confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className={`bg-red-500 h-2 rounded-full transition-all`}
            style={{ width: `${sell_confidence}%` }}
          />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 italic">
          ML signals are for educational purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
};

export default MLSignalPanel;

