import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const here = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(here, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// Storage: photos are written to server/uploads with a random name.
// The database keeps only the file name.
export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomBytes(12).toString('hex')}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    EXTENSIONS[file.mimetype] ? cb(null, true) : cb(new Error('INVALID_FILE_TYPE')),
});

export async function removeFile(filename) {
  if (!filename) return;
  await fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(filename))).catch(() => {});
}
