import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// All accounts, for the administrator's Accounts page.
router.get('/', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.role, u.created_at, s.student_id
       FROM users u LEFT JOIN students s ON s.id = u.student_ref
      ORDER BY u.role = 'admin' DESC, u.created_at DESC`,
  );
  res.json(rows);
});

// Forgotten passwords go through the administrator.
router.put('/:id/password', async (req, res) => {
  const id = Number(req.params.id);
  const password = String(req.body?.password || '');
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid account' });
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Use 8 to 72 characters', errors: { password: 'Use 8 to 72 characters' } });
  }
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Account not found' });
  res.json({ ok: true });
});

export default router;
