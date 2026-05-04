/**
 * Formats elapsed milliseconds into a human-readable string.
 *
 * @param {number} ms
 * @returns {string}
 */
export function formatElapsed(ms) {
  if (ms < 0) return '0s';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Returns elapsed time from a timestamp to now as a formatted string.
 *
 * @param {number} sinceMs - Unix timestamp (ms)
 * @returns {string}
 */
export function elapsedSince(sinceMs) {
  return formatElapsed(Date.now() - sinceMs);
}
