import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { pool } from './db.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import studentRoutes from './routes/students.js';
import userRoutes from './routes/users.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, { setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff') }),
);

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    res.status(500).json({ ok: false, database: err.code || 'error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// After "npm run build", Express also serves the React app from client/dist.
const clientDist = path.join(here, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fix the highlighted fields', errors: { photo: 'Photo must be 2 MB or smaller' } });
  }
  if (err.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ error: 'Fix the highlighted fields', errors: { photo: 'Photo must be a JPG, PNG or WEBP image' } });
  }
  console.error(err);
  res.status(500).json({ error: 'The server hit an error. Check the server terminal for details' });
});

app.listen(config.port, () => {
  console.log(`API running at http://localhost:${config.port}`);
  pool
    .query('SELECT 1')
    .then(() => console.log(`MySQL connected (${config.db.database})`))
    .catch((err) =>
      console.error(`MySQL is not reachable (${err.code}). Start MySQL in the XAMPP Control Panel and check server/.env.`),
    );
});
