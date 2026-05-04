/**
 * Status → display config mapping.
 *
 * @param {string} status
 * @returns {{ label: string, color: string }}
 */
export function getStatusDisplay(status) {
  const map = {
    registered: { label: 'Registered', color: '#6b7280' },
    working: { label: 'Working', color: '#2563eb' },
    idle: { label: 'Idle', color: '#d97706' },
    blocked: { label: 'Blocked', color: '#dc2626' },
    needs_input: { label: 'Needs Input', color: '#7c3aed' },
    done: { label: 'Done', color: '#16a34a' },
  };
  return map[status] ?? { label: status, color: '#6b7280' };
}

/**
 * Returns true when a session requires human attention.
 *
 * @param {string} status
 * @returns {boolean}
 */
export function isActionRequired(status) {
  return status === 'needs_input' || status === 'blocked';
}
