import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-sm"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
