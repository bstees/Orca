import { act, renderHook } from '@testing-library/react';
import { useOrcaSocket } from './useOrcaSocket.js';

let instances, previous;
beforeEach(() => {
  jest.useFakeTimers(); instances = []; previous = global.WebSocket;
  global.WebSocket = class {
    static OPEN = 1;
    constructor(url, protocols) { this.url = url; this.protocols = protocols; this.listeners = {}; this.readyState = 1; instances.push(this); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    close() { this.listeners.close?.({ code: 1000 }); }
    send() {}
  };
});
afterEach(() => { global.WebSocket = previous; jest.useRealTimers(); });

test('unpaired remote and insecure token transport do not connect', () => {
  const { rerender } = renderHook(({ enabled, url }) => useOrcaSocket(url, { enabled, token: 'token' }), { initialProps: { enabled: false, url: 'wss://example.com/ws/dashboard' } });
  expect(instances).toHaveLength(0);
  rerender({ enabled: true, url: 'ws://example.com/ws/dashboard' });
  expect(instances).toHaveLength(0);
});
test('token is a subprotocol, cleanup and revocation never reconnect stale sockets', () => {
  const { result, unmount } = renderHook(() => useOrcaSocket('wss://example.com/ws/dashboard', { token: 'synthetic' }));
  expect(instances[0].protocols).toEqual(['orca', 'orca-auth.synthetic']);
  act(() => instances[0].listeners.open());
  act(() => instances[0].listeners.close({ code: 4001 }));
  expect(result.current.socketStatus).toBe('pairing');
  act(() => jest.advanceTimersByTime(10000));
  expect(instances).toHaveLength(1);
  unmount();
  act(() => jest.advanceTimersByTime(10000));
  expect(instances).toHaveLength(1);
});
