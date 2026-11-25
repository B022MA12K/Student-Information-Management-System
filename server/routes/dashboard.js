import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { STUDENT_COLUMNS, toStudent } from '../lib/student.js';

const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));

router.get('/summary', async (_req, res) => {
  const [[totals]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 'Active'), 0) AS active,
            COALESCE(SUM(status = 'Inactive'), 0) AS inactive,
            COALESCE(SUM(status = 'Graduated'), 0) AS graduated
       FROM students`,
  );
  const [byCourse] = await pool.query(
    `SELECT COALESCE(NULLIF(course, ''), 'No course') AS label, COUNT(*) AS total
       FROM students GROUP BY label ORDER BY total DESC, label LIMIT 6`,
  );
  const [byYear] = await pool.query(
    'SELECT year_level, COUNT(*) AS total FROM students GROUP BY year_level ORDER BY year_level',
  );
  const [recent] = await pool.query(
    `SELECT ${STUDENT_COLUMNS} FROM students ORDER BY created_at DESC, id DESC LIMIT 5`,
  );

  res.json({
    totals: {
      total: Number(totals.total),
      active: Number(totals.active),
      inactive: Number(totals.inactive),
      graduated: Number(totals.graduated),
    },
    byCourse: byCourse.map((r) => ({ label: r.label, total: Number(r.total) })),
    byYear: byYear.map((r) => ({ year_level: r.year_level, total: Number(r.total) })),
    recent: recent.map(toStudent),
  });
});

export default router;
