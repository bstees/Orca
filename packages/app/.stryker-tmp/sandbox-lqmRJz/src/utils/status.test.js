// @ts-nocheck
import { getStatusDisplay, isActionRequired } from './status.js';

describe('getStatusDisplay', () => {
  test.each([
    ['registered', 'Registered', '#6b7280'],
    ['working', 'Working', '#2563eb'],
    ['idle', 'Idle', '#d97706'],
    ['blocked', 'Blocked', '#dc2626'],
    ['needs_input', 'Needs Input', '#7c3aed'],
    ['done', 'Done', '#16a34a'],
  ])('status="%s" → label="%s" color="%s"', (status, label, color) => {
    const result = getStatusDisplay(status);
    expect(result.label).toBe(label);
    expect(result.color).toBe(color);
  });

  test('unknown status returns grey fallback', () => {
    const result = getStatusDisplay('flying');
    expect(result.color).toBe('#6b7280');
    expect(result.label).toBe('flying');
  });
});

describe('isActionRequired', () => {
  test.each([
    ['needs_input', true],
    ['blocked', true],
    ['working', false],
    ['idle', false],
    ['done', false],
    ['registered', false],
  ])('status="%s" → %s', (status, expected) => {
    expect(isActionRequired(status)).toBe(expected);
  });
});
