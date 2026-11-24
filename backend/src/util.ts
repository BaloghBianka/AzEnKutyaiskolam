import fs from 'node:fs';
import path from 'node:path';
import { BACKUP_DIR, DAILY_DIR, FILES } from './config';

export function readJson<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) as T; } catch { return fallback; }
}
export function writeJsonAtomic(file: string, data: unknown): void {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
export function backupBeforeWrite(file: string, prefix: string, keep: number): void {
  if (!fs.existsSync(file)) return;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(file, path.join(BACKUP_DIR, `${prefix}-${stamp}.json`));
  const list = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(prefix + '-') && f.endsWith('.json')).sort();
  for (const old of list.slice(0, Math.max(0, list.length - keep))) fs.unlinkSync(path.join(BACKUP_DIR, old));
}

export function budNow(): { date: string; time: string } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}` };
}
export const budToday = (): string => budNow().date;

export function dailySnapshot(): void {
  try {
    const day = budToday(), dir = path.join(DAILY_DIR, day);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      for (const f of [FILES.content, FILES.members, FILES.trainers, FILES.admin, FILES.log]) if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dir, path.basename(f)));
      console.log('Napi biztonsági mentés kész:', day);
    }
    const days = fs.readdirSync(DAILY_DIR).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    for (const old of days.slice(0, Math.max(0, days.length - 30))) fs.rmSync(path.join(DAILY_DIR, old), { recursive: true, force: true });
  } catch (e) { console.error('Napi mentés hiba:', e); }
}

export const str = (v: unknown, max = 300): string => String(v ?? '').slice(0, max);
export const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
