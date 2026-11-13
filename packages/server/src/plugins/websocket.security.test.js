import { websocketPlugin, validDashboardMessage } from './websocket.js';

test('dashboard cannot change approval permissions or relay a remote command', async () => {
  const routes = {};
  const registry = { getAll: () => [], updateApprovalMode: jest.fn() };
  await websocketPlugin({ get: (path, options, handler) => { routes[path] = handler; } }, { registry });
  const listeners = {};
  const socket = { send: jest.fn(), on: (type, handler) => { listeners[type] = handler; } };
  routes['/ws/dashboard'](socket);
  listeners.message(Buffer.from(JSON.stringify({ type: 'set_approval_mode', sessionId: 'session', approvalMode: 'bypassPermissions' })));
  expect(registry.updateApprovalMode).not.toHaveBeenCalled();
  expect(JSON.parse(socket.send.mock.calls.at(-1)[0]).code).toBe('LOCAL_APPROVAL_REQUIRED');
});

 test.each([null, [], 1, { type: 'user_prompt', sessionId: 's', prompt: {} }, { type: 'session_dismissed', sessionId: [] }, { type: 'unknown', sessionId: 's' }])('rejects malformed message %j', (msg) => { expect(validDashboardMessage(msg)).toBe(false); });

test('unknown sessions and registry errors cannot escape the socket boundary', async () => {
  const routes = {};
  const registry = { getAll: () => [], get: () => null, remove: jest.fn() };
  await websocketPlugin({ get: (path, options, handler) => { routes[path] = handler; } }, { registry });
  const listeners = {};
  const socket = { send: jest.fn(), on: (type, handler) => { listeners[type] = handler; } };
  routes['/ws/dashboard'](socket);
  expect(() => listeners.message(Buffer.from('null'))).not.toThrow();
  expect(() => listeners.message(Buffer.from(JSON.stringify({ type: 'session_dismissed', sessionId: 'unknown' })))).not.toThrow();
  expect(registry.remove).not.toHaveBeenCalled();
  registry.get = () => ({});
  registry.remove = () => { throw new Error('db unavailable'); };
  expect(() => listeners.message(Buffer.from(JSON.stringify({ type: 'session_dismissed', sessionId: 'known' })))).not.toThrow();
});

test('remote message rate is bounded even for invalid payloads', async () => {
  const routes = {};
  await websocketPlugin({ get: (path, options, handler) => { routes[path] = handler; } }, { registry: { getAll: () => [] }, dashboardOnly: true, messageLimit: 1 });
  const listeners = {};
  const socket = { send: jest.fn(), close: jest.fn(), on: (type, handler) => { listeners[type] = handler; } };
  routes['/ws/dashboard'](socket);
  listeners.message(Buffer.from('null'));
  listeners.message(Buffer.from('null'));
  expect(socket.close).toHaveBeenCalledWith(4008, 'Rate limit');
  expect(routes['/ws/extension']).toBeUndefined();
});
