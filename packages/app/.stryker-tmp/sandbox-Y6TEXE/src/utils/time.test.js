// @ts-nocheck
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
});

describe('elapsedSince', () => {
  test('returns a non-empty string for a past timestamp', () => {
    const result = elapsedSince(Date.now() - 5000);
    expect(result).toMatch(/^\d/);
  });
});
