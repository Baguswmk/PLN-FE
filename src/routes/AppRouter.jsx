import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute.jsx";
import RoleBasedRoute from "./RoleBasedRoute.jsx";
import AppLayout from "@/layout/AppLayout.jsx";
import LoginPage from "@/modules/auth/pages/LoginPage.jsx";
import NotFoundPage from "@/pages/NotFoundPage.jsx";
import UnauthorizedPage from "@/pages/UnauthorizedPage.jsx";

// Lazy-load modules
import { lazy, Suspense } from "react";
import LoadingSpinner from "@/shared/components/feedback/LoadingSpinner.jsx";

const PengeluaranRomPage = lazy(
  () => import("@/modules/pengeluaran-rom/pages/PengeluaranRomPage.jsx"),
);
const PenerimaanSdjPage = lazy(
  () => import("@/modules/penerimaan-sdj/pages/PenerimaanSdjPage.jsx"),
);
const OverviewPage = lazy(
  () => import("@/modules/overview/pages/OverviewPage.jsx"),
);
const MasterDataPage = lazy(
  () => import("@/modules/master-data/pages/MasterDataPage.jsx"),
);

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner fullScreen />}>{children}</Suspense>
);

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />

          <Route
            path="/overview"
            element={
              <SuspenseWrapper>
                <OverviewPage />
              </SuspenseWrapper>
            }
          />

          <Route
            path="/pengeluaran-rom"
            element={
              <SuspenseWrapper>
                <PengeluaranRomPage />
              </SuspenseWrapper>
            }
          />

          <Route
            path="/penerimaan-sdj"
            element={
              <SuspenseWrapper>
                <PenerimaanSdjPage />
              </SuspenseWrapper>
            }
          />

          <Route
            path="/master-data"
            element={
              <RoleBasedRoute allowedRoles={["admin", "manager"]}>
                <SuspenseWrapper>
                  <MasterDataPage />
                </SuspenseWrapper>
              </RoleBasedRoute>
            }
          />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
