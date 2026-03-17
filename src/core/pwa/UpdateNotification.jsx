import { Button } from "@/shared/components/ui/button";
import React, { useState, useEffect } from "react";

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setShowUpdate(true);
      });
    }
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in">
      <span className="text-sm font-medium">🔄 Versi baru tersedia!</span>
      <Button
        onClick={() => window.location.reload()}
        className="text-sm font-semibold underline underline-offset-2"
      >
        Muat Ulang
      </Button>
    </div>
  );
}
