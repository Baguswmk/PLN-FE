import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { getSecureItem } from "@/shared/utils/secureStorage";

/**
 * Cek apakah JWT token masih valid (belum expired).
 * Strapi JWT adalah standard JWT — bisa di-decode bagian payload-nya.
 */
function isTokenValid() {
  try {
    const token = getSecureItem("token");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export const useSyncStore = create(
  persist(
    (set, get) => ({
      pendingQueue: [],

      addToQueue: (operation) => {
        // operation: { id, module, type, payload, timestamp }
        const enrichedPayload = {
          ...operation.payload,
          createdAt: operation.payload?.createdAt || new Date().toISOString(),
        };

        const newOperation = {
          ...operation,
          payload: enrichedPayload,
          syncId: Date.now() + Math.random().toString(36).substr(2, 9),
        };

        set((state) => ({
          pendingQueue: [...state.pendingQueue, newOperation],
        }));

        toast.warning(
          `Anda sedang offline. Data ${operation.module} (${operation.type}) disimpan ke antrean.`
        );
      },

      removeFromQueue: (syncId) => {
        set((state) => ({
          pendingQueue: state.pendingQueue.filter((item) => item.syncId !== syncId),
        }));
      },

      clearQueue: () => set({ pendingQueue: [] }),

      processQueue: async () => {
        const queue = get().pendingQueue;
        if (queue.length === 0) return;

        // ── Cek token masih valid sebelum sync ─────────────────────────────
        if (!isTokenValid()) {
          toast.error(
            "Sesi login sudah berakhir. Silakan login ulang sebelum sinkronisasi data."
          );
          return;
        }

        toast.info(`Memulai sinkronisasi ${queue.length} antrean data...`);

        let successCount = 0;
        let failCount = 0;
        const currentQueue = [...queue];

        for (const item of currentQueue) {
          try {
            if (item.module === "ROM") {
              const { romService } = await import(
                "@/modules/pengeluaran-rom/services/romService.js"
              );
              if (item.type === "CREATE") await romService.createShipment(item.payload);
              if (item.type === "UPDATE") await romService.updateShipment(item.payload.id, item.payload.edits);
              if (item.type === "DELETE") await romService.deleteShipment(item.payload.id);
              // ─── Operasi baru multi-step ───────────────────────────────
              if (item.type === "REGISTER") await romService.registerShipment(item.payload);
              if (item.type === "MATCH_SJB") await romService.matchSjb(item.payload);
            } else if (item.module === "SDJ") {
              const { sdjService } = await import(
                "@/modules/penerimaan-sdj/services/sdjService.js"
              );
              if (item.type === "CREATE") await sdjService.createShipment(item.payload);
              if (item.type === "UPDATE") await sdjService.updateShipment(item.payload.id, item.payload.edits);
              if (item.type === "UPDATE_BY_NODO") await sdjService.updateShipmentByNoDo(item.payload.no_do, item.payload.edits);
              if (item.type === "DELETE") await sdjService.deleteShipment(item.payload.id);
              // ─── Operasi baru multi-step ───────────────────────────────
              if (item.type === "ARRIVE") await sdjService.arriveShipment(item.payload.id, item.payload);
            }

            get().removeFromQueue(item.syncId);
            successCount++;
          } catch (error) {
            console.error(`Gagal sinkronisasi data ${item.module} (${item.type}):`, error);
            failCount++;
          }
        }

        if (failCount === 0) {
          toast.success(`Semua ${successCount} data berhasil disinkronisasi ke server!`);
        } else if (successCount > 0) {
          toast.warning(`${successCount} sukses, ${failCount} gagal. Coba lagi saat jaringan lebih stabil.`);
        } else {
          toast.error("Gagal menyinkronkan data. Pastikan jaringan internet stabil.");
        }
      },
    }),
    { name: "pln-sync-queue" }
  )
);
