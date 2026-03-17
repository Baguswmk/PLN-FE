import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Akses Ditolak</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Anda tidak memiliki izin yang cukup untuk mengakses halaman ini.
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
