import { processQueue } from "./syncEngine.js";

const listeners = new Map();

let isOnline = navigator.onLine;

/**
 * Returns current online status.
 */
export function getNetworkStatus() {
  return isOnline;
}

/**
 * Subscribe to network status changes.
 * @param {function} id - Unique listener id
 * @param {function} callback - Called with (isOnline: boolean)
 */
export function subscribe(id, callback) {
  listeners.set(id, callback);
}

export function unsubscribe(id) {
  listeners.delete(id);
}

function notify() {
  listeners.forEach((cb) => cb(isOnline));
}

window.addEventListener("online", () => {
  isOnline = true;
  notify();
  // Auto-trigger sync when back online
  processQueue().catch(console.error);
});

window.addEventListener("offline", () => {
  isOnline = false;
  notify();
});
