import { AcademicDateUtils } from '../../src/utils/dateUtils.js';

describe('AcademicDateUtils Unit Tests', () => {
  test('getTodayISO returns valid YYYY-MM-DD string', () => {
    const fixedDate = new Date(2025, 9, 15);
    const iso = AcademicDateUtils.getTodayISO(fixedDate);
    expect(iso).toBe('2025-10-15');
  });

  test('formatReadableDate properly formats ISO date strings', () => {
    const formatted = AcademicDateUtils.formatReadableDate('2025-10-15');
    expect(formatted).toBe('15 October 2025');
  });

  test('formatFullWeekdayDate returns day of week and formatted date', () => {
    const result = AcademicDateUtils.formatFullWeekdayDate('2025-10-15');
    expect(result).toContain('Wednesday');
    expect(result).toContain('15 October 2025');
  });

  test('getCurrentAcademicTerm returns Odd semester for Oct', () => {
    const d = new Date(2025, 9, 1);
    const term = AcademicDateUtils.getCurrentAcademicTerm(d);
    expect(term.semesterType).toBe('Odd');
    expect(term.academicYear).toBe('2025-2026');
  });

  test('getCurrentAcademicTerm returns Even semester for March', () => {
    const d = new Date(2025, 2, 1);
    const term = AcademicDateUtils.getCurrentAcademicTerm(d);
    expect(term.semesterType).toBe('Even');
    expect(term.academicYear).toBe('2024-2025');
  });

  test('getDayName returns correct day', () => {
    const day = AcademicDateUtils.getDayName('2025-10-15');
    expect(day).toBe('Wednesday');
  });
});

