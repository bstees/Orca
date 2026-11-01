import { getStatusDisplay, isActionRequired } from './status.js';

describe('getStatusDisplay', () => {
  test.each([
    ['registered', 'Registered', '#7a8fa6'],
    ['working', 'Working', '#3ba3e0'],
    ['idle', 'Ready', '#f59e0b'],
    ['blocked', 'Blocked', '#f87171'],
    ['needs_input', 'Needs Input', '#60a5fa'],
    ['responded', 'Responded', '#a78bfa'],
    ['done', 'Done', '#34d399'],
  ])('status="%s" → label="%s" color="%s"', (status, label, color) => {
    const result = getStatusDisplay(status);
    expect(result.label).toBe(label);
    expect(result.color).toBe(color);
  });

  test('unknown status returns grey fallback', () => {
    const result = getStatusDisplay('flying');
    expect(result.color).toBe('#7a8fa6');
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
