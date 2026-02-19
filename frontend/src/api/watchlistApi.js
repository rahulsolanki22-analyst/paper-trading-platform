import axios from "./axios";

// Watchlist API functions

export const getWatchlist = async () => {
    const res = await axios.get("/watchlist");
    return res.data;
};

export const addToWatchlist = async (symbol, notes = null) => {
    const params = new URLSearchParams({ symbol });
    if (notes) params.append("notes", notes);
    const res = await axios.post(`/watchlist/add?${params.toString()}`);
    return res.data;
};

export const removeFromWatchlist = async (symbol) => {
    const res = await axios.delete(`/watchlist/${symbol}`);
    return res.data;
};

export const updateWatchlistNotes = async (symbol, notes) => {
    const res = await axios.put(`/watchlist/${symbol}/notes?notes=${encodeURIComponent(notes)}`);
    return res.data;
};

// Price Alerts API functions

export const getAlerts = async (includeTriggered = false) => {
    const res = await axios.get(`/alerts?include_triggered=${includeTriggered}`);
    return res.data;
};

export const createAlert = async (symbol, targetPrice, condition) => {
    const params = new URLSearchParams({
        symbol,
        target_price: targetPrice.toString(),
        condition
    });
    const res = await axios.post(`/alerts/create?${params.toString()}`);
    return res.data;
};

export const deleteAlert = async (alertId) => {
    const res = await axios.delete(`/alerts/${alertId}`);
    return res.data;
};

export const checkAlerts = async () => {
    const res = await axios.get("/alerts/check");
    return res.data;
};

export const getTriggeredAlerts = async () => {
    const res = await axios.get("/alerts/triggered");
    return res.data;
};

// Pending Orders API functions

export const getPendingOrders = async () => {
    const res = await axios.get("/trade/pending-orders");
    return res.data;
};

export const createPendingOrder = async (symbol, orderType, quantity, triggerPrice, condition, trailingPercent = null) => {
    const params = new URLSearchParams({
        symbol,
        order_type: orderType,
        quantity: quantity.toString(),
        trigger_price: triggerPrice.toString(),
        condition
    });
    if (trailingPercent) params.append("trailing_percent", trailingPercent.toString());
    const res = await axios.post(`/trade/pending-orders/create?${params.toString()}`);
    return res.data;
};

export const cancelPendingOrder = async (orderId) => {
    const res = await axios.delete(`/trade/pending-orders/${orderId}`);
    return res.data;
};

export const checkPendingOrders = async () => {
    const res = await axios.post("/trade/check-pending-orders");
    return res.data;
};
