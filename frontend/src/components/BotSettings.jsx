import React, { useState, useEffect } from "react";
import { fetchBotConfig, updateBotConfig, executeBot } from "../api/aiApi";

const BotSettings = () => {
    const [config, setConfig] = useState({
        active: false,
        confidence_threshold: 70,
        max_position_size: 5000,
        symbols: "AAPL,MSFT,GOOGL,TSLA,AMZN"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await fetchBotConfig();
            setConfig(data);
        } catch (err) {
            console.error("Failed to load bot config");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateBotConfig(config);
        } catch (err) {
            alert("Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleRun = async () => {
        setExecuting(true);
        setResults(null);
        try {
            const res = await executeBot();
            setResults(res.results);
        } catch (err) {
            setResults(["Error executing bot strategy"]);
        } finally {
            setExecuting(false);
        }
    };

    if (loading) return null;

    return (
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Auto-Invest Bot</h2>
                    <p className="text-slate-400 text-sm">Automated trading based on ML signals</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {config.active ? 'Active' : 'Standby'}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                <label className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'}`}>
                            <span className="material-icons text-xl">smart_toy</span>
                        </div>
                        <div>
                            <div className="text-white font-medium">Enable Trading Bot</div>
                            <div className="text-slate-500 text-xs">Bot will monitor signals and execute trades</div>
                        </div>
                    </div>
                    <div
                        onClick={() => setConfig({ ...config, active: !config.active })}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${config.active ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${config.active ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence Threshold</label>
                            <span className="text-indigo-400 font-bold">{config.confidence_threshold}%</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="95"
                            step="5"
                            value={config.confidence_threshold}
                            onChange={(e) => setConfig({ ...config, confidence_threshold: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Per Trade</label>
                            <span className="text-emerald-400 font-bold">${config.max_position_size}</span>
                        </div>
                        <input
                            type="range"
                            min="1000"
                            max="25000"
                            step="500"
                            value={config.max_position_size}
                            onChange={(e) => setConfig({ ...config, max_position_size: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Symbols</label>
                    <input
                        type="text"
                        value={config.symbols}
                        onChange={(e) => setConfig({ ...config, symbols: e.target.value })}
                        placeholder="AAPL,MSFT,TSLA..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span className="material-icons text-base">save</span>
                        )}
                        Save Configuration
                    </button>

                    <button
                        onClick={handleRun}
                        disabled={executing || !config.active}
                        className={`flex-1 px-4 py-3 border rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${executing || !config.active
                            ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10'
                            }`}
                    >
                        {executing ? (
                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span className="material-icons text-base">play_arrow</span>
                        )}
                        Trigger Scan
                    </button>
                </div>

                {results && (
                    <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl max-h-[200px] overflow-y-auto">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Bot Activity</div>
                        {results.map((r, i) => (
                            <div key={i} className="text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800/50 last:border-0 flex items-start gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${r.includes('BOUGHT') ? 'bg-emerald-500' : r.includes('SOLD') ? 'bg-rose-500' : 'bg-slate-600'}`}></span>
                                {r}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BotSettings;
