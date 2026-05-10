import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { fetchPortfolioValuation } from "../api/portfolioApi";
import { resetPortfolio } from "../api/resetApi";
import { autoLoginDemo } from "../utils/autoLogin";
import useTradingStore from "../store/tradingStore";
import useAuthStore from "../store/authStore";
import useLanguageStore from "../store/languageStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      if (!isAuthenticated) {
        try {
          await autoLoginDemo();
        } catch (e) {
          console.error("Auto-login failed:", e);
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
      setError(err.response?.data?.detail || "Failed to execute buy order");
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
      setError(err.response?.data?.detail || "Failed to execute sell order");
    } finally {
      setLoading(false);
    }
  };

  const ownsStock = holdings.some((h) => h.symbol === symbol);
  const holding = ownsStock ? holdings.find((h) => h.symbol === symbol) : null;
  const isDisabled = tradingMode !== "PAPER" || loading;
  const quantityValid =
    quantity && Number(quantity) > 0 && Number.isInteger(Number(quantity));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate("trade")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {holding ? (
          <div className="bg-muted/50 rounded-lg border border-border p-3">
            <div className="text-muted-foreground text-sm">Your position</div>
            <div className="font-semibold">
              {holding.quantity} shares @ ₹{holding.avg_buy_price}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="trade-qty">{translate("quantity")}</Label>
          <Input
            id="trade-qty"
            type="number"
            min={1}
            step={1}
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value === "" ? "" : e.target.value);
              setError(null);
            }}
            disabled={isDisabled}
            aria-invalid={quantity && !quantityValid}
            className={quantity && !quantityValid ? "border-destructive" : ""}
          />
          {quantity && !quantityValid ? (
            <p className="text-destructive text-xs">Must be a positive integer</p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary px-0"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "▼" : "▶"} Advanced order options
        </Button>

        {showAdvanced ? (
          <div className="bg-muted/40 space-y-3 rounded-lg border border-border p-3">
            <div className="space-y-2">
              <Label htmlFor="sl">Stop-loss (optional)</Label>
              <Input
                id="sl"
                type="number"
                min={0}
                step="0.01"
                placeholder="Trigger sell below…"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                disabled={isDisabled}
              />
              <p className="text-muted-foreground text-xs">Auto-sell when price falls to this level.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp">Take-profit (optional)</Label>
              <Input
                id="tp"
                type="number"
                min={0}
                step="0.01"
                placeholder="Trigger sell above…"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                disabled={isDisabled}
              />
              <p className="text-muted-foreground text-xs">Auto-sell when price reaches this target.</p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-md border px-3 py-2 text-sm">
            {success}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
            disabled={isDisabled || !quantityValid}
            onClick={handleBuy}
          >
            {loading ? translate("processing") : translate("buy")}
          </Button>
          <Button
            type="button"
            className="flex-1 bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
            disabled={isDisabled || !quantityValid || !ownsStock}
            onClick={handleSell}
          >
            {loading ? translate("processing") : translate("sell")}
          </Button>
        </div>

        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={() => {
            if (window.confirm("Reset portfolio to ₹100,000? This cannot be undone.")) {
              resetPortfolio(100000).then(() => {
                setSuccess("Portfolio reset to ₹100,000");
                onTrade();
              });
            }
          }}
        >
          {translate("resetPaperMoney")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TradePanel;
