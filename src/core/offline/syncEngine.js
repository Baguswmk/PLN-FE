import db from "./db.js";
import httpClient from "../api/httpClient.js";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 15000]; // ms

/**
 * Enqueue an operation to be synced when online.
 * @param {object} operation - { endpoint, method, payload }
 */
export async function enqueue(operation) {
  await db.syncQueue.add({
    ...operation,
    retries: 0,
    status: "pending",
    createdAt: new Date().toISOString(),
    lastAttemptAt: null,
  });
}

/**
 * Process all pending queue items.
 * Called when the device comes back online.
 */
export async function processQueue() {
  const pending = await db.syncQueue
    .where("status")
    .anyOf(["pending", "failed"])
    .and((item) => item.retries < MAX_RETRIES)
    .toArray();

  for (const item of pending) {
    await processItem(item);
  }
}

async function processItem(item) {
  try {
    await db.syncQueue.update(item.id, {
      lastAttemptAt: new Date().toISOString(),
    });

    await httpClient({
      method: item.method,
      url: item.endpoint,
      data: item.payload,
    });

    // Success – remove from queue
    await db.syncQueue.delete(item.id);
  } catch (err) {
    const newRetries = item.retries + 1;
    if (newRetries >= MAX_RETRIES) {
      await db.syncQueue.update(item.id, {
        retries: newRetries,
        status: "failed",
        error: err?.response?.data?.message || err.message,
      });
    } else {
      // Schedule retry with exponential backoff
      setTimeout(
        () => processItem({ ...item, retries: newRetries }),
        RETRY_DELAYS[newRetries],
      );
      await db.syncQueue.update(item.id, {
        retries: newRetries,
        status: "retrying",
      });
    }
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const all = await db.syncQueue.toArray();
  return {
    total: all.length,
    pending: all.filter((i) => i.status === "pending").length,
    failed: all.filter((i) => i.status === "failed").length,
    retrying: all.filter((i) => i.status === "retrying").length,
  };
}

/**
 * Clear all successfully synced items
 */
export async function clearSynced() {
  await db.syncQueue.where("status").equals("synced").delete();
}
