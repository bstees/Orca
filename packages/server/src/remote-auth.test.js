import { createRemoteAuth, remoteToken } from './remote-auth.js';

test('pairing is one-use, expiring and attempt bounded', () => {
  let time = 100;
  const auth = createRemoteAuth({ now: () => time, pairingTtl: 10, tokenTtl: 20 });
  let code = auth.newPairing();
  for (let i = 0; i < 5; i++) expect(auth.pair('wrong')).toBeNull();
  expect(auth.pair(code)).toBeNull();
  code = auth.newPairing(); time += 10;
  expect(auth.pair(code)).toBeNull();
  code = auth.newPairing();
  const result = auth.pair(code);
  expect(result.token).toHaveLength(43);
  expect(auth.pair(code)).toBeNull();
  expect(auth.authenticate(result.token)).not.toBeNull();
  expect(auth.authenticate('fake')).toBeNull();
  time += 20;
  expect(auth.authenticate(result.token)).toBeNull();
});

test('revocation invalidates devices and closes active sockets', () => {
  const auth = createRemoteAuth();
  const result = auth.pair(auth.newPairing());
  const device = auth.authenticate(result.token);
  const handlers = {};
  const socket = { close: jest.fn(), on: (name, callback) => { handlers[name] = callback; } };
  auth.track(device, socket);
  auth.revokeAll();
  expect(auth.authenticate(result.token)).toBeNull();
  expect(socket.close).toHaveBeenCalledWith(4001, 'Pairing revoked');
  handlers.close();
});

test('tokens use headers, never query strings', () => {
  const token = 'a'.repeat(43);
  expect(remoteToken({ authorization: `Bearer ${token}` })).toBe(token);
  expect(remoteToken({ 'sec-websocket-protocol': `orca, orca-auth.${token}` })).toBe(token);
  expect(remoteToken({})).toBeUndefined();
});

test('device expiry closes active socket without further client input', () => {
  jest.useFakeTimers();
  try {
    const auth = createRemoteAuth({ tokenTtl: 100 });
    const { token } = auth.pair(auth.newPairing());
    const socket = { close: jest.fn(), on: jest.fn() };
    auth.track(auth.authenticate(token), socket);
    jest.advanceTimersByTime(100);
    expect(socket.close).toHaveBeenCalledWith(4001, 'Pairing expired');
    expect(auth.authenticate(token)).toBeNull();
  } finally { jest.useRealTimers(); }
});
