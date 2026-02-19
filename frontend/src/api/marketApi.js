import axios from "./axios";

export const fetchCandles = async (symbol = "AAPL", interval = "1d") => {
  const res = await axios.get(
    `/market/candles?symbol=${symbol}&interval=${interval}`
  );
  return res.data.candles || [];
};

export const fetchIndicators = async (symbol = "AAPL", interval = "1d", indicators = null) => {
  let url = `/market/indicators?symbol=${symbol}&interval=${interval}`;
  if (indicators) {
    url += `&indicators=${indicators.join(",")}`;
  }
  const res = await axios.get(url);
  return res.data.indicators || {};
};
