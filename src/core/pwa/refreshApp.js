import { invalidateCache, clearAllCache } from "../offline/cacheManager.js";
import { db } from "../offline/db.js";
import { toast } from "sonner";

/**
 * Force refresh logic to be used when user clicks "Refresh App" or similar.
 * It clears local cached data, unregisters service workers, and reloads.
 */
export async function forceRefreshApp() {
  try {
    toast.loading("Membersihkan cache aplikasi...");

    // 1. Clear IndexedDB Caches (but not syncQueue or shipments, depending on business logic)
    // Here we just clear the TTL cache to force fresh network requests
    await clearAllCache();
    // 2. Clear lots table just in case
    await db.lots.clear();

    // 3. Unregister all service workers to ensure next load gets newest SW
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    toast.success("Cache berhasil dibersihkan! Memuat ulang...", {
      id: "refresh",
      duration: 2000,
    });

    // 4. Hard reload bypassing HTTP cache to fetch new assets and SW
    setTimeout(() => {
      window.location.href = window.location.href; // Fallback
      window.location.reload(true);
    }, 1500);
  } catch (error) {
    console.error("Failed to force refresh", error);
    toast.error("Gagal membersihkan cache aplikasi.");
  }
}
