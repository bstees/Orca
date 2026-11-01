/**
 * Configuration loader.
 * Reads from environment variables with sensible defaults.
 *
 * @returns {OrcaConfig}
 */
export function loadConfig() {
  return {
    port: parseInt(process.env.ORCA_PORT ?? '7337', 10),
    host: process.env.ORCA_HOST ?? '0.0.0.0',
    dbPath: process.env.ORCA_DB_PATH ?? './orca.db',
    ntfy: {
      baseUrl: process.env.NTFY_BASE_URL ?? 'https://ntfy.sh',
      topic: process.env.NTFY_TOPIC ?? 'orca-alerts',
    },
  };
}

/**
 * @typedef {Object} OrcaConfig
 * @property {number} port
 * @property {string} host
 * @property {string} dbPath
 * @property {{ baseUrl: string, topic: string }} ntfy
 */
