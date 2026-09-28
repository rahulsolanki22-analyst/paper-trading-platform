import axios from "./axios";

export const searchStocks = async (query, signal) => {
  const res = await axios.get(`/search?query=${query}`, { signal });
  return res.data;
};
