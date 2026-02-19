import axios from "./axios";

export const resetPortfolio = async (amount) => {
  const res = await axios.post(`/portfolio/reset?initial_balance=${amount}`);
  return res.data;
};
