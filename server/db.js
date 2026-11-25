import mysql from 'mysql2/promise';
import { config } from './config.js';

// A pool keeps a few connections open and reuses them.
export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
});
