import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
const hash = (value) => createHash('sha256').update(value).digest();
const equal = (a, b) => timingSafeEqual(hash(a), hash(b));

// Credentials exist only in memory. Restart revokes every device.
export function createRemoteAuth({ now = Date.now, pairingTtl = 300000, tokenTtl = 43200000 } = {}) {
  let pairing;
  const devices = new Map();
  function newPairing() {
    pairing = { code: randomBytes(16).toString('base64url'), expires: now() + pairingTtl, attempts: 0 };
    return pairing.code;
  }
  function revokeAll() {
    for (const device of devices.values()) {
      for (const socket of device.sockets) socket.close(4001, 'Pairing revoked');
    }
    devices.clear();
    pairing = null;
  }
  return {
    newPairing,
    revokeAll,
    pair(code) {
      if (!pairing || now() >= pairing.expires || pairing.attempts >= 5) return null;
      pairing.attempts++;
      if (typeof code !== 'string' || code.length > 128 || !equal(code, pairing.code)) return null;
      pairing = null; // One use, even if client loses the response.
      const token = randomBytes(32).toString('base64url');
      const expires = now() + tokenTtl;
      devices.set(hash(token).toString('hex'), { expires, sockets: new Set() });
      return { token, expires };
    },
    authenticate(token) {
      if (typeof token !== 'string' || !/^[\w-]{43}$/.test(token)) return null;
      const device = devices.get(hash(token).toString('hex'));
      if (!device || now() >= device.expires) return null;
      return device;
    },
    track(device, socket) {
      device.sockets.add(socket);
      const timer = setTimeout(() => socket.close(4001, 'Pairing expired'), Math.max(0, device.expires - now()));
      timer.unref?.();
      socket.on('close', () => { clearTimeout(timer); device.sockets.delete(socket); });
    },
  };
}

export function remoteToken(headers) {
  const bearer = headers.authorization?.match(/^Bearer ([\w-]{43})$/)?.[1];
  if (bearer) return bearer;
  return headers['sec-websocket-protocol']?.split(',').map((s) => s.trim())
    .find((s) => s.startsWith('orca-auth.'))?.slice('orca-auth.'.length);
}
