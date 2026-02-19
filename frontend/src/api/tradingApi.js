import axios from "./axios";

export const getPortfolio = async () => {
  const res = await axios.get("/portfolio");
  return res.data;
};

export const getHoldings = async () => {
  const res = await axios.get("/trade/holdings");
  return res.data;
};

export const buyStock = async (symbol, quantity) => {
  const res = await axios.post(
    `/trade/buy?symbol=${symbol}&quantity=${quantity}`
  );
  return res.data;
};

export const sellStock = async (symbol, quantity) => {
  const res = await axios.post(
    `/trade/sell?symbol=${symbol}&quantity=${quantity}`
  );
  return res.data;
};
