import React, { useEffect, useState } from "react";
import { fetchStockDetails } from "../api/stocksApi";

const CompanyDetails = ({ symbol }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStockDetails(symbol);
        if (data.error) {
          setError(data.error);
        } else {
          setDetails(data);
        }
      } catch (err) {
        setError("Failed to load company details");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [symbol]);

  // Determine currency from details or fallback by symbol suffix
  const getCurrency = () => {
    if (details?.currency) return details.currency;
    if (symbol?.endsWith('.NS') || symbol?.endsWith('.BSE') || symbol?.endsWith('.BO')) return 'INR';
    return 'USD';
  };

  const currency = getCurrency();
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '';

  // Format monetary values with currency symbol and compact units
  const formatCurrency = (num) => {
    if (num == null || num === "N/A" || Number.isNaN(num)) return "N/A";
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    const s = currencySymbol || '';
    if (abs >= 1e12) return `${sign}${s}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${s}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${s}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${s}${(abs / 1e3).toFixed(2)}K`;
    return `${sign}${s}${abs.toFixed(2)}`;
  };

  // Format plain large numbers (no currency) for things like Volume
  const formatLargeNumber = (num) => {
    if (num == null || num === "N/A" || Number.isNaN(num)) return "N/A";
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
    return `${sign}${abs.toFixed(2)}`;
  };

  const formatPercent = (num) => {
    if (!num || num === "N/A") return "N/A";
    return `${num.toFixed(2)}%`;
  };

  const formatRatio = (num) => {
    if (!num || num === "N/A") return "N/A";
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 mt-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 mt-4 shadow-sm">
        <div className="text-destructive text-sm font-semibold">{error}</div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  const isPositive = details.change >= 0;
  const changeColor = isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  const changeSymbol = isPositive ? "+" : "";

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-4 mt-4 shadow-sm">
      {/* Header with company name and price */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground mb-1">{details.name}</h3>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <span>{currencySymbol}{details.current_price?.toFixed(2) || "N/A"}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{currency}</span>
          </div>
          <div className={`text-lg font-medium ${changeColor}`}>
            {changeSymbol}{details.change?.toFixed(2) || "0.00"} ({changeSymbol}{formatPercent(details.change_pct)})
          </div>
        </div>
      </div>

      {/* Company Description */}
      {details.description && details.description !== "No description available" && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {details.description.length > 200 
              ? `${details.description.substring(0, 200)}...` 
              : details.description}
          </p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Market Cap */}
        <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Market Cap</div>
          <div className="text-card-foreground font-semibold">
            {formatCurrency(details.market_cap)}
          </div>
        </div>

        {/* P/E Ratio */}
        <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">P/E Ratio</div>
          <div className="text-card-foreground font-semibold">
            {formatRatio(details.trailing_pe)}
          </div>
        </div>

        {/* Volume */}
        <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Volume</div>
          <div className="text-card-foreground font-semibold">
            {formatLargeNumber(details.volume)}
          </div>
        </div>

        {/* Avg Volume */}
        <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Avg Volume</div>
          <div className="text-card-foreground font-semibold">
            {formatLargeNumber(details.avg_volume)}
          </div>
        </div>

        {/* Day Range */}
        <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Day Range</div>
          <div className="text-card-foreground font-semibold text-sm">
            {currencySymbol}{details.day_low?.toFixed(2) || "N/A"} - {currencySymbol}{details.day_high?.toFixed(2) || "N/A"}
          </div>
        </div>

        {/* 52 Week Range */}
        <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">52W Range</div>
          <div className="text-card-foreground font-semibold text-sm">
            {currencySymbol}{details.week_52_low?.toFixed(2) || "N/A"} - {currencySymbol}{details.week_52_high?.toFixed(2) || "N/A"}
          </div>
        </div>

        {/* Beta */}
        <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Beta</div>
          <div className="text-card-foreground font-semibold">
            {formatRatio(details.beta)}
          </div>
        </div>

        {/* Dividend Yield */}
        <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Dividend Yield</div>
          <div className="text-card-foreground font-semibold">
            {formatPercent(details.dividend_yield)}
          </div>
        </div>
      </div>

      {/* Additional Info Row */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Sector:</span>
            <span className="text-card-foreground font-semibold">{details.sector}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Industry:</span>
            <span className="text-card-foreground font-semibold">{details.industry}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Exchange:</span>
            <span className="text-card-foreground font-semibold">{details.exchange}</span>
          </div>
          {details.website && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Website:</span>
              <a 
                href={details.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                Visit
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
