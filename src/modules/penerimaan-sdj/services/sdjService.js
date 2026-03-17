/**
 * SDJ (Penerimaan) Shipment Service
 * Terhubung langsung ke Backend Strapi API menggunakan httpClient (Axios).
 * Base URL: VITE_API_URL dari .env
 */
import httpClient from "@/core/api/httpClient";
import { useSyncStore } from "@/store/useSyncStore";

/**
 * Normalize Strapi v4 item: flatten { id, attributes: {...} } menjadi flat object.
 * Juga flatten relasi `finish` dan `user`.
 */
function normalizeItem(item) {
  if (!item) return null;
  const attrs = item.attributes || {};

  const finishAttrs = attrs.finish?.data?.attributes || {};
  const finish = {
    id: attrs.finish?.data?.id || null,
    status: finishAttrs.status || null,
    date: finishAttrs.date || null,
    time: finishAttrs.time || null,
    duration: finishAttrs.duration || null,
    date_shift: finishAttrs.date_shift || null,
    shift: finishAttrs.shift || null,
  };

  const userList = attrs.user?.data || [];
  const username = userList[0]?.attributes?.username || null;

  return {
    id: item.id,
    no_do: attrs.no_do,
    coal_type: attrs.coal_type,
    date: attrs.date,
    date_shift: attrs.date_shift,
    time: attrs.time,
    shift: attrs.shift,
    loading: attrs.loading,
    dumping: attrs.dumping,
    net_weight: attrs.net_weight,
    hull_no: attrs.hull_no,
    lot: attrs.lot,
    finish,
    username,
    createdAt: attrs.createdAt,
    updatedAt: attrs.updatedAt,
  };
}

