export const formatDateToYMD = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateOnly = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
  }
  return new Date(dateStr);
};

export const PERIOD_TIMINGS = {
  1: { start: '10:15 AM', end: '11:15 AM' },
  2: { start: '11:15 AM', end: '12:15 PM' },
  3: { start: '12:15 PM', end: '01:15 PM' },
  4: { start: '01:45 PM', end: '02:45 PM' },
  5: { start: '02:45 PM', end: '03:45 PM' },
  6: { start: '03:45 PM', end: '04:45 PM' },
  7: { start: '04:45 PM', end: '05:45 PM' },
};

export const getPeriodTiming = (periodNo) => {
  return PERIOD_TIMINGS[periodNo] || { start: '10:15 AM', end: '11:15 AM' };
};
