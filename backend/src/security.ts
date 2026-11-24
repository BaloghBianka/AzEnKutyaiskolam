import crypto from 'node:crypto';
import type { Request } from 'express';
import { TRUST_PROXY } from './config';

export interface PwHash { salt: string; hash: string }

export function hashPw(pw: string): PwHash {
  const salt = crypto.randomBytes(16);
  return { salt: salt.toString('hex'), hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
const DUMMY = hashPw(crypto.randomBytes(8).toString('hex'));
export function verifyPw(pw: unknown, rec: PwHash | null | undefined): boolean {
  if (typeof pw !== 'string') return false;
  const r = rec && rec.salt ? rec : DUMMY;
  const h = crypto.scryptSync(pw, Buffer.from(r.salt, 'hex'), 64);
  return crypto.timingSafeEqual(h, Buffer.from(r.hash, 'hex')) && r !== DUMMY;
}

export function clientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (TRUST_PROXY && xff) {
    const list = String(xff).split(',').map(s => s.trim()).filter(Boolean);
    const ip = list[Math.max(0, list.length - TRUST_PROXY)];
    if (ip) return ip;
  }
  return req.socket.remoteAddress || '?';
}
export const isHttps = (req: Request): boolean =>
  TRUST_PROXY ? String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' : (req.socket as { encrypted?: boolean }).encrypted === true;

const fails = new Map<string, number[]>();
const WINDOW = 15 * 60 * 1000;
export function tooMany(keys: string[], limit: number): boolean {
  const now = Date.now();
  return keys.some(k => (fails.get(k) || []).filter(t => now - t < WINDOW).length >= limit);
}
export function addFail(keys: string[]): void {
  const now = Date.now();
  for (const k of keys) fails.set(k, [...(fails.get(k) || []).filter(t => now - t < WINDOW), now]);
}
export function clearFails(keys: string[]): void { for (const k of keys) fails.delete(k); }
setInterval(() => { const now = Date.now(); for (const [k, v] of fails) if (!v.some(t => now - t < WINDOW)) fails.delete(k); }, 10 * 60 * 1000).unref();

export const TOO_MANY = { error: 'Túl sok sikertelen próbálkozás. Várj 15 percet, vagy szólj az adminnak.' };
