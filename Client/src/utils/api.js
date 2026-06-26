import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://society-resident-management-app.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// Admin and resident sessions are stored separately (see AuthContext) so that
// an admin tab and a resident tab can stay logged in side by side. Here we
// pick whichever token matches the request being made.
const STORAGE_KEY = {
  admin: "society_admin_session",
  user:  "society_user_session",
};

const roleForUrl = (url = "") =>
  url.startsWith("/admin") || url.startsWith("/auth/admin") ? "admin" : "user";

// Attach the matching JWT to every request
api.interceptors.request.use((config) => {
  const role = roleForUrl(config.url);
  try {
    const stored = localStorage.getItem(STORAGE_KEY[role]);
    const token  = stored ? JSON.parse(stored).token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // ignore malformed/missing session — request goes out unauthenticated
  }
  return config;
});

export default api;