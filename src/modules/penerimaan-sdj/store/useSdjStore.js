import { create } from "zustand";
import { startOfMonth, endOfMonth } from "date-fns";
import debounce from "lodash/debounce";
import DOMPurify from "dompurify";
import { sdjService } from "../services/sdjService";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 menit

export const useSdjStore = create((set, get) => ({
  // Data State
  data: [],
  recentData: [],
  totalItems: 0,
  isLoading: false,
  error: null,
  analytics: {
    totalTonnage: 0,
    totalRitase: 0,
    chartData: [],
  },
  analyticsView: "daily",

  // Table Config State
  currentPage: 1,
  itemsPerPage: 10,
  searchQuery: "",
  dateRange: { from:new Date(), to: new Date() },
  shift: "all",

  // Tab management (Hybrid Strategy)
  activeTab: "overview",
  _lastFetched: { overview: null, data: null, analytics: null },

  // Actions: filter state
  setDateRange: (range) => set({ dateRange: range }),
  setShift: (shift) => set({ shift }),
  setAnalyticsView: (view) => set({ analyticsView: view }),
  setCurrentPage: (page) => {
    set({ currentPage: page });
    get().fetchData();
  },
  setItemsPerPage: (limit) => {
    set({ itemsPerPage: limit, currentPage: 1 });
    get().fetchData();
  },

  _debouncedFetch: debounce((fetchFn) => fetchFn(), 500),
  _abortController: null,

  setSearchQuery: (query) => {
    set({ searchQuery: query, currentPage: 1 });
    get()._debouncedFetch(get().fetchData);
  },

  // Tab change: lazy fetch saat tab aktif (pakai cache kalau masih fresh)
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    const fetchMap = {
      overview: () => get().fetchOverview(),
      data: () => get().fetchData(),
      analytics: () => get().fetchAnalytics({ view: get().analyticsView }),
    };
    fetchMap[tab]?.();
  },

  // Cek apakah data masih fresh
  _isFresh: (scope) => {
    const ts = get()._lastFetched[scope];
    return ts && Date.now() - ts < STALE_THRESHOLD_MS;
  },

  // Terapkan filter → hanya refresh tab yang sedang aktif
  applyFilters: () => {
    // Invalidate semua cache dulu
    set({ _lastFetched: { overview: null, data: null, analytics: null } });
    const tab = get().activeTab;
    const fetchMap = {
      overview: () => get().fetchOverview(),
      data: () => get().fetchData(),
      analytics: () => get().fetchAnalytics({ view: get().analyticsView }),
    };
    fetchMap[tab]?.();
  },

  // ─── FETCH OVERVIEW (Tab default) ───────────────────────────────────────────
  fetchOverview: async () => {
    if (get()._isFresh("overview")) return;
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const params = {
        startDate: state.dateRange?.from,
        endDate: state.dateRange?.to,
        shift: state.shift,
      };
      const response = await sdjService.getOverview(params);
      if (response.success) {
        set({
          recentData: response.recentShipments,
          analytics: {
            ...get().analytics,
            totalTonnage: response.analytics.totalTonnage,
            totalRitase: response.analytics.totalRitase,
          },
          _lastFetched: { ...get()._lastFetched, overview: Date.now() },
        });
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── FETCH TABLE DATA (Tab "Semua Data") ────────────────────────────────────
  fetchData: async (customParams = {}) => {
    const currentController = get()._abortController;
    if (currentController) currentController.abort();
    const newController = new AbortController();
    set({ _abortController: newController, isLoading: true, error: null });

    try {
      const state = get();
      const params = {
        page: state.currentPage,
        limit: state.itemsPerPage,
        search: state.searchQuery,
        startDate: state.dateRange?.from,
        endDate: state.dateRange?.to,
        shift: state.shift,
        ...customParams,
      };
      const response = await sdjService.getAllData(params, newController.signal);
      if (response.success) {
        set({
          data: response.data,
          totalItems: response.total,
          _lastFetched: { ...get()._lastFetched, data: Date.now() },
        });
      }
    } catch (error) {
      if (error.name !== "AbortError" && error.message !== "AbortError") {
        set({ error: error.message });
      }
    } finally {
      if (get()._abortController === newController) {
        set({ isLoading: false, _abortController: null });
      }
    }
  },

  // ─── FETCH ANALYTICS (Tab "Analitik") ───────────────────────────────────────
  fetchAnalytics: async (customParams = {}) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const selectedView = customParams.view || state.analyticsView || "daily";
      const params = {
        startDate: state.dateRange?.from,
        endDate: state.dateRange?.to,
        shift: state.shift,
        view: selectedView,
      };
      const response = await sdjService.getAnalytics(params);
      if (response.success) {
        set({
          analyticsView: selectedView,
          analytics: { ...get().analytics, chartData: response.chartData },
          _lastFetched: { ...get()._lastFetched, analytics: Date.now() },
        });
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── MUTATIONS ───────────────────────────────────────────────────────────────
  createItem: async (payload) => {
    try {
      const sanitizedPayload = { ...payload };
      Object.keys(sanitizedPayload).forEach((key) => {
        if (typeof sanitizedPayload[key] === "string") {
          sanitizedPayload[key] = DOMPurify.sanitize(sanitizedPayload[key]);
        }
      });
      await sdjService.createShipment(sanitizedPayload);
      set({ _lastFetched: { overview: null, data: null, analytics: null } });
      get().setActiveTab(get().activeTab);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateItem: async (id, payload) => {
    try {
      const sanitizedPayload = { ...payload };
      Object.keys(sanitizedPayload).forEach((key) => {
        if (typeof sanitizedPayload[key] === "string") {
          sanitizedPayload[key] = DOMPurify.sanitize(sanitizedPayload[key]);
        }
      });
      await sdjService.updateShipment(id, sanitizedPayload);
      set({ _lastFetched: { overview: null, data: null, analytics: null } });
      get().setActiveTab(get().activeTab);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateItemByNoDo: async (no_do, payload) => {
    try {
      const sanitizedPayload = { ...payload };
      Object.keys(sanitizedPayload).forEach((key) => {
        if (typeof sanitizedPayload[key] === "string") {
          sanitizedPayload[key] = DOMPurify.sanitize(sanitizedPayload[key]);
        }
      });
      await sdjService.updateShipmentByNoDo(no_do, sanitizedPayload);
      set({ _lastFetched: { overview: null, data: null, analytics: null } });
      get().setActiveTab(get().activeTab);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  deleteItem: async (id, editReason = "Penghapusan data shipment") => {
    try {
      await sdjService.deleteShipment(id, editReason);
      set({ _lastFetched: { overview: null, data: null, analytics: null } });
      get().setActiveTab(get().activeTab);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));
