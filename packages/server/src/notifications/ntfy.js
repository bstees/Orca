/**
 * ntfy.sh notification sender.
 *
 * @param {import('../config.js').OrcaConfig['ntfy']} config
 * @returns {NtfyNotifier}
 */
export function createNtfyNotifier(config) {
  return {
    async post({ title, message, tags = [], priority = 'default' }) {
      const res = await fetch(`${config.baseUrl}/${config.topic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
