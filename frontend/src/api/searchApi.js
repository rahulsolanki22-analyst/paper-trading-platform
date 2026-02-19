import axios from "./axios";

export const searchStocks = async (query) => {
  const res = await axios.get(`/search?query=${query}`);
  return res.data;
};
