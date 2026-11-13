import { loadConfig } from './config.js';

test('safe defaults are loopback and no notification topic or token', () => {
  const keys = ['ORCA_HOST', 'NTFY_TOPIC', 'NTFY_TOKEN'];
  const previous = keys.map((key) => process.env[key]);
  try {
    keys.forEach((key) => delete process.env[key]);
    const config = loadConfig();
    expect(config.host).toBe('127.0.0.1');
    expect(config.ntfy.topic).toBe('');
    expect(config.ntfy.token).toBe('');
  } finally {
    keys.forEach((key, i) => {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    });
  }
});
