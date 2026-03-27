import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/modules/auth/components/AuthProvider.jsx";
import AppRouter from "@/routes/AppRouter.jsx";
import { UpdateNotification } from "@/core/pwa/UpdateNotification.jsx";
import { ThemeProvider } from "@/shared/components/ui/theme-provider.jsx";
import { Toaster } from "sonner";
import ErrorBoundary from "@/shared/components/ErrorBoundary.jsx";
import "./App.css";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pln-ui-theme">
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
          <UpdateNotification />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
