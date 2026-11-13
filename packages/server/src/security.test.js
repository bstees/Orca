import { assertLocalHost, isLocalUrl, localRequestGuard } from './security.js';

describe('local-only security boundary', () => {
  test.each(['127.0.0.1', 'localhost', '::1'])('accepts loopback %s', (host) => {
    expect(() => assertLocalHost(host)).not.toThrow();
  });
  test.each(['0.0.0.0', '192.168.1.1', '::', undefined])('rejects remote bind %s', (host) => {
    expect(() => assertLocalHost(host)).toThrow('loopback');
  });
  test.each(['https://evil.example', 'http://localhost.evil.example', 'null', 'file:///tmp/a'])('rejects origin %s', (url) => {
    expect(isLocalUrl(url)).toBe(false);
  });
  test.each([
    { host: '127.0.0.1:7337' },
    { host: '[::1]:7337', origin: 'http://localhost:5173' },
  ])('accepts local headers %j', async (headers) => {
    const reply = { code: jest.fn() };
    await localRequestGuard({ headers }, reply);
    expect(reply.code).not.toHaveBeenCalled();
  });
  test.each([
    {}, { host: 'evil.example' },
    { host: 'localhost:7337', origin: 'https://evil.example' },
    { host: 'localhost:7337', origin: 'null' },
  ])('rejects unsafe headers %j', async (headers) => {
    const reply = { code: jest.fn().mockReturnThis(), send: jest.fn() };
    await localRequestGuard({ headers }, reply);
    expect(reply.code).toHaveBeenCalledWith(403);
  });
});