export const sdjService = {
  /**
   * 1. API Khusus Overview (Top Metrics & Recent Shipments)
   */
  async getOverview(params = {}) {
    const strapiParams = {};
    if (params.startDate) strapiParams.startDate = params.startDate;
    if (params.endDate) strapiParams.endDate = params.endDate;
    if (params.shift && params.shift !== "all") strapiParams.shift = params.shift;

    const response = await httpClient.get("/shipments/overview-sdj", { params: strapiParams });
    return {
      success: true,
      analytics: response.data?.analytics || { totalTonnage: 0, totalRitase: 0, avgDurationMins: 0 },
      recentShipments: response.data?.recentShipments || [],
    };
  },

  /**
   * 2. API Khusus Semua Data (List tabel lengkap, tanpa limit 10)
   */
  async getAllData(params = {}, signal = null) {
    const strapiParams = {
      "populate[finish][populate]": "*",
      "populate[user][fields][0]": "username",
      "pagination[page]": params.page || 1,
      "pagination[pageSize]": params.limit === "All" ? 1000 : (params.limit || 100), // Default 100 per page
      "sort": "createdAt:desc",
      "filters[finish][status][$eq]": "FINISH",
    };

    if (params.startDate) strapiParams["filters[date_shift][$gte]"] = params.startDate;
    if (params.endDate) strapiParams["filters[date_shift][$lte]"] = params.endDate;
    if (params.shift && params.shift !== "all") strapiParams["filters[shift][$eq]"] = parseInt(params.shift, 10);
    if (params.search) {
      strapiParams["filters[$or][0][no_do][$containsi]"] = params.search;
      strapiParams["filters[$or][1][hull_no][$containsi]"] = params.search;
      strapiParams["filters[$or][2][lot][$containsi]"] = params.search;
    }

    const response = await httpClient.get("/shipments", { params: strapiParams, signal });
    return {
      success: true,
      data: (response.data?.data || []).map(normalizeItem),
      total: response.data?.meta?.pagination?.total || 0,
    };
  },

  /**
   * 3. API Khusus Analitik Chart Data
   */
  async getAnalytics(params = {}) {
    const strapiParams = {};
    if (params.startDate) strapiParams.startDate = params.startDate;
    if (params.endDate)   strapiParams.endDate   = params.endDate;
    if (params.shift && params.shift !== "all") strapiParams.shift = params.shift;
    if (params.view) strapiParams.view = params.view;

    const response = await httpClient.get("/summaries/analytics-sdj", { params: strapiParams });
    return {
      success: true,
      chartData: response.data?.chartData || [],
    };
  },


  /**
   * Membuat Shipment SDJ Baru.
   * FE cukup kirim: no_do, coal_type, hull_no, lot, loading, dumping, net_weight
   * Backend otomatis isi: time, date, shift, date_shift, user, finish
   */
  async createShipment(payload) {
    if (!navigator.onLine) {
      useSyncStore.getState().addToQueue({
        module: "SDJ",
        type: "CREATE",
        payload,
        timestamp: Date.now(),
      });
      return { success: true, fakeOffline: true };
    }

    const response = await httpClient.post("/shipments", { data: payload });
    return { success: true, data: response.data.data };
  },

  /**
   * Update Data Shipment SDJ. WAJIB menyertakan edit_reason.
   * @param {string|number} id
   * @param {object} edits - { ...fields, edit_reason: "..." }
   */
  async updateShipment(id, edits) {
    if (!navigator.onLine) {
      useSyncStore.getState().addToQueue({
        module: "SDJ",
        type: "UPDATE",
        payload: { id, edits },
        timestamp: Date.now(),
      });
      return { success: true, fakeOffline: true };
    }

    const { edit_reason, ...data } = edits;
    const response = await httpClient.put(`/shipments/${id}`, {
      data,
      edit_reason: edit_reason || "Pembaruan data",
    });
    return { success: true, data: response.data.data };
  },

  /**
   * Update Data Shipment SDJ berdasarkan No DO (QR Scan). WAJIB menyertakan edit_reason.
   * @param {string} no_do
   * @param {object} edits - { ...fields, edit_reason: "..." }
   */
  async updateShipmentByNoDo(no_do, edits) {
    if (!navigator.onLine) {
      useSyncStore.getState().addToQueue({
        module: "SDJ",
        type: "UPDATE_BY_NODO",
        payload: { no_do, edits },
        timestamp: Date.now(),
      });
      return { success: true, fakeOffline: true };
    }

    const { edit_reason, ...data } = edits;
    const response = await httpClient.put(`/shipments/finish/${encodeURIComponent(no_do)}`, {
      data,
      edit_reason: edit_reason || "Scan QR Penerimaan SDJ",
    });
    return { success: true, data: response.data.data };
  },

  /**
   * Hapus Data Shipment SDJ. WAJIB menyertakan edit_reason.
   * @param {string|number} id
   * @param {string} editReason - alasan penghapusan
   */
  async deleteShipment(id, editReason = "Penghapusan data shipment") {
    if (!navigator.onLine) {
      useSyncStore.getState().addToQueue({
        module: "SDJ",
        type: "DELETE",
        payload: { id },
        timestamp: Date.now(),
      });
      return { success: true, fakeOffline: true };
    }

    await httpClient.delete(`/shipments/${id}`, {
      params: { edit_reason: editReason },
    });
    return { success: true };
  },

  /**
   * Ambil daftar lot yang tersedia (distinct) berdasarkan date_shift tertentu.
   * Digunakan untuk Dropdown Filter di FE.
   * @param {string} date_shift - contoh: "2024-03-24"
   */
  async getDistinctLots(date_shift) {
    const params = {};
    if (date_shift) params.date_shift = date_shift;
    const response = await httpClient.get("/shipments/distinct/lots", { params });
    return response.data?.data || [];
  },

  /**
   * Export data Excel dari Backend. Mengembalikan Blob.
   * @param {string} date_shift - contoh: "2024-03-24"
   * @param {string} lot - contoh: "1A" atau "ALL"
   */
  async exportExcel(date_shift, lot = "ALL") {
    const response = await httpClient.get("/shipments/export/excel", {
      params: { date_shift, lot },
      responseType: "blob",
    });

    // Trigger download di browser
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Shipment_SDJ_${date_shift || "all"}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  },
};
