import React, { useEffect, useState } from "react";
import { getPendingOrders, cancelPendingOrder, checkPendingOrders } from "../api/watchlistApi";
import useAuthStore from "../store/authStore";

const PendingOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuthStore();

    const loadOrders = async () => {
        if (!isAuthenticated) return;
        try {
            const data = await getPendingOrders();
            setOrders(data.pending_orders || []);
        } catch (err) {
            console.error("Failed to load pending orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [isAuthenticated]);

    // Check for triggered orders periodically
    useEffect(() => {
        if (!isAuthenticated) return;

        const checkTriggers = async () => {
            try {
                const result = await checkPendingOrders();
                if (result.triggered_count > 0) {
                    loadOrders();
                    alert(`⚡ ${result.triggered_count} pending order(s) triggered!`);
                }
            } catch (err) {
                console.error("Error checking pending orders:", err);
            }
        };

        const interval = setInterval(checkTriggers, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const handleCancel = async (orderId) => {
        try {
            await cancelPendingOrder(orderId);
            setOrders(orders.filter((o) => o.id !== orderId));
        } catch (err) {
            console.error("Failed to cancel order:", err);
        }
    };

    const getConditionBadge = (condition) => {
        const styles = {
            STOP_LOSS: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60",
            TAKE_PROFIT: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/60",
            TRAILING_STOP: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/60"
        };
        const labels = {
            STOP_LOSS: "Stop Loss",
            TAKE_PROFIT: "Take Profit",
            TRAILING_STOP: "Trailing Stop"
        };
        return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold tracking-wide ${styles[condition]}`}>
                {labels[condition]}
            </span>
        );
    };

    if (orders.length === 0 && !loading) {
        return null; // Don't show panel if no pending orders
    }

    return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <h3 className="text-card-foreground text-sm font-semibold mb-3">Pending Orders</h3>

            {loading ? (
                <div className="text-muted-foreground text-sm py-2 text-center">Loading...</div>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="p-3 bg-muted/40 border border-border/50 rounded-lg flex items-center justify-between transition-all hover:bg-muted/60"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-card-foreground font-semibold">{order.symbol}</span>
                                    {getConditionBadge(order.condition)}
                                </div>
                                <div className="text-muted-foreground text-xs font-medium">
                                    {order.order_type} {order.quantity} @ ₹{order.trigger_price}
                                    <span className="text-muted-foreground/60 ml-2 font-normal">
                                        (now: ₹{order.current_price})
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleCancel(order.id)}
                                className="text-muted-foreground hover:text-destructive font-medium transition-colors text-sm px-2 py-1"
                            >
                                Cancel
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingOrders;
