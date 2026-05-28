import axios from "axios";
import useAuthStore from "../store/authStore";

const API_URL = "http://localhost:8000";

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getDiaryTrades = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.symbol) params.append("symbol", filters.symbol);
  if (filters.status) params.append("status", filters.status);
  
  const response = await axios.get(`${API_URL}/diary/trades?${params.toString()}`, {
    headers: getHeaders(),
  });
  return response.data;
};

export const createDiaryTrade = async (tradeData) => {
  const response = await axios.post(`${API_URL}/diary/trade`, tradeData, {
    headers: getHeaders(),
  });
  return response.data;
};

export const updateDiaryTrade = async (tradeId, updateData) => {
  const response = await axios.put(`${API_URL}/diary/trade/${tradeId}`, updateData, {
    headers: getHeaders(),
  });
  return response.data;
};

export const deleteDiaryTrade = async (tradeId) => {
  const response = await axios.delete(`${API_URL}/diary/trade/${tradeId}`, {
    headers: getHeaders(),
  });
  return response.data;
};

export const getDiaryAnalytics = async () => {
  const response = await axios.get(`${API_URL}/diary/analytics`, {
    headers: getHeaders(),
  });
  return response.data;
};

export const uploadScreenshot = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const headers = getHeaders();
  headers["Content-Type"] = "multipart/form-data";
  
  const response = await axios.post(`${API_URL}/diary/upload`, formData, {
    headers,
  });
  return response.data;
};
