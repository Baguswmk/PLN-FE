import { getNetworkStatus } from "../offline/networkDetector.js";
import { enqueue } from "../offline/syncEngine.js";

const QUEUEABLE_METHODS = ["post", "patch", "put", "delete"];

/**
 * Attach interceptor to an axios instance to auto-queue mutating
 * requests when the device is offline.
 * @param {import('axios').AxiosInstance} instance
 */
export function attachOfflineInterceptor(instance) {
  instance.interceptors.request.use(
    async (config) => {
      const method = config.method?.toLowerCase();
      if (!getNetworkStatus() && QUEUEABLE_METHODS.includes(method)) {
        await enqueue({
          endpoint: config.url,
          method: config.method.toUpperCase(),
          payload: config.data,
        });
        // Abort the actual request so it doesn't fail
        const controller = new AbortController();
        controller.abort();
        config.signal = controller.signal;
        config._queued = true;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.config?._queued) {
        // Return a synthetic success so the caller knows it was queued
        return Promise.resolve({
          data: {
            queued: true,
            message: "Operasi disimpan, akan disinkronkan saat online.",
          },
          status: 202,
          config: error.config,
        });
      }
      return Promise.reject(error);
    },
  );
}
