import axios from "./axios";

export const getMarketsStocks = async () => {
  const res = await axios.get("/markets/stocks");
  return res.data;
};

export const addMarketsStock = async (symbol) => {
  const res = await axios.post("/markets/stocks", { symbol });
  return res.data;
};

export const removeMarketsStock = async (symbol) => {
  const res = await axios.delete(`/markets/stocks/${encodeURIComponent(symbol)}`);
  return res.data;
};

export const searchStocks = async (q) => {
  const res = await axios.get(`/stocks/search?q=${encodeURIComponent(q)}`);
  return res.data;
};

