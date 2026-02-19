import axios from "./axios";

export const fetchRebalanceSuggestions = async () => {
    try {
        const res = await axios.get("/ai/rebalance");
        return res.data;
    } catch (error) {
        console.error("Error fetching rebalance suggestions:", error);
        throw error;
    }
};

export const fetchBotConfig = async () => {
    try {
        const res = await axios.get("/ai/bot/config");
        return res.data;
    } catch (error) {
        console.error("Error fetching bot config:", error);
        throw error;
    }
};

export const updateBotConfig = async (config) => {
    try {
        const res = await axios.post("/ai/bot/config", config);
        return res.data;
    } catch (error) {
        console.error("Error updating bot config:", error);
        throw error;
    }
};

export const executeBot = async () => {
    try {
        const res = await axios.post("/ai/bot/execute");
        return res.data;
    } catch (error) {
        console.error("Error executing bot:", error);
        throw error;
    }
};
