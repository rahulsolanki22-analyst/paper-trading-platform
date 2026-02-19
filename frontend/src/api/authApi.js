import axios from "./axios";

export const register = async (username, email, password) => {
  const res = await axios.post("/auth/register", {
    username,
    email,
    password,
  });
  return res.data;
};

export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const res = await axios.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return res.data;
};

export const getCurrentUser = async (token) => {
  const res = await axios.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

