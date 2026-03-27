import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ScanLine, Camera, Truck, X } from "lucide-react";
import { compressImage } from "@/shared/utils/imageCompression";

/**
 * RegisterShipmentDialog — Step 1: Register DT di IUP
 * Input: hull_no (manual), seal_no (scan QR segel), foto segel (camera)
 */
const RegisterShipmentDialog = ({ open, onOpenChange, onSubmit, isLoading }) => {
  const [hullNo, setHullNo] = useState("");
  const [sealNo, setSealNo] = useState("");
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [scanMode, setScanMode] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setHullNo("");
      setSealNo("");
      setFoto(null);
      setFotoPreview(null);
      setScanMode(false);
    }
  }, [open]);

  const handleScanResult = (result) => {
    if (result && result.length > 0) {
      setSealNo(result[0].rawValue || result[0]);
      setScanMode(false);
    }
  };

  const handleFotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      setFoto(compressed);
      setFotoPreview(URL.createObjectURL(compressed));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = () => {
    if (!hullNo.trim() || !sealNo.trim()) return;
    onSubmit({
      hull_no: hullNo.trim(),
      seal_no: sealNo.trim(),
      foto_seal_start: foto,
    });
  };

  const isValid = hullNo.trim() && sealNo.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Register DT Baru
          </DialogTitle>
          <DialogDescription>
            Input nomor lambung, scan QR segel, dan foto segel terpasang.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Hull No Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nomor Lambung (Hull No) <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: BT12345"
              value={hullNo}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/\s/g, "");
                setHullNo(val);
              }}
            />
          </div>

          {/* Seal No - Scan or Manual */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              No. Segel <span className="text-red-500">*</span>
            </label>
            {scanMode ? (
              <div className="space-y-2">
                <div className="w-full max-w-[280px] mx-auto aspect-square overflow-hidden rounded-xl bg-black relative">
                  <Scanner
                    onResult={handleScanResult}
                    onError={(err) => console.error("Scanner error:", err)}
                    options={{
                      delayBetweenScanAttempts: 1000,
                      delayBetweenScanSuccess: 2000,
                    }}
                  />
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 shadow-[0_0_10px_2px_rgba(239,68,68,0.5)] transform -translate-y-1/2 animate-scan" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setScanMode(false)}
                >
                  Batal Scan
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Scan atau ketik no. segel"
                  value={sealNo}
                  onChange={(e) => setSealNo(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setScanMode(true)}
                  title="Scan QR Segel"
                >
                  <ScanLine className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Foto Segel */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Foto Segel Terpasang</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFotoCapture}
            />
            {fotoPreview ? (
              <div className="relative">
                <img
                  src={fotoPreview}
                  alt="Preview segel"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => {
                    setFoto(null);
                    setFotoPreview(null);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 h-20 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
              >
                <Camera className="w-5 h-5" />
                {isCompressing ? "Memproses foto..." : "Ambil Foto Segel"}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading || isCompressing}
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterShipmentDialog;
