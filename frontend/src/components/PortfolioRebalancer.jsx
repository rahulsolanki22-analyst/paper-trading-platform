import React, { useState, useEffect } from "react";
import { fetchRebalanceSuggestions } from "../api/aiApi";
import { buyStock, sellStock } from "../api/tradingApi";

const PortfolioRebalancer = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRebalancing, setIsRebalancing] = useState(false);
    const [message, setMessage] = useState(null);

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            const suggestions = await fetchRebalanceSuggestions();
            setData(suggestions);
            setError(null);
        } catch (err) {
            setError("Could not load suggestions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuggestions();
    }, []);

    const handleRebalance = async () => {
        if (!data || !data.suggestions) return;

        setIsRebalancing(true);
        setMessage("Executing rebalancing trades...");

        try {
            for (const s of data.suggestions) {
                if (s.suggested_trade !== 0) {
                    const qty = Math.abs(s.suggested_trade);

                    if (s.suggested_trade > 0) {
                        await buyStock(s.symbol, qty);
                    } else {
                        await sellStock(s.symbol, qty);
                    }
                }
            }
            setMessage("Rebalancing complete!");
            await loadSuggestions();
        } catch (err) {
            setError("An error occurred during rebalancing.");
        } finally {
            setIsRebalancing(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    if (loading) return (
        <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400">Analyzing portfolio volatility...</p>
        </div>
    );

    if (error) return (
        <div className="bg-rose-900/10 border border-rose-500/20 rounded-2xl p-8 text-center">
            <p className="text-rose-400 mb-4">{error}</p>
            <button onClick={loadSuggestions} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition">
                Try Again
            </button>
        </div>
    );

    if (!data || !data.suggestions || data.suggestions.length === 0) return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="text-slate-500 mb-4">
                <span className="material-icons text-5xl">balance</span>
            </div>
            <p className="text-slate-400">No holdings found to rebalance.</p>
        </div>
    );

    return (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">AI Portfolio Rebalancer</h2>
                    <p className="text-slate-400 text-sm">Suggestions based on Inverse Variance (Volatility) weighting</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Value</div>
                        <div className="text-lg font-bold text-white">${data.total_value.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={handleRebalance}
                        disabled={isRebalancing}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${isRebalancing
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                            : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 active:scale-95"
                            }`}
                    >
                        {isRebalancing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span className="material-icons text-white text-base">auto_fix_high</span>
                        )}
                        {isRebalancing ? "Rebalancing..." : "Apply AI Weights"}
                    </button>
                </div>
            </div>

            {message && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                    <span className="material-icons text-base">check_circle</span>
                    {message}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                            <th className="text-right py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Weight</th>
                            <th className="text-right py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Volatility (Ann.)</th>
                            <th className="text-right py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Weight</th>
                            <th className="text-right py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Trade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {data.suggestions.map((s, i) => (
                            <tr key={i} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="py-4 px-4">
                                    <div className="text-white font-bold">{s.symbol}</div>
                                    <div className="text-slate-500 text-xs">{s.current_quantity} shares @ ${s.current_price.toFixed(2)}</div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <div className="text-slate-200 font-medium">{(s.current_weight * 100).toFixed(2)}%</div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <div className="text-slate-400">{(s.volatility * 100).toFixed(1)}%</div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <div className="text-indigo-400 font-bold">{(s.target_weight * 100).toFixed(2)}%</div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <div className={`font-bold ${s.action === "BUY" ? "text-emerald-400" : s.action === "SELL" ? "text-rose-400" : "text-slate-500"
                                        }`}>
                                        {s.action === "HOLD" ? "Maintain" : `${s.action} ${Math.abs(s.suggested_trade)} shares`}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-800">
                <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="material-icons text-indigo-400 text-sm">info</span>
                    How it works
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                    The Inverse Variance Rebalancer assigns higher weights to assets with lower historical volatility and lower weights to high-volatility assets. This approach aims to minimize the overall portfolio variance and create a more risk-balanced allocation. Calculations are based on the standard deviation of daily returns over the last 30 days.
                </p>
            </div>
        </div>
    );
};

export default PortfolioRebalancer;
