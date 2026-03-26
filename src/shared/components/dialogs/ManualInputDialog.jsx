import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Keyboard, Loader2 } from "lucide-react";

const ManualInputDialog = ({
  open,
  onOpenChange,
  onSubmit,
  title = "Input Manual",
  description = "Ketik atau paste data barcode secara manual.",
  placeholder = "Contoh: 02166C0326W3572F196   A1500A",
  submitLabel = "Proses",
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  // Reset & auto-focus saat modal dibuka
  useEffect(() => {
    if (open) {
      setInputValue("");
      // Delay focus sedikit agar dialog sempat render
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSubmit(inputValue.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="manual-input-field">
              Data Barcode / No. DO
            </label>
            <Input
              id="manual-input-field"
              ref={inputRef}
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Masukkan kode yang tercetak pada barcode atau surat jalan.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={!inputValue.trim() || isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualInputDialog;
