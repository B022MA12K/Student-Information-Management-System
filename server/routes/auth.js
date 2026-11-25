import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toUser, USER_COLUMNS } from '../lib/user.js';

const router = Router();

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, studentRef: user.studentRef }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

const fieldErrors = (errors) => ({ error: 'Fix the highlighted fields', errors });

router.post('/login', async (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    return res.status(400).json({ error: 'Enter your username and password' });
  }
  const [rows] = await pool.query(
    `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE username = ?`,
    [username],
  );
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return res.status(401).json({ error: 'Incorrect username or password' });
  }
  const user = toUser(row);
  res.json({ token: signToken(user), user });
});

// Anyone can sign up as staff or student. Administrator accounts are never created here.
router.post('/register', async (req, res) => {
  const body = req.body ?? {};
  const role = body.role;
  if (!['staff', 'student'].includes(role)) {
    return res.status(400).json(fieldErrors({ role: 'Choose staff or student' }));
  }

  const errors = {};
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    errors.username = 'Use 3 to 30 letters, numbers, dots, dashes or underscores';
  }
  if (password.length < 8 || password.length > 72) errors.password = 'Use 8 to 72 characters';

  let fullName = String(body.full_name || '').trim();
  let studentRef = null;

  if (role === 'staff') {
    if (!fullName) errors.full_name = 'Full name is required';
    else if (fullName.length > 100) errors.full_name = 'Use 100 characters or fewer';
  } else {
    // A student claims their own record by giving the ID and the email on file.
    const studentId = String(body.student_id || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!studentId) errors.student_id = 'Student ID is required';
    if (!email) errors.email = 'Email is required';
    if (studentId && email) {
      const [rows] = await pool.query(
        'SELECT id, name, email FROM students WHERE student_id = ?',
        [studentId],
      );
      const record = rows[0];
      if (!record || record.email.toLowerCase() !== email) {
        errors.student_id = 'No student record matches this ID and email';
      } else {
        const [linked] = await pool.query('SELECT id FROM users WHERE student_ref = ?', [record.id]);
        if (linked.length) {
          errors.student_id = 'This student already has an account. Ask the administrator to reset the password';
        } else {
          studentRef = record.id;
          fullName = record.name;
        }
      }
    }
  }

  if (Object.keys(errors).length) return res.status(400).json(fieldErrors(errors));

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role, student_ref) VALUES (?, ?, ?, ?, ?)',
      [username, hash, fullName, role, studentRef],
    );
    const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [result.insertId]);
    const user = toUser(rows[0]);
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const linkedKey = /student_ref/.test(err.sqlMessage || '');
      return res.status(409).json(
        fieldErrors(linkedKey
          ? { student_id: 'This student already has an account' }
          : { username: 'This username is taken' }),
      );
    }
    throw err;
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [req.user.id]);
  if (!rows[0]) return res.status(401).json({ error: 'This account no longer exists' });
  res.json(toUser(rows[0]));
});

export default router;
