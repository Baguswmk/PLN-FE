import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

/**
 * OfflineBanner — Banner sticky di bagian atas halaman saat user offline.
 * Tidak mengganggu layout — menggunakan fixed positioning dengan z-index tinggi.
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        // Sembunyikan pesan "Kembali online" setelah 3 detik
        setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
        }, 3000);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300 ${
        isOnline
          ? "bg-emerald-500 text-white"
          : "bg-amber-500 text-white animate-pulse"
      }`}
    >
      {isOnline ? (
        <>✅ Koneksi pulih — data antrean akan segera disinkronkan.</>
      ) : (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Tidak ada koneksi internet. Data akan disimpan ke antrean dan dikirim saat online.
          </span>
        </>
      )}
    </div>
  );
}
