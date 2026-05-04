import { formatElapsed, elapsedSince } from './time.js';

describe('formatElapsed', () => {
  test.each([
    [0, '0s'],
    [500, '0s'],
    [1000, '1s'],
    [59000, '59s'],
    [60000, '1m 0s'],
    [90000, '1m 30s'],
    [3600000, '1h 0m'],
    [5400000, '1h 30m'],
    [-1000, '0s'],
  ])('ms=%d → "%s"', (ms, expected) => {
    expect(formatElapsed(ms)).toBe(expected);
  });

  test('exactly 0ms returns "0s" (not negative guard)', () => {
    expect(formatElapsed(0)).toBe('0s');
  });

  test('negative ms returns "0s"', () => {
    expect(formatElapsed(-1)).toBe('0s');
  });
});

describe('elapsedSince', () => {
  test('returns a non-empty string for a past timestamp', () => {
    const result = elapsedSince(Date.now() - 5000);
    expect(result).toMatch(/^\d/);
  });

  test('returns a smaller value for a more recent timestamp', () => {
    const old = elapsedSince(Date.now() - 120000); // 2 min ago
    const recent = elapsedSince(Date.now() - 1000);  // 1 sec ago
    // old should parse to larger number: simple string length heuristic isn't great,
    // so just verify recent is "1s" and old contains a minute marker
    expect(recent).toBe('1s');
    expect(old).toContain('m');
  });

  test('subtracts sinceMs from now (not adds)', () => {
    // If it were Date.now() + sinceMs, the result would be a huge future value
    const future = Date.now() + 9_000_000_000; // far future
    // elapsedSince(future) should be "0s" since it's negative
    expect(elapsedSince(future)).toBe('0s');
  });
});
