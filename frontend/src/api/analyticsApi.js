import axios from "./axios";

// Analytics API functions

export const getAnalyticsSummary = async () => {
  const res = await axios.get("/analytics/summary");
  return res.data;
};

export const getEquityCurve = async (days = 30) => {
  const res = await axios.get(`/analytics/equity-curve?days=${days}`);
  return res.data;
};

export const getTradeAnalysis = async () => {
  const res = await axios.get("/analytics/trade-analysis");
  return res.data;
};

export const createPortfolioSnapshot = async () => {
  const res = await axios.post("/analytics/snapshot");
  return res.data;
};
