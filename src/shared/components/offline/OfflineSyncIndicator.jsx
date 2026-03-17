import React, { useState, useEffect } from "react";
import { useSyncStore } from "@/store/useSyncStore";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { WifiOff, Wifi, RefreshCw, Trash2, DatabaseZap } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";

export default function OfflineSyncIndicator() {
  const { pendingQueue, processQueue, removeFromQueue, clearQueue } = useSyncStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  // We ALWAYS show the widget now, just change its appearance based on state
  const hasQueue = pendingQueue.length > 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className={`fixed bottom-6 right-6 z-50 cursor-pointer group transition-all duration-300 ${!isOnline && hasQueue ? 'animate-bounce hover:animate-none' : ''}`}>
          <div className={`relative p-3 rounded-full shadow-lg border-2 border-white ring-4 transition-transform group-hover:scale-110
            ${isOnline 
              ? 'bg-emerald-500 text-white ring-emerald-500/20' 
              : 'bg-amber-500 text-white ring-amber-500/20'}
          `}>
            {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            
            {hasQueue && (
              <Badge className="absolute -top-2 -left-2 bg-red-600 border-2 border-white px-1.5 min-w-[20px] justify-center text-[10px]">
                {pendingQueue.length}
              </Badge>
            )}
          </div>
        </div>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <DatabaseZap className={`w-5 h-5 ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`} />
            {isOnline ? 'Status Jaringan: Online' : 'Status Jaringan: Offline'}
          </SheetTitle>
          <SheetDescription>
            {hasQueue 
              ? `Ada ${pendingQueue.length} antrean aksi yang belum terunggah ke server. Pastikan koneksi stabil sebelum memproses sinkronisasi.`
              : 'Semua data telah berhasil disinkronkan. Tidak ada operasi yang tertunda.'}
          </SheetDescription>
        </SheetHeader>
        
        {hasQueue ? (
          <div className="flex flex-col gap-4 h-[calc(100vh-12rem)] overflow-y-auto pr-2">
          {pendingQueue.map((item) => (
            <div key={item.syncId} className="border rounded-lg p-3 bg-muted/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={item.type === 'DELETE' ? 'destructive' : 'default'} className="text-[10px]">
                    {item.type} {item.module}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {item.payload?.id || item.payload?.driver || `Data ${item.module}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {JSON.stringify(item.payload)}
                </p>
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => removeFromQueue(item.syncId)} className="h-7 text-xs text-red-600">
                  <Trash2 className="w-3 h-3 mr-1" /> Buang Data
                </Button>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/30">
            <Wifi className="w-10 h-10 mb-3 text-emerald-500 opacity-80" />
            <p className="text-sm font-medium">Jaringan Stabil</p>
            <p className="text-xs">Antrean sinkronisasi kosong</p>
          </div>
        )}
        
        {hasQueue && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t flex gap-2">
            <Button variant="destructive" className="flex-1" onClick={clearQueue}>
              Hapus Semua
            </Button>
            <Button 
              className={`flex-[2] gap-2 text-white ${isOnline ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-muted-foreground cursor-not-allowed'}`} 
              onClick={processQueue}
              disabled={!isOnline}
            >
              <RefreshCw className={`w-4 h-4 ${isOnline ? '' : 'opacity-50'}`} /> 
              {isOnline ? 'Sinkronisasi Sekarang' : 'Menunggu Koneksi...'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
