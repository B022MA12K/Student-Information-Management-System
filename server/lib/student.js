export const STATUSES = ['Active', 'Inactive', 'Graduated'];

export const STUDENT_COLUMNS =
  'id, student_id, name, email, course, year_level, status, photo, created_at, updated_at';

// The database stores a file name; the API returns a URL the browser can load.
export const toStudent = ({ photo, ...rest }) => ({
  ...rest,
  photo_url: photo ? `/uploads/${photo}` : null,
});
