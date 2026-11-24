import path from 'node:path';
import fs from 'node:fs';

function findBackendDir(): string {
  const starts = [process.argv[1] ? path.dirname(path.resolve(process.argv[1])) : '', process.cwd()].filter(Boolean);
  for (const start of starts) {
    let dir = start;
    for (let i = 0; i < 6; i++) {
      try { if (JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name === 'backend') return dir; } catch { }
      if (fs.existsSync(path.join(dir, 'backend', 'package.json'))) return path.join(dir, 'backend');
      dir = path.dirname(dir);
    }
  }
  throw new Error('Nem található a backend mappa.');
}
export const BACKEND_DIR = findBackendDir();
export const ROOT_DIR = path.resolve(BACKEND_DIR, '..');
export const DATA_DIR = path.join(BACKEND_DIR, 'data');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');
export const DAILY_DIR = path.join(BACKUP_DIR, 'daily');
export const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
export const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
export const CLIENT_DIST = path.join(ROOT_DIR, 'client', 'dist');

export const FILES = {
  content: path.join(DATA_DIR, 'content.json'),
  admin: path.join(DATA_DIR, 'admin.json'),
  members: path.join(DATA_DIR, 'members.json'),
  trainers: path.join(DATA_DIR, 'trainers.json'),
  sessions: path.join(DATA_DIR, 'sessions.json'),
  log: path.join(DATA_DIR, 'log.jsonl')
};

export const PORT = Number(process.env.PORT) || 3000;
export const TRUST_PROXY = Math.max(0, parseInt(process.env.TRUST_PROXY || '0', 10) || 0);
export const FORCE_HTTPS = process.env.FORCE_HTTPS === '1';
export const MAX_UPLOAD = 8 * 1024 * 1024;

for (const d of [DATA_DIR, BACKUP_DIR, DAILY_DIR, UPLOAD_DIR]) fs.mkdirSync(d, { recursive: true });
