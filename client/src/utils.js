export const STATUSES = ['Active', 'Inactive', 'Graduated'];
export const YEAR_LEVELS = [1, 2, 3, 4, 5, 6];
export const COURSES = ['BSIT', 'BSCS', 'BSIS', 'BSCE', 'BSBA', 'BSED'];

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

export function ordinal(n) {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

export const yearLabel = (n) => `${ordinal(n)} year`;

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Not set';

export const ROLE_LABELS = { admin: 'Administrator', staff: 'Staff', student: 'Student' };
