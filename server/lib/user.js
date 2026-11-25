export const USER_COLUMNS = 'id, username, full_name, role, student_ref';

export const toUser = (row) => ({
  id: row.id,
  username: row.username,
  fullName: row.full_name,
  role: row.role,
  studentRef: row.student_ref,
});
