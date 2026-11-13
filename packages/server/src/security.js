// Local-only boundary until authenticated device pairing is implemented.
const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
export function assertLocalHost(host) {
  if (!LOOPBACK.has(host)) throw new Error('Orca requires a loopback host; remote device pairing is not implemented.');
}
export function isLocalUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && LOOPBACK.has(url.hostname);
  } catch { return false; }
}
export async function localRequestGuard(request, reply) {
  const host = request.headers.host;
  const origin = request.headers.origin;
  if (!host || !isLocalUrl(`http://${host}`) || (origin !== undefined && !isLocalUrl(origin))) {
    return reply.code(403).send({ error: 'Local-only access required' });
  }
}
