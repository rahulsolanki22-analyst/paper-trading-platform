import axios from "./axios";

export const fetchNews = async (symbol) => {
  try {
    const res = await axios.get(`/news?symbol=${symbol}`);
    return res.data || [];
  } catch (error) {
    // Return empty array instead of throwing
    console.error("Error fetching news:", error);
    return [];
  }
};

export const fetchNewsWithSentiment = async (symbol) => {
  try {
    const res = await axios.get(`/news/sentiment?symbol=${symbol}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching news sentiment:", error);
    return { sentiment_score: 0, sentiment_label: "Neutral", articles: [] };
  }
};
