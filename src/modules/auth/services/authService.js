import httpClient from "@/core/api/httpClient.js";

export const authService = {
  /**
   * Login with identifier (username/email) and password.
   * Strapi v4 auth endpoint: POST /auth/local
   */
  async login(identifier, password) {
    const response = await httpClient.post("/auth/local", {
      identifier,
      password,
    });
    return response.data; // Expected { jwt, user }
  },

  /**
   * Get current user profile with populated Role.
   */
  async getMe(jwt) {
    const response = await httpClient.get("/users/me", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      params: {
        populate: ["role"],
      },
    });
    return response.data;
  },

  /**
   * Refresh token (if using refresh token strategy).
   */
  async refreshToken(refreshToken) {
    const response = await httpClient.post("/auth/refresh", { refreshToken });
    return response.data;
  },
};
