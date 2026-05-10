import axios from "./axios";

export const register = async (username, email, password) => {
  const res = await axios.post("/auth/register", {
    username,
    email,
    password,
  });
  return res.data;
};

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  // Backend uses OAuth2PasswordRequestForm; field name is "username" by spec.
  // We send the user's email in that field.
  formData.append("username", email);
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

export const fetchMe = async () => {
  const res = await axios.get("/auth/me");
  return res.data;
};

