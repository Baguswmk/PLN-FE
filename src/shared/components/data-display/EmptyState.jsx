import React from "react";
import { FolderSearch } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function EmptyState({ 
  icon: Icon = FolderSearch, 
  title = "Tidak ada data", 
  description = "Belum ada data yang dapat ditampilkan untuk saat ini.", 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
      <div className="bg-muted/50 p-4 rounded-full mb-4 ring-8 ring-muted/20">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
