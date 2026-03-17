import { create } from "zustand";
import {
  setSecureItem,
  getSecureItem,
  clearSecureStorage,
} from "@/shared/utils/secureStorage.js";

export const useAuthStore = create((set) => ({
  user: getSecureItem("user") || null,
  token: getSecureItem("token") || null,
  role: getSecureItem("role") || null,
  isAuthenticated: !!getSecureItem("token"),
  login: (user, token) => {
    setSecureItem("user", user);
    setSecureItem("token", token);
    setSecureItem("role", user.role);
    set({ user, token, role: user.role, isAuthenticated: true });
  },

  logout: () => {
    clearSecureStorage();
    set({ user: null, token: null, role: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    setSecureItem("user", user);
    set({ user });
  },
}));
