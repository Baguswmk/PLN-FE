import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

export const useSyncStore = create(
  persist(
    (set, get) => ({
      pendingQueue: [],
      
      addToQueue: (operation) => {
        // operation: { id: string | number, module: 'ROM' | 'SDJ', type: 'CREATE' | 'UPDATE' | 'DELETE', payload: any, timestamp: number }
        
        // Mengunci waktu pembuatan secara lokal saat sedang offline
        const enrichedPayload = {
          ...operation.payload,
          createdAt: operation.payload?.createdAt || new Date().toISOString()
        };

        const newOperation = {
          ...operation,
          payload: enrichedPayload,
          syncId: Date.now() + Math.random().toString(36).substr(2, 9),
        };
        
        set((state) => ({
          pendingQueue: [...state.pendingQueue, newOperation]
        }));
        
        toast.warning(`Anda sedang offline. Data ${operation.module} disimpan ke antrean tunggu.`);
      },
      
      removeFromQueue: (syncId) => {
        set((state) => ({
          pendingQueue: state.pendingQueue.filter(item => item.syncId !== syncId)
        }));
      },
      
      clearQueue: () => {
        set({ pendingQueue: [] });
      },
      
      // Implement actual processing, triggering the services
      processQueue: async () => {
        const queue = get().pendingQueue;
        if (queue.length === 0) return;
        
        toast.info(`Memulai sinkronisasi ${queue.length} antrean data...`);
        
        let successCount = 0;
        let failCount = 0;
        
        // Buat salinan queue agar bisa di-proses secara berurutan
        const currentQueue = [...queue];
        
        for (const item of currentQueue) {
            try {
                if (item.module === "ROM") {
                    const { romService } = await import('@/modules/pengeluaran-rom/services/romService.js');
                    if (item.type === "CREATE") await romService.createShipment(item.payload);
                    if (item.type === "UPDATE") await romService.updateShipment(item.payload.id, item.payload.edits);
                    if (item.type === "DELETE") await romService.deleteShipment(item.payload.id);
                } else if (item.module === "SDJ") {
                    const { sdjService } = await import('@/modules/penerimaan-sdj/services/sdjService.js');
                    if (item.type === "CREATE") await sdjService.createShipment(item.payload);
                    if (item.type === "UPDATE") await sdjService.updateShipment(item.payload.id, item.payload.edits);
                    if (item.type === "UPDATE_BY_NODO") await sdjService.updateShipmentByNoDo(item.payload.no_do, item.payload.edits);
                    if (item.type === "DELETE") await sdjService.deleteShipment(item.payload.id);
                }
                
                // Jika sukses eksekusi API, buang dari antrean
                get().removeFromQueue(item.syncId);
                successCount++;
            } catch (error) {
                console.error(`Gagal sinkronisasi data ${item.module}:`, error);
                failCount++;
            }
        }
        
        if (failCount === 0) {
            toast.success(`Semua ${successCount} data berhasil disinkronisasi ke server!`);
        } else if (successCount > 0) {
            toast.warning(`${successCount} sukses, ${failCount} gagal disinkronkan. Coba lagi saat koneksi lebih baik.`);
        } else {
            toast.error(`Gagal menyinkronkan data. Pastikan jaringan internet stabil.`);
        }
      }
    }),
    {
      name: "pln-sync-queue", 
    }
  )
);
