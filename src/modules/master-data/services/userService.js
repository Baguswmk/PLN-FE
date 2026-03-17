/**
 * User Management Service
 * Mengambil dan mengelola data User dari Strapi Plugin Users-Permissions.
 */
import httpClient from "@/core/api/httpClient";

export const userService = {
  /**
   * Ambil daftar semua user.
   * @param {object} params - { page, pageSize, search }
   */
  async getUsers(params = {}) {
    const strapiParams = {
      "pagination[page]": params.page || 1,
      "pagination[pageSize]": params.pageSize || 25,
      "populate[role][fields][0]": "name",
    };
    if (params.search) {
      strapiParams["filters[$or][0][username][$containsi]"] = params.search;
      strapiParams["filters[$or][1][email][$containsi]"] = params.search;
    }

    const response = await httpClient.get("/users", { params: strapiParams });
    return {
      success: true,
      data: response.data || [],
    };
  },

  /**
   * Buat User baru.
   * @param {object} payload - { username, email, password, role (id) }
   */
  async createUser(payload) {
    const response = await httpClient.post("/users", payload);
    return { success: true, data: response.data };
  },

  /**
   * Update User (username, email, role).
   * @param {number|string} id
   * @param {object} payload
   */
  async updateUser(id, payload) {
    const response = await httpClient.put(`/users/${id}`, payload);
    return { success: true, data: response.data };
  },

  /**
   * Hapus User berdasarkan ID.
   * @param {number|string} id
   */
  async deleteUser(id) {
    await httpClient.delete(`/users/${id}`);
    return { success: true };
  },

  /**
   * Ambil daftar roles yang tersedia.
   */
  async getRoles() {
    const response = await httpClient.get("/users-permissions/roles");
    return response.data?.roles || [];
  }
};
