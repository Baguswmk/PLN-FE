import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils.js";

export default function LoadingSpinner({
  className,
  size = "md",
  fullScreen = false,
  text = "Memuat...",
}) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={cn("animate-spin text-primary", sizeMap[size], className)}
      />
      {text && (
        <span className="text-sm font-medium text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center p-4">{spinner}</div>;
}
