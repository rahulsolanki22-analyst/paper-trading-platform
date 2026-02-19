import React, { useState } from "react";
import { searchStocks } from "../api/searchApi";

const StockSelector = ({ onChange }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = async (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.length < 2) {
      setResults([]);
      return;
    }

    try {
      const data = await searchStocks(val);
      setResults(data);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  const handleSelect = (symbol) => {
    onChange(symbol);      // updates chart + trading
    setQuery(symbol);      // show selected symbol
    setResults([]);        // close dropdown
  };

  return (
    <div className="mb-4 relative w-80">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search stock (Apple, Tesla, Reliance...)"
        className="p-2 bg-slate-800 text-slate-200 rounded w-full"
      />

      {results.length > 0 && (
        <div className="absolute z-50 bg-slate-900 w-full mt-1 rounded border border-slate-700 max-h-60 overflow-y-auto">
          {results.map((r) => (
            <div
              key={r.symbol}
              onMouseDown={() => handleSelect(r.symbol)}
              className="p-2 hover:bg-slate-700 cursor-pointer text-slate-200"
            >
              <strong>{r.symbol}</strong> — {r.name} ({r.exchange})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSelector;
