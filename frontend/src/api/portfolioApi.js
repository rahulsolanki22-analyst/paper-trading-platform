import axios from "./axios";

export const fetchPortfolioValuation = async () => {
  const res = await axios.get("/portfolio/valuation");
  return res.data;
};
