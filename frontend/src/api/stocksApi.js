import axios from "./axios";

export const fetchStocks = async () => {
  const res = await axios.get("/stocks");
  return res.data;
};

export const fetchStockDetails = async (symbol) => {
  const res = await axios.get(`/stocks/${symbol}/details`);
  return res.data;
};
