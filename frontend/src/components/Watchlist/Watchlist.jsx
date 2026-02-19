import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "../../api/watchlistApi";
import useAuthStore from "../../store/authStore";
import useTradingStore from "../../store/tradingStore";

const Watchlist = ({ currentSymbol }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const { setSymbol } = useTradingStore();
    const navigate = useNavigate();

    const loadWatchlist = async () => {
        if (!isAuthenticated) return;
        try {
            const data = await getWatchlist();
            setItems(data.watchlist || []);
        } catch (err) {
            console.error("Failed to load watchlist:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWatchlist();
    }, [isAuthenticated]);

    const handleAddCurrent = async () => {
        if (!currentSymbol) return;
        setAdding(true);
        try {
            await addToWatchlist(currentSymbol);
            await loadWatchlist();
        } catch (err) {
            console.error("Failed to add to watchlist:", err);
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (symbol, e) => {
        e.stopPropagation();
        try {
            await removeFromWatchlist(symbol);
            setItems(items.filter((i) => i.symbol !== symbol));
        } catch (err) {
            console.error("Failed to remove from watchlist:", err);
        }
    };

    const handleSelect = (symbol) => {
        setSymbol(symbol);
        navigate(`/trade?symbol=${encodeURIComponent(symbol)}`);
    };

    const isInWatchlist = items.some((i) => i.symbol === currentSymbol);

    return (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-200 text-lg font-semibold">Watchlist</h3>
                {currentSymbol && !isInWatchlist && (
                    <button
                        onClick={handleAddCurrent}
                        disabled={adding}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
                    >
                        {adding ? "Adding..." : `+ ${currentSymbol}`}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-slate-400 text-sm py-4 text-center">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-slate-500 text-sm py-4 text-center">
                    Your watchlist is empty.
                    <br />
                    Add stocks to track them here.
                </div>
            ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                        <div
                            key={item.symbol}
                            onClick={() => handleSelect(item.symbol)}
                            className={`p-3 rounded cursor-pointer transition-colors flex items-center justify-between ${item.symbol === currentSymbol
                                    ? "bg-blue-900/40 border border-blue-700"
                                    : "bg-slate-800 hover:bg-slate-700"
                                }`}
                        >
                            <div>
                                <div className="text-slate-200 font-semibold">{item.symbol}</div>
                                <div className="text-slate-400 text-sm">
                                    ₹{item.current_price?.toLocaleString("en-IN")}
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleRemove(item.symbol, e)}
                                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                title="Remove from watchlist"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Watchlist;
