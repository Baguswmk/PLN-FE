import axios from "axios";
import { getSecureItem } from "@/shared/utils/secureStorage.js";

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:1337/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Bearer token
httpClient.interceptors.request.use(
  (config) => {
    const token = getSecureItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 globally
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      import("@/modules/auth/store/authStore.js").then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default httpClient;
