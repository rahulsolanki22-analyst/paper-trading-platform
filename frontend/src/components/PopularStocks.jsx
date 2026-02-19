import React from "react";
import { useNavigate } from "react-router-dom";

const POPULAR = [
  "AAPL",
  "TSLA",
  "GOOGL",
  "MSFT",
  "AMZN",
  "RELIANCE.NS",
  "TCS.NS",
];

const PopularStocks = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-8">
      <h3 className="text-lg mb-3">Popular Stocks</h3>

      <div className="flex flex-wrap gap-3">
        {POPULAR.map((s) => (
          <button
            key={s}
            onClick={() => navigate(`/trade?symbol=${s}`)}
            className="bg-slate-900 px-4 py-2 rounded hover:bg-slate-800"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PopularStocks;
