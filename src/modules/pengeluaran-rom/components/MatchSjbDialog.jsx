import React, { useState, useEffect } from "react";
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
import { ScanLine, Keyboard, LinkIcon } from "lucide-react";

/**
 * MatchSjbDialog — Step 2: Match SJB (scan SJB → match by hull_no)
 * Input: no_do (scan QR SJB atau manual)
 */
const MatchSjbDialog = ({ open, onOpenChange, onSubmit, isLoading }) => {
  const [noDo, setNoDo] = useState("");

  useEffect(() => {
    if (open) {
      setNoDo("");
    }
  }, [open]);

  const handleScanResult = (result) => {
    if (result && result.length > 0) {
      const value = result[0].rawValue || result[0];
      setNoDo(value);
      // Auto-submit saat scan berhasil
      onSubmit(value);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (noDo.trim()) {
      onSubmit(noDo.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            Match SJB (Surat Jalan Batubara)
          </DialogTitle>
          <DialogDescription>
            Scan QR Code dari SJB untuk mencocokkan dengan DT yang sudah
            terdaftar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Camera Scanner */}
          <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/30">
            <div className="w-full max-w-[300px] aspect-square overflow-hidden rounded-xl bg-black relative">
              {open && (
                <Scanner
                  onResult={handleScanResult}
                  onError={(error) => {
                    console.error("QR Scanner Error:", error?.message);
                  }}
                  options={{
                    delayBetweenScanAttempts: 1000,
                    delayBetweenScanSuccess: 2000,
                  }}
                />
              )}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 shadow-[0_0_10px_2px_rgba(239,68,68,0.5)] transform -translate-y-1/2 animate-scan" />
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-muted" />
            <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase">
              ATAU
            </span>
            <div className="flex-grow border-t border-muted" />
          </div>

          {/* Manual Input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 w-full">
            <div className="relative w-full">
              <Keyboard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ketik/Paste No. DO..."
                className="pl-9 w-full"
                value={noDo}
                onChange={(e) => setNoDo(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!noDo.trim() || isLoading}>
              {isLoading ? "Proses..." : "Match"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchSjbDialog;
