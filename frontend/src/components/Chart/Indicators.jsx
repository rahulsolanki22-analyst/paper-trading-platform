import React from "react";
import useTradingStore from "../../store/tradingStore";

const Indicators = () => {
  const { indicators, toggleIndicator } = useTradingStore();

  const indicatorList = [
    { key: "sma", label: "SMA", description: "Simple Moving Average" },
    { key: "ema", label: "EMA", description: "Exponential Moving Average" },
    { key: "rsi", label: "RSI", description: "Relative Strength Index" },
    { key: "macd", label: "MACD", description: "Moving Average Convergence Divergence" },
    { key: "vwap", label: "VWAP", description: "Volume Weighted Average Price" },
  ];

  return (
    <div className="bg-slate-900 p-4 rounded border border-slate-700">
      <h3 className="text-slate-200 text-sm font-semibold mb-3">Indicators</h3>
      <div className="space-y-2">
        {indicatorList.map((ind) => (
          <label
            key={ind.key}
            className="flex items-center justify-between p-2 hover:bg-slate-800 rounded cursor-pointer"
          >
            <div>
              <div className="text-slate-200 text-sm">{ind.label}</div>
              <div className="text-slate-500 text-xs">{ind.description}</div>
            </div>
            <input
              type="checkbox"
              checked={indicators[ind.key] || false}
              onChange={() => toggleIndicator(ind.key)}
              className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default Indicators;

