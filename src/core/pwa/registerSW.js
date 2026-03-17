import { registerSW as pwaRegisterSW } from "virtual:pwa-register";

export function registerSW() {
  if ("serviceWorker" in navigator) {
    const updateSW = pwaRegisterSW({
      onNeedRefresh() {
        if (confirm("Versi baru tersedia! Muat ulang untuk update?")) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log("App ready to work offline");
      },
      onRegisterError(error) {
        console.error("SW registration error", error);
      },
    });
  }
}
