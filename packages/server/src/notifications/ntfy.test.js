import { createNtfyNotifier } from '../notifications/ntfy.js';

describe('createNtfyNotifier', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('POSTs to the correct URL with headers', async () => {
    const calls = [];
    global.fetch = async (url, opts) => {
      calls.push({ url, opts });
      return { ok: true, json: async () => ({ id: 'msg-1' }) };
    };

    const notifier = createNtfyNotifier({ baseUrl: 'https://ntfy.sh', topic: 'orca-test', token: 'test-token' });
    const result = await notifier.post({ title: 'Test', message: 'Hello', tags: ['bell'] });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://ntfy.sh/orca-test');
    expect(calls[0].opts.headers.Authorization).toBe('Bearer test-token');
    expect(calls[0].opts.method).toBe('POST');
    expect(calls[0].opts.headers.Title).toBe('Test');
    expect(calls[0].opts.headers.Tags).toBe('bell');
    expect(result).toEqual({ id: 'msg-1' });
  });

  test('throws when server returns non-ok status', async () => {
    global.fetch = async () => ({ ok: false, status: 429 });

    const notifier = createNtfyNotifier({ baseUrl: 'https://ntfy.sh', topic: 'orca-test', token: 'test-token' });
    await expect(notifier.post({ title: 'T', message: 'M' })).rejects.toThrow('HTTP 429');
  });
});

 test.each([{ topic: '', token: '' }, { topic: 'test', token: '' }, { topic: '', token: 'test' }])('does not transmit unless configured: %j', async (config) => {
  const original = global.fetch;
  global.fetch = jest.fn();
  try {
    await expect(createNtfyNotifier(config).post({ title: 'T', message: 'M' })).resolves.toEqual({ skipped: true });
    expect(global.fetch).not.toHaveBeenCalled();
  } finally { global.fetch = original; }
});

test('rejects insecure authenticated notification transport', async () => {
  await expect(createNtfyNotifier({ baseUrl: 'http://example.com', topic: 'test', token: 'test' })
    .post({ title: 'T', message: 'M' })).rejects.toThrow('HTTPS');
});
