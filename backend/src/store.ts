import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Request } from 'express';
import { FILES } from './config';
import { readJson, writeJsonAtomic, backupBeforeWrite, budToday, str, isDate } from './util';
import { clientIp, hashPw, type PwHash } from './security';
import { getSession } from './sessions';
import type { Content, Pass, AdminMember, MemberView, TrainerAccount, TrainerPassView, TodayItem, LogEntry } from './shared/types';

const loaded = readJson<Content | null>(FILES.content, null);
if (!loaded) throw new Error('Hiányzik vagy hibás a backend/data/content.json');
export const content: Content = loaded;
export function saveContent(): void { backupBeforeWrite(FILES.content, 'content', 30); writeJsonAtomic(FILES.content, content); }

export interface Member { id: string; name: string; email: string; phone: string; dogs: string; note: string; passes: Pass[]; created: string; pw?: PwHash }
export let members: Member[] = readJson<Member[]>(FILES.members, []);
(() => {
  let ch = false;
  for (const m of members) for (const ps of m.passes || []) if (!/^[a-f0-9]{24}$/.test(ps.token || '')) { ps.token = crypto.randomBytes(12).toString('hex'); ch = true; }
  if (ch) writeJsonAtomic(FILES.members, members);
})();
export function setMembers(list: Member[]): void { members = list; }
export function saveMembers(): void { backupBeforeWrite(FILES.members, 'members', 200); writeJsonAtomic(FILES.members, members); }
export const normEmail = (e: unknown) => String(e ?? '').trim().toLowerCase();

export function cleanPass(p: Partial<Pass>): Pass {
  return {
    id: /^[a-f0-9]{8,32}$/.test(p.id || '') ? p.id! : crypto.randomBytes(6).toString('hex'),
    token: /^[a-f0-9]{24}$/.test(p.token || '') ? p.token! : crypto.randomBytes(12).toString('hex'),
    type: str(p.type, 120), dog: str(p.dog, 80),
    start: isDate(p.start) ? p.start : '', end: isDate(p.end) ? p.end : '',
    total: Number.isFinite(Number(p.total)) && Number(p.total) > 0 ? Math.min(999, Math.floor(Number(p.total))) : 0,
    used: (Array.isArray(p.used) ? p.used : []).filter(isDate).slice(0, 999),
    paid: !!p.paid, note: str(p.note, 500)
  };
}
export const publicMember = (m: Member): AdminMember => ({ id: m.id, name: m.name, email: m.email, phone: m.phone, dogs: m.dogs, note: m.note, passes: m.passes, created: m.created, hasPassword: !!(m.pw && m.pw.hash) });
export const memberView = (m: Member): MemberView => ({ name: m.name, email: m.email, dogs: m.dogs, passes: m.passes.map(({ note: _n, ...p }) => p) });
export function currentMember(req: Request): Member | null { const s = getSession(req, 'member'); return s ? members.find(m => m.id === s.id) || null : null; }

export interface TrainerRec { id: string; name: string; username: string; pw: PwHash; active: boolean; created: string }
export let trainers: TrainerRec[] = readJson<TrainerRec[]>(FILES.trainers, []);
export function setTrainers(list: TrainerRec[]): void { trainers = list; }
export function saveTrainers(): void { backupBeforeWrite(FILES.trainers, 'trainers', 30); writeJsonAtomic(FILES.trainers, trainers); }
export const normUser = (u: unknown) => String(u ?? '').trim().toLowerCase();
export const publicTrainer = (t: TrainerRec): TrainerAccount => ({ id: t.id, name: t.name, username: t.username, active: t.active !== false, created: t.created });
export function currentTrainer(req: Request): TrainerRec | null {
  const s = getSession(req, 'trainer'); if (!s) return null;
  const t = trainers.find(x => x.id === s.id);
  return t && t.active !== false ? t : null;
}
export const isAdmin = (req: Request) => !!getSession(req, 'admin');

export function findPassByToken(tok: string): { m: Member; ps: Pass } | null {
  if (!/^[a-f0-9]{24}$/.test(tok || '')) return null;
  for (const m of members) for (const ps of m.passes) if (ps.token === tok) return { m, ps };
  return null;
}
export function passProblem(p: Pass, today: string): string | null {
  if (p.start && p.start > today) return 'Ez a bérlet még nem érvényes.';
  if (p.end && p.end < today) return 'Ez a bérlet lejárt.';
  if (p.total && p.used.length >= p.total) return 'Ezen a bérleten elfogytak az alkalmak.';
  return null;
}
export const trainerView = ({ m, ps }: { m: Member; ps: Pass }, today: string): TrainerPassView => ({
  name: m.name, dog: ps.dog, type: ps.type, start: ps.start, end: ps.end, total: ps.total, used: ps.used.length,
  left: ps.total ? ps.total - ps.used.length : null, paid: ps.paid, usedToday: ps.used.filter(d => d === today).length,
  lastUsed: [...ps.used].sort().pop() || '', problem: passProblem(ps, today), note: ps.note
});
export function todayList(): TodayItem[] {
  const today = budToday(), byPass: Record<string, string> = {};
  for (const e of readLog(500)) if ((e.action === 'levonás' || e.action === 'levonás (felülbírálva)') && e.date === today && e.passId && !byPass[e.passId]) byPass[e.passId] = e.by;
  const list: TodayItem[] = [];
  for (const m of members) for (const ps of m.passes) if (ps.used.includes(today)) list.push({ name: m.name, dog: ps.dog, type: ps.type, left: ps.total ? ps.total - ps.used.length : null, by: byPass[ps.id] || '' });
  return list;
}

export function whoAmI(req: Request): { role: string; name: string } {
  if (isAdmin(req)) return { role: 'admin', name: 'Admin' };
  const t = currentTrainer(req); if (t) return { role: 'kiképző', name: t.name };
  const m = currentMember(req); if (m) return { role: 'tag', name: m.name };
  return { role: '-', name: '-' };
}
export function audit(req: Request, action: string, details: Partial<LogEntry> = {}, as?: { role: string; name: string }): void {
  const who = as || whoAmI(req);
  const entry: LogEntry = { t: new Date().toISOString(), by: who.name, role: who.role, action, ip: clientIp(req), ...details };
  try {
    if (fs.existsSync(FILES.log) && fs.statSync(FILES.log).size > 5 * 1024 * 1024) fs.renameSync(FILES.log, FILES.log.replace('.jsonl', `-${Date.now()}.jsonl`));
    fs.appendFileSync(FILES.log, JSON.stringify(entry) + '\n');
  } catch (e) { console.error('Napló hiba:', e); }
}
export function readLog(limit = 300): LogEntry[] {
  try { return fs.readFileSync(FILES.log, 'utf8').trim().split('\n').filter(Boolean).slice(-limit).map(l => JSON.parse(l) as LogEntry).reverse(); } catch { return []; }
}
const ENV_PW = process.env.ADMIN_PASSWORD || '';
const envAdmin: PwHash | null = ENV_PW.length >= 12 ? hashPw(ENV_PW) : null;
export const readAdmin = () => readJson<PwHash | null>(FILES.admin, null) ?? envAdmin;
