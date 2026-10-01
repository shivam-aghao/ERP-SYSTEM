import { generateSessionCode, formatDateISO, formatDisplayDate } from '../../src/utils/dateHelpers.js';

describe('Date Helpers Unit Tests', () => {
  test('should generate expected session code format', () => {
    const code = generateSessionCode('CSE', '2R1', 'CS303', '2026-09-24', 2);
    expect(code).toBe('SES-CSE-2R1-CS303-20260924-P2');
  });

  test('should format ISO date correctly', () => {
    const iso = formatDateISO('2026-09-24T12:00:00Z');
    expect(iso).toBe('2026-09-24');
  });

  test('should format display date correctly', () => {
    const formatted = formatDisplayDate('2026-09-24');
    expect(formatted).toContain('2026');
  });
});
