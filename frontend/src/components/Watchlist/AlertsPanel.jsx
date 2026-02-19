import React, { useEffect, useState } from "react";
import { getAlerts, createAlert, deleteAlert, checkAlerts } from "../../api/watchlistApi";
import useAuthStore from "../../store/authStore";

const AlertsPanel = ({ currentSymbol, currentPrice }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newAlert, setNewAlert] = useState({
        targetPrice: "",
        condition: "ABOVE"
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuthStore();

    const loadAlerts = async () => {
        if (!isAuthenticated) return;
        try {
            const data = await getAlerts(false);
            setAlerts(data.alerts || []);
        } catch (err) {
            console.error("Failed to load alerts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, [isAuthenticated]);

    // Poll for triggered alerts
    useEffect(() => {
        if (!isAuthenticated) return;

        const checkForTriggers = async () => {
            try {
                const result = await checkAlerts();
                if (result.triggered_count > 0) {
                    // Reload alerts after some were triggered
                    loadAlerts();
                    // Show notification (you could use a toast library here)
                    alert(`🔔 ${result.triggered_count} alert(s) triggered!`);
                }
            } catch (err) {
                console.error("Error checking alerts:", err);
            }
        };

        const interval = setInterval(checkForTriggers, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const handleCreate = async () => {
        if (!currentSymbol || !newAlert.targetPrice) return;

        setCreating(true);
        setError(null);

        try {
            await createAlert(
                currentSymbol,
                parseFloat(newAlert.targetPrice),
                newAlert.condition
            );
            setNewAlert({ targetPrice: "", condition: "ABOVE" });
            setShowCreate(false);
            await loadAlerts();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to create alert");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (alertId) => {
        try {
            await deleteAlert(alertId);
            setAlerts(alerts.filter((a) => a.id !== alertId));
        } catch (err) {
            console.error("Failed to delete alert:", err);
        }
    };

    return (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-200 text-lg font-semibold">Price Alerts</h3>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
                >
                    {showCreate ? "Cancel" : "+ Alert"}
                </button>
            </div>

            {/* Create Alert Form */}
            {showCreate && currentSymbol && (
                <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                    <div className="text-slate-300 text-sm mb-2">
                        Alert for <span className="font-semibold text-slate-200">{currentSymbol}</span>
                        {currentPrice && (
                            <span className="text-slate-400"> (Current: ₹{currentPrice})</span>
                        )}
                    </div>

                    <div className="flex gap-2 mb-2">
                        <select
                            value={newAlert.condition}
                            onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                            className="bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm border border-slate-600"
                        >
                            <option value="ABOVE">Price goes above</option>
                            <option value="BELOW">Price goes below</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Target price"
                            value={newAlert.targetPrice}
                            onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                            className="flex-1 bg-slate-700 text-slate-200 px-3 py-2 rounded text-sm border border-slate-600"
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs mb-2">{error}</div>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={creating || !newAlert.targetPrice}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {creating ? "Creating..." : "Create Alert"}
                    </button>
                </div>
            )}

            {showCreate && !currentSymbol && (
                <div className="mb-4 p-3 bg-slate-800 rounded-lg text-slate-400 text-sm text-center">
                    Select a stock to create an alert
                </div>
            )}

            {/* Alerts List */}
            {loading ? (
                <div className="text-slate-400 text-sm py-4 text-center">Loading...</div>
            ) : alerts.length === 0 ? (
                <div className="text-slate-500 text-sm py-4 text-center">
                    No active alerts.
                    <br />
                    Create alerts to get notified.
                </div>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-3 rounded flex items-center justify-between ${alert.symbol === currentSymbol
                                    ? "bg-purple-900/30 border border-purple-700"
                                    : "bg-slate-800"
                                }`}
                        >
                            <div>
                                <div className="text-slate-200 font-semibold text-sm">{alert.symbol}</div>
                                <div className="text-slate-400 text-xs">
                                    {alert.condition === "ABOVE" ? "↑" : "↓"} ₹{alert.target_price}
                                    <span className="text-slate-500 ml-2">
                                        (now: ₹{alert.current_price})
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(alert.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                title="Delete alert"
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

export default AlertsPanel;
