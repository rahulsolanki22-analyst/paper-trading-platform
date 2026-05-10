import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import useTradingStore from "../store/tradingStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card className="relative z-40 overflow-visible">
      <CardContent className="space-y-2 pt-6">
        <Label htmlFor="stock-search" className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Search symbol
        </Label>
        <div className="relative">
          <Input
            id="stock-search"
            type="text"
            placeholder={`Search (current: ${symbol})`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {loading ? (
            <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
              …
            </span>
          ) : null}
        </div>

        {results.length > 0 ? (
          <div className="bg-popover text-popover-foreground absolute left-0 right-0 top-full z-[90] mt-1 max-h-64 overflow-y-auto rounded-lg border border-border shadow-lg">
            {results.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(s.symbol)}
                className="hover:bg-muted flex w-full flex-col items-stretch border-b border-border px-3 py-2.5 text-left last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold">{s.symbol}</span>
                  {s.exchange ? <span className="text-muted-foreground text-xs">{s.exchange}</span> : null}
                </div>
                {s.name ? <span className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{s.name}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default StockSearch;
