/**
 * Conflict resolution strategy: last-write-wins based on updatedAt timestamp.
 */

/**
 * Resolve conflict between local (offline) data and remote (server) data.
 * @param {object} localData - Local version with timestamps
 * @param {object} remoteData - Remote version with timestamps
 * @returns {{ winner: 'local' | 'remote', data: object }}
 */
export function resolveConflict(localData, remoteData) {
  const localTime = new Date(
    localData.updatedAt || localData.createdAt || 0,
  ).getTime();
  const remoteTime = new Date(
    remoteData.updatedAt || remoteData.createdAt || 0,
  ).getTime();

  if (localTime >= remoteTime) {
    return { winner: "local", data: localData };
  }
  return { winner: "remote", data: remoteData };
}

/**
 * Merge two objects, preferring the winner's values but keeping
 * any fields that only exist in one side.
 */
export function mergeData(localData, remoteData) {
  const { winner, data: winnerData } = resolveConflict(localData, remoteData);
  const loserData = winner === "local" ? remoteData : localData;
  return { ...loserData, ...winnerData };
}
