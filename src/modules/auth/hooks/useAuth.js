import { useAuthStore } from "../store/authStore.js";
import { authService } from "../services/authService.js";

export function useAuth() {
  const { user, token, role, isAuthenticated, login, logout, updateUser } =
    useAuthStore();

  const handleLogin = async (identifier, password) => {
    try {
      const authData = await authService.login(identifier, password);
      const jwt = authData.jwt;

      const userWithRole = await authService.getMe(jwt);

      const normalizedUser = {
        ...userWithRole,
        role: userWithRole.role?.type || userWithRole.role?.name || "user",
      };

      login(normalizedUser, jwt);
      return normalizedUser;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
  };

  return {
    user,
    token,
    role,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
  };
}
