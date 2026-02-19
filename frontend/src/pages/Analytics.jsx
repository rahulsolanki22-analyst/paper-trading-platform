import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalyticsSummary, getTradeAnalysis } from "../api/analyticsApi";
import useAuthStore from "../store/authStore";
import useLanguageStore from "../store/languageStore";

const Analytics = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuthStore();
    const { translate } = useLanguageStore();
    const [summary, setSummary] = useState(null);
    const [tradeAnalysis, setTradeAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const [summaryData, analysisData] = await Promise.all([
                    getAnalyticsSummary(),
                    getTradeAnalysis()
                ]);
                setSummary(summaryData);
                setTradeAnalysis(analysisData);
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400 text-xl">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Performance Analytics
                    </h1>
                    {user && (
                        <span className="text-slate-400 text-sm">
                            Welcome, <span className="text-slate-200 font-semibold">{user.username}</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/trade")}
                        className="px-4 py-2 text-slate-300 hover:text-slate-200 text-sm"
                    >
                        Trading
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 text-slate-300 hover:text-slate-200 text-sm"
                    >
                        {translate("home")}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                    >
                        {translate("logout")}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Total Portfolio Value</div>
                    <div className="text-2xl font-bold text-slate-200">
                        ₹{summary?.total_portfolio_value?.toLocaleString("en-IN") || "0"}
                    </div>
                    <div className={`text-sm mt-1 ${(summary?.total_return || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {(summary?.total_return || 0) >= 0 ? "+" : ""}₹{summary?.total_return?.toLocaleString("en-IN") || "0"}
                        ({summary?.total_return_percent?.toFixed(2) || 0}%)
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Total Realized P&L</div>
                    <div className={`text-2xl font-bold ${(summary?.total_realized_pnl || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {(summary?.total_realized_pnl || 0) >= 0 ? "+" : ""}₹{summary?.total_realized_pnl?.toLocaleString("en-IN") || "0"}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Win Rate</div>
                    <div className="text-2xl font-bold text-blue-400">
                        {summary?.win_rate?.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                        {summary?.win_count || 0}W / {summary?.loss_count || 0}L
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-sm mb-1">Total Trades</div>
                    <div className="text-2xl font-bold text-purple-400">
                        {summary?.total_trades || 0}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                        {summary?.total_buys || 0} buys / {summary?.total_sells || 0} sells
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "overview"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab("trades")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "trades"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                >
                    Trade Analysis
                </button>
                
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Performance Metrics */}
                    <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold mb-4 text-slate-200">Performance Metrics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                <span className="text-slate-400">Profit Factor</span>
                                <span className="text-slate-200 font-semibold">{summary?.profit_factor?.toFixed(2) || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                <span className="text-slate-400">Average Win</span>
                                <span className="text-green-400 font-semibold">+₹{summary?.average_win?.toLocaleString("en-IN") || "0"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                <span className="text-slate-400">Average Loss</span>
                                <span className="text-red-400 font-semibold">₹{summary?.average_loss?.toLocaleString("en-IN") || "0"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-800">
                                <span className="text-slate-400">Cash Balance</span>
                                <span className="text-slate-200 font-semibold">₹{summary?.cash_balance?.toLocaleString("en-IN") || "0"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-400">Holdings Value</span>
                                <span className="text-slate-200 font-semibold">₹{summary?.holdings_value?.toLocaleString("en-IN") || "0"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Best/Worst Trades */}
                    <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-semibold mb-4 text-slate-200">Notable Trades</h3>
                        <div className="space-y-4">
                            {summary?.best_trade && (
                                <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
                                    <div className="text-green-400 text-sm mb-1">Best Trade</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-200 font-semibold">{summary.best_trade.symbol}</span>
                                        <span className="text-green-400 font-bold">+₹{summary.best_trade.pnl?.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            )}
                            {summary?.worst_trade && (
                                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                                    <div className="text-red-400 text-sm mb-1">Worst Trade</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-200 font-semibold">{summary.worst_trade.symbol}</span>
                                        <span className="text-red-400 font-bold">₹{summary.worst_trade.pnl?.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            )}
                            {!summary?.best_trade && !summary?.worst_trade && (
                                <div className="text-center text-slate-500 py-8">
                                    No completed trades yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "trades" && (
                <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-200">
                            Trade Analysis by Symbol ({tradeAnalysis?.total_symbols_traded || 0} symbols traded)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800">
                                <tr>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Symbol</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Buys</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Sells</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Buy Value</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Sell Value</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Realized P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tradeAnalysis?.by_symbol?.map((s) => (
                                    <tr
                                        key={s.symbol}
                                        className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                                        onClick={() => navigate(`/trade?symbol=${encodeURIComponent(s.symbol)}`)}
                                    >
                                        <td className="py-3 px-4 text-slate-200 font-semibold">{s.symbol}</td>
                                        <td className="py-3 px-4 text-right text-slate-300">{s.total_buys}</td>
                                        <td className="py-3 px-4 text-right text-slate-300">{s.total_sells}</td>
                                        <td className="py-3 px-4 text-right text-slate-300">₹{s.total_buy_value?.toLocaleString("en-IN")}</td>
                                        <td className="py-3 px-4 text-right text-slate-300">₹{s.total_sell_value?.toLocaleString("en-IN")}</td>
                                        <td className={`py-3 px-4 text-right font-semibold ${s.realized_pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                                            {s.realized_pnl >= 0 ? "+" : ""}₹{s.realized_pnl?.toLocaleString("en-IN")}
                                        </td>
                                    </tr>
                                ))}
                                {(!tradeAnalysis?.by_symbol || tradeAnalysis.by_symbol.length === 0) && (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-slate-500">
                                            No trades yet. Start trading to see analysis.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            
        </div>
    );
};

export default Analytics;
