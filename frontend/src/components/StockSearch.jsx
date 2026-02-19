import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import useTradingStore from "../store/tradingStore";

const StockSearch = ({ onSelect }) => {
  const { symbol } = useTradingStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/search?query=${query}`);
        setResults(res.data || []);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (selectedSymbol) => {
    onSelect(selectedSymbol);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={`Search stock (Current: ${symbol})`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-3 bg-slate-900 text-slate-200 rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
      />

      {loading && (
        <div className="absolute right-3 top-3 text-slate-400 text-sm">
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute z-50 bg-slate-900 w-full mt-1 rounded border border-slate-700 shadow-xl max-h-64 overflow-y-auto">
          {results.map((s, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(s.symbol)}
              className="p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-700 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="text-slate-200 font-semibold">{s.symbol}</div>
                {s.exchange && (
                  <div className="text-xs text-slate-500">{s.exchange}</div>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">{s.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearch;
