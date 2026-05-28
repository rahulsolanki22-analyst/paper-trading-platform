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
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
      <h3 className="text-card-foreground text-sm font-semibold mb-3">Indicators</h3>
      <div className="space-y-2">
        {indicatorList.map((ind) => (
          <label
            key={ind.key}
            className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
          >
            <div>
              <div className="text-card-foreground text-sm font-medium">{ind.label}</div>
              <div className="text-muted-foreground text-xs">{ind.description}</div>
            </div>
            <input
              type="checkbox"
              checked={indicators[ind.key] || false}
              onChange={() => toggleIndicator(ind.key)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-ring"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default Indicators;

