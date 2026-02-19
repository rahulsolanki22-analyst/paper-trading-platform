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
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mt-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/4 mb-3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mt-4">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  const isPositive = details.change >= 0;
  const changeColor = isPositive ? "text-green-400" : "text-red-400";
  const changeSymbol = isPositive ? "+" : "";

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mt-4">
      {/* Header with company name and price */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-200 mb-1">{details.name}</h3>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{currencySymbol}{details.current_price?.toFixed(2) || "N/A"}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{currency}</span>
          </div>
          <div className={`text-lg font-medium ${changeColor}`}>
            {changeSymbol}{details.change?.toFixed(2) || "0.00"} ({changeSymbol}{formatPercent(details.change_pct)})
          </div>
        </div>
      </div>

      {/* Company Description */}
      {details.description && details.description !== "No description available" && (
        <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
          <p className="text-slate-300 text-sm leading-relaxed">
            {details.description.length > 200 
              ? `${details.description.substring(0, 200)}...` 
              : details.description}
          </p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Market Cap */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Market Cap</div>
          <div className="text-slate-200 font-medium">
            {formatCurrency(details.market_cap)}
          </div>
        </div>

        {/* P/E Ratio */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">P/E Ratio</div>
          <div className="text-slate-200 font-medium">
            {formatRatio(details.trailing_pe)}
          </div>
        </div>

        {/* Volume */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Volume</div>
          <div className="text-slate-200 font-medium">
            {formatLargeNumber(details.volume)}
          </div>
        </div>

        {/* Avg Volume */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Avg Volume</div>
          <div className="text-slate-200 font-medium">
            {formatLargeNumber(details.avg_volume)}
          </div>
        </div>

        {/* Day Range */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Day Range</div>
          <div className="text-slate-200 font-medium text-sm">
            {currencySymbol}{details.day_low?.toFixed(2) || "N/A"} - {currencySymbol}{details.day_high?.toFixed(2) || "N/A"}
          </div>
        </div>

        {/* 52 Week Range */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">52W Range</div>
          <div className="text-slate-200 font-medium text-sm">
            {currencySymbol}{details.week_52_low?.toFixed(2) || "N/A"} - {currencySymbol}{details.week_52_high?.toFixed(2) || "N/A"}
          </div>
        </div>

        {/* Beta */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Beta</div>
          <div className="text-slate-200 font-medium">
            {formatRatio(details.beta)}
          </div>
        </div>

        {/* Dividend Yield */}
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Dividend Yield</div>
          <div className="text-slate-200 font-medium">
            {formatPercent(details.dividend_yield)}
          </div>
        </div>
      </div>

      {/* Additional Info Row */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sector:</span>
            <span className="text-slate-200">{details.sector}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Industry:</span>
            <span className="text-slate-200">{details.industry}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Exchange:</span>
            <span className="text-slate-200">{details.exchange}</span>
          </div>
          {details.website && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Website:</span>
              <a 
                href={details.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
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
