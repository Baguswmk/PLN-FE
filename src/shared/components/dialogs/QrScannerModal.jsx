import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ScanLine, Keyboard } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

/**
 * Reusable QR Scanner Modal
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Dialog open change handler
 * @param {function} onScan - Callback when QR is successfully scanned (receives value as param)
 * @param {string} title - Optional title for the modal
 * @param {string} description - Optional description
 */
const QrScannerModal = ({
  open,
  onOpenChange,
  onScan,
  title = "Scan QR Code",
  description = "Arahkan kamera ke QR code",
}) => {
  const [manualInput, setManualInput] = useState("");

  // Reset input when modal opens
  useEffect(() => {
    if (open) {
      setManualInput("");
    }
  }, [open]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-4">
          {/* Camera Scanner */}
          <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/30">
            <div className="w-full max-w-[300px] aspect-square overflow-hidden rounded-xl bg-black relative">
              {open && (
                <Scanner
                  onResult={(result) => {
                    if (result && result.length > 0) {
                      onScan(result[0].rawValue || result[0]);
                      onOpenChange(false);
                    }
                  }}
                  onError={(error) => {
                    console.error("QR Scanner Error:", error?.message);
                  }}
                  options={{
                    delayBetweenScanAttempts: 1000,
                    delayBetweenScanSuccess: 2000,
                  }}
                />
              )}
              {/* Scanner overlay line */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 shadow-[0_0_10px_2px_rgba(239,68,68,0.5)] transform -translate-y-1/2 animate-scan"></div>
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-muted"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase">ATAU</span>
            <div className="flex-grow border-t border-muted"></div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 w-full">
            <div className="relative w-full">
              <Keyboard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Ketik/Paste data QR manual..." 
                className="pl-9 w-full"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!manualInput.trim()}>Proses</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrScannerModal;
