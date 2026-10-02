export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim();
};

export const generateSessionId = (classCode, subjectCode, date, time) => {
  const cleanDate = date.replace(/[^0-9]/g, '');
  const cleanTime = time.replace(/[^0-9]/g, '');
  return `SESS-${classCode}-${subjectCode}-${cleanDate}-${cleanTime || '01'}`;
};
