import Dexie from "dexie";

export const db = new Dexie("PLNDatabase");

db.version(1).stores({
  // Shipment data cached locally
  shipments:
    "++id, remoteId, type, status, tanggal, createdAt, updatedAt, synced",

  // Offline operation queue
  syncQueue:
    "++id, operation, endpoint, method, payload, retries, status, createdAt, lastAttemptAt",

  // Generic TTL cache (any endpoint response)
  cache: "cacheKey, data, expiresAt, createdAt",

  // Lots dropdown data
  lots: "++id, remoteId, namaLot, lokasi, updatedAt",
});

db.open().catch((err) => {
  console.error("Failed to open IndexedDB:", err);
});

export default db;
