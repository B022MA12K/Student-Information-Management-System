import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { removeFile, upload } from '../middleware/upload.js';
import { STATUSES, STUDENT_COLUMNS, toStudent } from '../lib/student.js';

const router = Router();
router.use(requireAuth);

const findRaw = async (id) => {
  const [rows] = await pool.query(`SELECT ${STUDENT_COLUMNS} FROM students WHERE id = ?`, [id]);
  return rows[0];
};

function validate(body) {
  const errors = {};
  const values = {
    student_id: String(body.student_id || '').trim(),
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    course: String(body.course || '').trim(),
    year_level: Number(body.year_level),
    status: String(body.status || ''),
  };
  if (!values.student_id) errors.student_id = 'Student ID is required';
  else if (!/^[A-Za-z0-9-]{3,20}$/.test(values.student_id)) {
    errors.student_id = 'Use 3 to 20 letters, numbers or dashes';
  }
  if (!values.name) errors.name = 'Name is required';
  else if (values.name.length > 100) errors.name = 'Use 100 characters or fewer';
  if (!values.email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 100) {
    errors.email = 'Enter a valid email address';
  }
  if (values.course.length > 100) errors.course = 'Use 100 characters or fewer';
  if (!Number.isInteger(values.year_level) || values.year_level < 1 || values.year_level > 6) {
    errors.year_level = 'Choose a year level from 1 to 6';
  }
  if (!STATUSES.includes(values.status)) errors.status = 'Choose a status';
  return { errors, values };
}

const failValidation = (errors) => ({ error: 'Fix the highlighted fields', errors });

function duplicateError(err) {
  const isEmail = /for key '(?:students\.)?email'/i.test(err.sqlMessage || '');
  return failValidation(
    isEmail
      ? { email: 'Another student already uses this email' }
      : { student_id: 'This student ID already exists' },
  );
}

// Search and filter the records (administrator and staff).
router.get('/', requireRole('admin', 'staff'), async (req, res) => {
  const q = String(req.query.q || '').trim();
  const status = String(req.query.status || '');
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const where = [];
  const params = [];
  if (q) {
    const like = `%${q}%`;
    where.push('(name LIKE ? OR student_id LIKE ? OR email LIKE ? OR course LIKE ?)');
    params.push(like, like, like, like);
  }
  if (STATUSES.includes(status)) {
    where.push('status = ?');
    params.push(status);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM students ${clause}`, params);
  const [rows] = await pool.query(
    `SELECT ${STUDENT_COLUMNS} FROM students ${clause} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  res.json({ data: rows.map(toStudent), total: Number(total), page, pages: Math.max(Math.ceil(total / limit), 1) });
});

router.post('/', requireRole('admin', 'staff'), upload.single('photo'), async (req, res) => {
  const newPhoto = req.file?.filename ?? null;
  const { errors, values } = validate(req.body ?? {});
  if (Object.keys(errors).length) {
    await removeFile(newPhoto);
    return res.status(400).json(failValidation(errors));
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO students (student_id, name, email, course, year_level, status, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [values.student_id, values.name, values.email, values.course || null, values.year_level, values.status, newPhoto],
    );
    res.status(201).json(toStudent(await findRaw(result.insertId)));
  } catch (err) {
    await removeFile(newPhoto);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json(duplicateError(err));
    throw err;
  }
});

// A student may open only their own record; administrator and staff may open any.
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid student ID' });
  if (req.user.role === 'student' && req.user.studentRef !== id) {
    return res.status(403).json({ error: 'You can only open your own record' });
  }
  const row = await findRaw(id);
  if (!row) return res.status(404).json({ error: 'Student not found' });
  res.json(toStudent(row));
});

router.put('/:id', requireRole('admin', 'staff'), upload.single('photo'), async (req, res) => {
  const id = Number(req.params.id);
  const newPhoto = req.file?.filename ?? null;
  const existing = Number.isInteger(id) ? await findRaw(id) : null;
  if (!existing) {
    await removeFile(newPhoto);
    return res.status(404).json({ error: 'Student not found' });
  }
  const { errors, values } = validate(req.body ?? {});
  if (Object.keys(errors).length) {
    await removeFile(newPhoto);
    return res.status(400).json(failValidation(errors));
  }

  const removeOld = req.body?.remove_photo === 'true';
  const photo = newPhoto ?? (removeOld ? null : existing.photo);
  try {
    await pool.query(
      `UPDATE students
          SET student_id = ?, name = ?, email = ?, course = ?, year_level = ?, status = ?, photo = ?
        WHERE id = ?`,
      [values.student_id, values.name, values.email, values.course || null, values.year_level, values.status, photo, id],
    );
  } catch (err) {
    await removeFile(newPhoto);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json(duplicateError(err));
    throw err;
  }
  if (existing.photo && existing.photo !== photo) await removeFile(existing.photo);
  res.json(toStudent(await findRaw(id)));
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const existing = Number.isInteger(id) ? await findRaw(id) : null;
  if (!existing) return res.status(404).json({ error: 'Student not found' });
  await pool.query('DELETE FROM students WHERE id = ?', [id]);
  await removeFile(existing.photo);
  res.json({ ok: true });
});

export default router;
