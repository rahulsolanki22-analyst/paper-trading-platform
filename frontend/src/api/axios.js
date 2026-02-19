import axios from "axios";
import useAuthStore from "../store/authStore";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Add token to requests if available
instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url || "";
    if (status === 401) {
      // Allow auth forms to handle their own errors without redirecting
      if (reqUrl.includes("/auth/login") || reqUrl.includes("/auth/register")) {
        return Promise.reject(error);
      }
      // Token expired or invalid during authenticated calls
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
