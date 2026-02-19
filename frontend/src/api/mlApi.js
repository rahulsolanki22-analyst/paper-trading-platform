import axios from "./axios";

export const fetchMLSignal = async (symbol = "AAPL") => {
  const res = await axios.get(`/ml-signal/signal?symbol=${symbol}`);
  return res.data;
};

