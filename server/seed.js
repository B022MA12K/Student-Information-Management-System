import './config.js';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const students = [
  ['2026-001', 'Ana Reyes', 'ana.reyes@example.com', 'BSIT', 1, 'Active'],
  ['2026-002', 'Ben Cruz', 'ben.cruz@example.com', 'BSCS', 1, 'Active'],
  ['2026-003', 'Carla Mendoza', 'carla.mendoza@example.com', 'BSIT', 2, 'Active'],
  ['2026-004', 'Diego Santos', 'diego.santos@example.com', 'BSIS', 2, 'Active'],
  ['2026-005', 'Elena Garcia', 'elena.garcia@example.com', 'BSCS', 3, 'Inactive'],
  ['2026-006', 'Felix Navarro', 'felix.navarro@example.com', 'BSIT', 3, 'Active'],
  ['2026-007', 'Grace Villanueva', 'grace.villanueva@example.com', 'BSIS', 4, 'Graduated'],
  ['2026-008', 'Henry Bautista', 'henry.bautista@example.com', 'BSCS', 4, 'Active'],
];

try {
  for (const row of students) {
    await pool.query(
      'INSERT IGNORE INTO students (student_id, name, email, course, year_level, status) VALUES (?, ?, ?, ?, ?, ?)',
      row,
    );
  }

  // The system allows exactly one administrator. Create it only if none exists.
  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
  if (admins.length === 0) {
    const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, 'System Administrator', 'admin')",
      [username, hash],
    );
    console.log(`Created administrator "${username}". Change the password in server/.env before real use.`);
  } else {
    console.log('Administrator already exists. Left unchanged.');
  }
  console.log(`Sample students ready (${students.length}).`);
} catch (err) {
  const hints = {
    ECONNREFUSED: 'MySQL is off. Start it in the XAMPP Control Panel.',
    ER_BAD_DB_ERROR: 'The database does not exist. Import database/schema.sql in phpMyAdmin first.',
    ER_NO_SUCH_TABLE: 'The tables do not exist. Import database/schema.sql in phpMyAdmin first.',
    ER_ACCESS_DENIED_ERROR: 'Wrong user or password. Check DB_USER and DB_PASSWORD in server/.env.',
  };
  console.error(`Seed failed (${err.code}). ${hints[err.code] || err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
