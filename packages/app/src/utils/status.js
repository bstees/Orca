/**
 * Status → display config mapping.
 *
 * @param {string} status
 * @returns {{ label: string, color: string }}
 */
export function getStatusDisplay(status) {
  const map = {
    registered: { label: 'Registered', color: '#7a8fa6' },
    working:    { label: 'Working',    color: '#3ba3e0' },
    idle:       { label: 'Ready',      color: '#f59e0b' },
    blocked:    { label: 'Blocked',    color: '#f87171' },
    needs_input:{ label: 'Needs Input',color: '#60a5fa' },
    responded:  { label: 'Responded', color: '#a78bfa' },
    done:       { label: 'Done',       color: '#34d399' },
  };
  return map[status] ?? { label: status, color: '#7a8fa6' };
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
