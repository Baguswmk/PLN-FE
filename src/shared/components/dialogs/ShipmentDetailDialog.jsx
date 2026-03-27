import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { toast } from "sonner";
import { Camera, Upload, X, ZoomIn, Loader2 } from "lucide-react";
import { compressImage } from "@/shared/utils/imageCompression";
import httpClient from "@/core/api/httpClient";

const STRAPI_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:1337";

const statusConfig = {
  REGISTERED: {
    label: "Registered",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  IN_TRANSIT: {
    label: "In Transit",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  FINISH: {
    label: "Finish",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
  },
};

import { createPortal } from "react-dom";

function PhotoCard({ label, photo, onReplace, canReplace }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const imgUrl = photo?.url ? `${STRAPI_URL}${photo.url}` : null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      await onReplace(compressed);
    } catch (err) {
      toast.error("Gagal mengganti foto: " + (err.message || "unknown error"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>

      {imgUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/30 aspect-[4/3]">
          <img
            src={imgUrl}
            alt={label}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          {/* Zoom overlay */}
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          >
            <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => canReplace && inputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed border-border bg-muted/20 aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted-foreground ${canReplace ? "cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all" : ""}`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-xs">
                {canReplace ? "Klik untuk upload foto" : "Belum ada foto"}
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {/* Lightbox dengan Shadcn Stacked Dialog (Otomatis handle z-index & outside click berantai) */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        {/* [&>button]:hidden digunakan untuk menyembunyikan tombol X bawaan komponen Dialog Shadcn agar kita bisa bikin custom */}
        <DialogContent className="max-w-[95vw] w-fit border-none bg-transparent shadow-none p-0 flex items-center justify-center [&>button]:hidden">
          <DialogTitle className="hidden">Perbesar Foto</DialogTitle>
          
          {/* Tombol X Custom di pojok kanan atas layar */}
          <button 
            onClick={() => setLightboxOpen(false)}
            className="fixed top-4 right-4 md:top-6 md:right-6 z-[9999] p-2 bg-black/40 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          <div className="relative flex justify-center items-center mt-8">
            {imgUrl && (
              <img
                src={imgUrl}
                alt={label}
                className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">
        {value ?? <span className="text-muted-foreground italic">—</span>}
      </span>
    </div>
  );
}

/**
 * ShipmentDetailDialog
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   item: shipment object (flat, from custom API)
 *   onPhotoUpdated: (updatedItem) => void   — callback setelah foto berhasil diganti
 *   mode: "rom" | "sdj"
 */
export default function ShipmentDetailDialog({
  open,
  onClose,
  item,
  onPhotoUpdated,
  mode = "rom",
}) {
  if (!item) return null;

  const status = item.finish?.status ?? "IN_TRANSIT";
  const statusCfg = statusConfig[status] || statusConfig.IN_TRANSIT;

  // Upload foto dan link ke field yang sesuai di Strapi
  const replacePhoto = async (field, file, entityField, oldPhotoId) => {
    const form = new FormData();
    form.append("files", file);
    form.append("ref", "api::shipment.shipment");
    form.append("refId", item.id);
    form.append("field", entityField);

    await httpClient.post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Menghapus foto lama secara background agar storage tidak penuh
    if (oldPhotoId) {
      httpClient.delete(`/upload/files/${oldPhotoId}`).catch((err) => {
        console.warn("Gagal menghapus file foto lama:", err);
      });
    }

    toast.success("Foto berhasil diperbarui!");
    // Notify parent to refresh
    onPhotoUpdated?.();
  };

  const canReplaceStart = status === "REGISTERED" || status === "IN_TRANSIT";
  const canReplaceFinish = status === "FINISH" || status === "IN_TRANSIT";
  console.log(item)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Detail Pengiriman</DialogTitle>
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-2 py-0.5 border ${statusCfg.color}`}
            >
              {statusCfg.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Info utama */}
          <div className="bg-muted/30 rounded-xl p-4">
            <InfoRow label="ID" value={`#${item.id}`} />
            <InfoRow label="No DO" value={item.no_do} />
            <InfoRow label="Hull No" value={item.hull_no} />
            <InfoRow label="Seal No" value={item.seal_no} />
            <InfoRow label="Coal Type" value={item.coal_type} />
            <InfoRow label="Lot" value={item.lot} />
            <InfoRow label="Loading" value={item.loading} />
            <InfoRow label="Dumping" value={item.dumping} />
            <InfoRow
              label="Net Weight"
              value={item.net_weight ? `${item.net_weight} ton` : null}
            />
            <InfoRow label="Shift" value={item.shift} />
            <InfoRow label="Tanggal" value={item.date_shift} />
            <InfoRow label="Waktu" value={item.time?.slice(0, 8)} />
            <InfoRow label="Dibuat oleh" value={item.user} />
          </div>

          {/* Finish info jika ada */}
          {item.finish?.date && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">
                Info Penerimaan
              </p>
              <InfoRow label="Tanggal Tiba" value={item.finish.date} />
              <InfoRow
                label="Waktu Tiba"
                value={item.finish.time?.slice(0, 8)}
              />
              <InfoRow label="Shift Tiba" value={item.finish.shift} />
              <InfoRow
                label="Durasi"
                value={
                  item.finish.duration ? `${item.finish.duration} menit` : null
                }
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {/* Foto Segel Start */}
            <PhotoCard
              label="Foto Segel Keberangkatan"
              photo={item.foto_seal_start}
              canReplace={canReplaceStart}
              onReplace={(file) =>
                replacePhoto("foto_seal_start", file, "foto_seal_start", item.foto_seal_start?.id)
              }
            />

            {/* Foto Segel Finish */}
            <PhotoCard
              label="Foto Segel Kedatangan"
              photo={item.finish?.foto_seal_finish}
              canReplace={canReplaceFinish}
              onReplace={(file) =>
                replacePhoto(
                  "foto_seal_finish_via_finish",
                  file,
                  "foto_seal_finish",
                  item.finish?.foto_seal_finish?.id
                )
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
