export const formatDateISO = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
};

export const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('en-GB', options);
};

export const generateSessionCode = (dept, classCode, subject, date, period) => {
  const d = date ? date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
  const p = period || '1';
  return `SES-${dept}-${classCode}-${subject}-${d}-P${p}`;
};
