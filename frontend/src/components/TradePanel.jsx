import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { fetchPortfolioValuation } from "../api/portfolioApi";
import { resetPortfolio } from "../api/resetApi";
import { autoLoginDemo } from "../utils/autoLogin";
import useTradingStore from "../store/tradingStore";
import useAuthStore from "../store/authStore";
import useLanguageStore from "../store/languageStore";

const TradePanel = ({ symbol, onTrade }) => {
  const { tradingMode } = useTradingStore();
  const { isAuthenticated } = useAuthStore();
  const { translate } = useLanguageStore();
  const [quantity, setQuantity] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadHoldings = async () => {
      // Auto-login if not authenticated
      if (!isAuthenticated) {
        try {
          await autoLoginDemo();
        } catch (error) {
          console.error('Auto-login failed:', error);
          return;
        }
      }

      try {
        const res = await fetchPortfolioValuation();
        setHoldings(res.holdings);
      } catch (err) {
        console.error("Failed to load holdings:", err);
      }
    };

    loadHoldings();
  }, [onTrade, isAuthenticated]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const validateQuantity = () => {
    const qty = Number(quantity);
    if (!quantity || qty <= 0 || !Number.isInteger(qty)) {
      return "Quantity must be a positive integer";
    }
    return null;
  };

  const handleBuy = async () => {
    const validationError = validateQuantity();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (tradingMode !== "PAPER") {
      setError("Trading is disabled in Viewer Mode");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Build query params
      let url = `/trade/buy?symbol=${symbol}&quantity=${quantity}`;
      if (stopLoss && parseFloat(stopLoss) > 0) {
        url += `&stop_loss=${stopLoss}`;
      }
      if (takeProfit && parseFloat(takeProfit) > 0) {
        url += `&take_profit=${takeProfit}`;
      }

      await axios.post(url);
      setSuccess(`Buy order executed: ${quantity} ${symbol}`);
      setQuantity("");
      setStopLoss("");
      setTakeProfit("");
      onTrade();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to execute buy order"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    const validationError = validateQuantity();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (tradingMode !== "PAPER") {
      setError("Trading is disabled in Viewer Mode");
      return;
    }

    const ownsStock = holdings.some((h) => h.symbol === symbol);
    if (!ownsStock) {
      setError("You don't own this stock");
      return;
    }

    const holding = holdings.find((h) => h.symbol === symbol);
    if (Number(quantity) > holding.quantity) {
      setError(`You only own ${holding.quantity} shares`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(`/trade/sell?symbol=${symbol}&quantity=${quantity}`);
      setSuccess(`Sell order executed: ${quantity} ${symbol}`);
      setQuantity("");
      onTrade();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to execute sell order"
      );
    } finally {
      setLoading(false);
    }
  };

  const ownsStock = holdings.some((h) => h.symbol === symbol);
  const holding = ownsStock
    ? holdings.find((h) => h.symbol === symbol)
    : null;
  const isDisabled = tradingMode !== "PAPER" || loading;
  const quantityValid = quantity && Number(quantity) > 0 && Number.isInteger(Number(quantity));

  return (
    <div className={`bg-slate-900 p-4 rounded border border-slate-700`}>
      <h3 className={`text-slate-200 text-lg font-semibold mb-4`}>{translate('trade')}</h3>

      {/* Current holding info */}
      {holding && (
        <div className={`mb-4 p-3 bg-slate-800 rounded`}>
          <div className={`text-slate-400 text-sm`}>Your Position</div>
          <div className={`text-slate-200 font-semibold`}>
            {holding.quantity} shares @ ₹{holding.avg_buy_price}
          </div>
        </div>
      )}

      {/* Quantity Input */}
      <div className="mb-4">
        <label className={`block text-slate-300 text-sm mb-2`}>{translate('quantity')}</label>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => {
            const val = e.target.value;
            setQuantity(val === "" ? "" : val);
            setError(null);
          }}
          disabled={isDisabled}
          className={`w-full p-3 bg-slate-800 text-slate-200 rounded border ${quantity && !quantityValid ? "border-red-500" : "border-slate-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {quantity && !quantityValid && (
          <p className={`text-red-400 text-xs mt-1`}>
            Must be a positive integer
          </p>
        )}
      </div>

      {/* Advanced Order Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mb-4 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
      >
        {showAdvanced ? "▼" : "▶"} Advanced Order Options
      </button>

      {/* Stop-Loss and Take-Profit Inputs */}
      {showAdvanced && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded border border-slate-700 space-y-3">
          <div>
            <label className="block text-slate-400 text-xs mb-1">
              Stop-Loss Price (optional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Auto-sell if price drops to..."
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              disabled={isDisabled}
              className="w-full p-2 bg-slate-700 text-slate-200 rounded border border-slate-600 text-sm disabled:opacity-50"
            />
            <p className="text-slate-500 text-xs mt-1">Automatically sells when price falls below this level</p>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1">
              Take-Profit Price (optional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Auto-sell if price rises to..."
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              disabled={isDisabled}
              className="w-full p-2 bg-slate-700 text-slate-200 rounded border border-slate-600 text-sm disabled:opacity-50"
            />
            <p className="text-slate-500 text-xs mt-1">Automatically sells when price reaches this target</p>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className={`mb-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm`}>
          {error}
        </div>
      )}
      {success && (
        <div className={`mb-3 p-2 bg-green-900/30 border border-green-700 rounded text-green-200 text-sm`}>
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleBuy}
          disabled={isDisabled || !quantityValid}
          className={`flex-1 py-3 rounded font-semibold transition-colors ${isDisabled || !quantityValid
            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 text-white"
            }`}
        >
          {loading ? translate('processing') : translate('buy')}
        </button>

        <button
          onClick={handleSell}
          disabled={isDisabled || !quantityValid || !ownsStock}
          className={`flex-1 py-3 rounded font-semibold transition-colors ${isDisabled || !quantityValid || !ownsStock
            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
            : "bg-red-600 hover:bg-red-700 text-white"
            }`}
        >
          {loading ? translate('processing') : translate('sell')}
        </button>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          if (window.confirm("Reset portfolio to ₹100,000? This cannot be undone.")) {
            resetPortfolio(100000).then(() => {
              setSuccess("Portfolio reset to ₹100,000");
              onTrade();
            });
          }
        }}
        className={`w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded text-sm transition-colors`}
      >
        {translate('resetPaperMoney')}
      </button>
    </div>
  );
};

export default TradePanel;
