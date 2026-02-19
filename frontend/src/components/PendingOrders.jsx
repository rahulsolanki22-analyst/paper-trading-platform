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
            STOP_LOSS: "bg-red-900/50 text-red-400 border-red-700",
            TAKE_PROFIT: "bg-green-900/50 text-green-400 border-green-700",
            TRAILING_STOP: "bg-yellow-900/50 text-yellow-400 border-yellow-700"
        };
        const labels = {
            STOP_LOSS: "Stop Loss",
            TAKE_PROFIT: "Take Profit",
            TRAILING_STOP: "Trailing Stop"
        };
        return (
            <span className={`text-xs px-2 py-0.5 rounded border ${styles[condition]}`}>
                {labels[condition]}
            </span>
        );
    };

    if (orders.length === 0 && !loading) {
        return null; // Don't show panel if no pending orders
    }

    return (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h3 className="text-slate-200 text-lg font-semibold mb-4">Pending Orders</h3>

            {loading ? (
                <div className="text-slate-400 text-sm py-2 text-center">Loading...</div>
            ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="p-3 bg-slate-800 rounded flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-slate-200 font-semibold">{order.symbol}</span>
                                    {getConditionBadge(order.condition)}
                                </div>
                                <div className="text-slate-400 text-xs">
                                    {order.order_type} {order.quantity} @ ₹{order.trigger_price}
                                    <span className="text-slate-500 ml-2">
                                        (now: ₹{order.current_price})
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleCancel(order.id)}
                                className="text-slate-400 hover:text-red-400 transition-colors text-sm px-2 py-1"
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
