import React, { useEffect, useState } from "react";
import { fetchStocks } from "../api/stocksApi";
import { useNavigate } from "react-router-dom";

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStocks().then(setStocks);
  }, []);

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-xl mb-4">Stocks</h1>

      <div className="grid grid-cols-4 gap-4">
        {stocks.map((s) => (
          <div
            key={s.symbol}
            onClick={() => navigate(`/trade?symbol=${s.symbol}`)}
            className="cursor-pointer bg-slate-900 p-4 rounded hover:bg-slate-800"
          >
            <div className="font-semibold">{s.symbol}</div>
            <div className="text-sm text-slate-400">{s.name}</div>

            <div className="mt-2">₹{s.price}</div>
            <div
              className={`text-sm ${
                s.change_pct >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {s.change_pct}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stocks;
