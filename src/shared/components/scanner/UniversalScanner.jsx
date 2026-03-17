import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AlertTriangle, Camera } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function UniversalScanner({
  onScanSuccess,
  onScanError,
  qrbox = 250,
  fps = 10,
}) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        setScanning(true);
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps, qrbox: { width: qrbox, height: qrbox } },
          (decodedText, decodedResult) => {
            // Pause scanner briefly on success to prevent multiple rapid scans
            html5QrCode.pause();
            onScanSuccess(decodedText, decodedResult);
            setTimeout(() => {
              if (html5QrCode.getState() === 2) {
                html5QrCode.resume();
              }
            }, 2000);
          },
          (errorMessage) => {
            if (onScanError) onScanError(errorMessage);
          },
        );
      } catch (err) {
        setError("Kamera tidak dapat diakses. Pastikan izin kamera diberikan.");
        setScanning(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScanSuccess, onScanError, qrbox, fps]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-3 text-sm text-left">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-square shadow-inner">
          <div id="reader" className="w-full h-full object-cover"></div>

          {/* Scanning Overlay UI */}
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-primary/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[2px] bg-primary animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10 gap-3">
              <Camera className="w-8 h-8 opacity-50 pulse" />
              <span className="text-sm font-medium">
                Inisialisasi Kamera...
              </span>
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Arahkan kamera ke QrCode / Barcode Surat Jalan atau RFID.
      </p>
    </div>
  );
}
