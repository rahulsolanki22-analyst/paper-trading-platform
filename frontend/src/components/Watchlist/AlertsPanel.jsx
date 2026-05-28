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
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-card-foreground text-sm font-semibold">Price Alerts</h3>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md font-medium transition-colors"
                >
                    {showCreate ? "Cancel" : "+ Alert"}
                </button>
            </div>

            {/* Create Alert Form */}
            {showCreate && currentSymbol && (
                <div className="mb-4 p-3 bg-muted border border-border rounded-lg shadow-inner">
                    <div className="text-muted-foreground text-xs mb-2">
                        Alert for <span className="font-bold text-card-foreground">{currentSymbol}</span>
                        {currentPrice && (
                            <span className="text-muted-foreground/80 font-normal"> (Current: ₹{currentPrice})</span>
                        )}
                    </div>

                    <div className="flex gap-2 mb-2">
                        <select
                            value={newAlert.condition}
                            onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                            className="bg-background text-foreground px-3 py-2 rounded-md text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="ABOVE">Price goes above</option>
                            <option value="BELOW">Price goes below</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Target price"
                            value={newAlert.targetPrice}
                            onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                            className="flex-1 bg-background text-foreground px-3 py-2 rounded-md text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    {error && (
                        <div className="text-destructive text-xs mb-2 font-semibold">{error}</div>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={creating || !newAlert.targetPrice}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                        {creating ? "Creating..." : "Create Alert"}
                    </button>
                </div>
            )}

            {showCreate && !currentSymbol && (
                <div className="mb-4 p-3 bg-muted border border-border rounded-lg text-muted-foreground text-xs text-center font-medium">
                    Select a stock to create an alert
                </div>
            )}

            {/* Alerts List */}
            {loading ? (
                <div className="text-muted-foreground text-xs py-4 text-center">Loading...</div>
            ) : alerts.length === 0 ? (
                <div className="text-muted-foreground/75 text-xs py-4 text-center font-medium">
                    No active alerts.
                    <br />
                    Create alerts to get notified.
                </div>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-3 rounded-lg flex items-center justify-between border transition-all ${alert.symbol === currentSymbol
                                    ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60"
                                    : "bg-muted/40 border-border/40 hover:bg-muted/60"
                                }`}
                        >
                            <div>
                                <div className="text-card-foreground font-semibold text-sm">{alert.symbol}</div>
                                <div className="text-muted-foreground text-xs font-medium">
                                    {alert.condition === "ABOVE" ? "↑" : "↓"} ₹{alert.target_price}
                                    <span className="text-muted-foreground/60 ml-2 font-normal">
                                        (now: ₹{alert.current_price})
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(alert.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
