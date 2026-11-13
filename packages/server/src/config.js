/**
 * Configuration loader.
 * Reads from environment variables with sensible defaults.
 *
 * @returns {OrcaConfig}
 */
export function loadConfig() {
  return {
    port: parseInt(process.env.ORCA_PORT ?? '7337', 10),
    host: process.env.ORCA_HOST ?? '127.0.0.1',
    dbPath: process.env.ORCA_DB_PATH ?? './orca.db',
    remote: process.env.ORCA_REMOTE_ORIGIN ? {
      origin: process.env.ORCA_REMOTE_ORIGIN,
      host: process.env.ORCA_REMOTE_HOST ?? '0.0.0.0',
      port: parseInt(process.env.ORCA_REMOTE_PORT ?? '7443', 10),
      certPath: process.env.ORCA_TLS_CERT,
      keyPath: process.env.ORCA_TLS_KEY,
    } : null,
    ntfy: {
      baseUrl: process.env.NTFY_BASE_URL ?? 'https://ntfy.sh',
      topic: process.env.NTFY_TOPIC ?? '',
      token: process.env.NTFY_TOKEN ?? '',
    },
  };
}

/**
 * @typedef {Object} OrcaConfig
 * @property {number} port
 * @property {string} host
 * @property {string} dbPath
 * @property {{ baseUrl: string, topic: string, token: string }} ntfy
 */
