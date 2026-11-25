import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { FILES } from './config';
import { readJson, writeJsonAtomic } from './util';
import { isHttps } from './security';
import { CLOUD, kvLoad, kvSave } from './db';

export type Kind = 'admin' | 'member' | 'trainer';
interface Session { kind: Kind; id: string; exp: number }

const DAY = 24 * 60 * 60 * 1000;
export const TTL: Record<Kind, number> = { admin: 8 * 60 * 60 * 1000, member: 365 * DAY, trainer: 365 * DAY };
const COOKIE: Record<Kind, string> = { admin: 'sid', member: 'msid', trainer: 'tsid' };
const SAME: Record<Kind, string> = { admin: 'Strict', member: 'Lax', trainer: 'Lax' };

const sessions = new Map<string, Session>(CLOUD ? [] : Object.entries(readJson<Record<string, Session>>(FILES.sessions, {})));
export async function initSessions(): Promise<void> {
  if (!CLOUD) return;
  const kv = await kvLoad(['sessions']);
  const now = Date.now();
  for (const [h, s] of Object.entries((kv.sessions || {}) as Record<string, Session>)) if (s && s.exp > now) sessions.set(h, s);
}
let timer: NodeJS.Timeout | null = null;
function persist(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(flushSessions, 1000);
}
export function flushSessions(): void {
  if (timer) clearTimeout(timer);
  if (CLOUD) { kvSave('sessions', Object.fromEntries(sessions)); return; }
  try { writeJsonAtomic(FILES.sessions, Object.fromEntries(sessions)); } catch (e) { console.error(e); }
}
const tokHash = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

function getCookie(req: Request, name: string): string | null {
  const m = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
function cookieString(req: Request, kind: Kind, token: string, maxAge = TTL[kind] / 1000): string {
  return `${COOKIE[kind]}=${token}; HttpOnly; SameSite=${SAME[kind]}; Path=/; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;
}
function addCookie(res: Response, value: string): void {
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [...(Array.isArray(prev) ? prev : prev ? [String(prev)] : []), value]);
}

export function startSession(req: Request, res: Response, kind: Kind, id: string): void {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(tokHash(token), { kind, id, exp: Date.now() + TTL[kind] });
  persist();
  addCookie(res, cookieString(req, kind, token));
}
export function getSession(req: Request, kind: Kind): Session | null {
  const t = getCookie(req, COOKIE[kind]);
  if (!t) return null;
  const h = tokHash(t), s = sessions.get(h);
  if (!s || s.kind !== kind) return null;
  if (s.exp < Date.now()) { sessions.delete(h); persist(); return null; }
  const step = kind === 'admin' ? 10 * 60 * 1000 : DAY;
  if (s.exp - Date.now() < TTL[kind] - step) { s.exp = Date.now() + TTL[kind]; persist(); }
  return s;
}
export function renewCookie(req: Request, res: Response, kind: Kind): void {
  const t = getCookie(req, COOKIE[kind]);
  if (t && getSession(req, kind)) addCookie(res, cookieString(req, kind, t));
}
export function endSession(req: Request, res: Response, kind: Kind): void {
  const t = getCookie(req, COOKIE[kind]);
  if (t) { sessions.delete(tokHash(t)); persist(); }
  addCookie(res, cookieString(req, kind, '', 0));
}
export function endSessionsWhere(fn: (s: Session) => boolean): void {
  let ch = false;
  for (const [h, s] of sessions) if (fn(s)) { sessions.delete(h); ch = true; }
  if (ch) persist();
}
export function keepOnlyCurrent(req: Request, kind: Kind, id: string): void {
  const t = getCookie(req, COOKIE[kind]);
  endSessionsWhere(s => s.kind === kind && s.id === id);
  if (t) { sessions.set(tokHash(t), { kind, id, exp: Date.now() + TTL[kind] }); persist(); }
}
setInterval(() => endSessionsWhere(s => s.exp < Date.now()), 60 * 60 * 1000).unref();
