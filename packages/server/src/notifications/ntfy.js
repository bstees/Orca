/**
 * ntfy.sh notification sender.
 *
 * @param {import('../config.js').OrcaConfig['ntfy']} config
 * @returns {NtfyNotifier}
 */
export function createNtfyNotifier(config) {
  return {
    async post({ title, message, tags = [], priority = 'default' }) {
      // Notifications are off until an authenticated destination is configured.
      if (!config.topic || !config.token) return { skipped: true };
      if (new URL(config.baseUrl).protocol !== 'https:') {
        throw new Error('Authenticated notifications require HTTPS');
      }
      const res = await fetch(`${config.baseUrl}/${config.topic}`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
          Title: title,
          Tags: tags.join(','),
          Priority: priority,
        },
        body: JSON.stringify({ topic: config.topic, message }),
      });

      if (!res.ok) {
        throw new Error(`ntfy POST failed: HTTP ${res.status}`);
      }

      return res.json();
    },
  };
}

/**
 * @typedef {Object} NtfyNotifier
 * @property {(opts: { title: string, message: string, tags?: string[], priority?: string }) => Promise<Object>} post
 */
