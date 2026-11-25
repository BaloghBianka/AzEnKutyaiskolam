import webpush from 'web-push';
import { FILES } from './config';
import { readJson, writeJsonAtomic } from './util';
import { CLOUD, kvLoad, kvSave } from './db';

export type PushRole = 'tag' | 'kiképző' | 'vendég';
export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string }; role: PushRole; id: string; created: string; seen: string }
interface Vapid { publicKey: string; privateKey: string }

const SUBJECT = process.env.PUSH_SUBJECT || 'https://az-en-kutyaiskolam.onrender.com';
const MAX_SUBS = 5000;
let vapid: Vapid | null = null;
let subs: PushSub[] = [];

const validVapid = (v: unknown): v is Vapid => !!v && typeof (v as Vapid).publicKey === 'string' && typeof (v as Vapid).privateKey === 'string';

function save(): void {
  if (CLOUD) kvSave('push', subs);
  else writeJsonAtomic(FILES.push, subs);
}

export async function initPush(): Promise<void> {
  if (CLOUD) {
    const kv = await kvLoad(['vapid', 'push']);
    vapid = validVapid(kv.vapid) ? kv.vapid : null;
    subs = Array.isArray(kv.push) ? (kv.push as PushSub[]) : [];
  } else {
    const v = readJson<unknown>(FILES.vapid, null);
    vapid = validVapid(v) ? v : null;
    subs = readJson<PushSub[]>(FILES.push, []);
  }
  if (!vapid) {
    vapid = webpush.generateVAPIDKeys();
    if (CLOUD) kvSave('vapid', vapid); else writeJsonAtomic(FILES.vapid, vapid);
    console.log('Push: új kulcspár létrehozva.');
  }
  webpush.setVapidDetails(SUBJECT, vapid.publicKey, vapid.privateKey);
}

export const pushPublicKey = () => vapid?.publicKey || '';

export function cleanSubscription(raw: unknown): { endpoint: string; keys: { p256dh: string; auth: string } } | null {
  const s = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  if (!s || typeof s.endpoint !== 'string' || !/^https:\/\/[^\s]{10,1000}$/.test(s.endpoint)) return null;
  const p256dh = s.keys?.p256dh, auth = s.keys?.auth;
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !/^[A-Za-z0-9_=-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_=-]{8,100}$/.test(auth)) return null;
  return { endpoint: s.endpoint, keys: { p256dh, auth } };
}

export function upsertSub(sub: { endpoint: string; keys: { p256dh: string; auth: string } }, role: PushRole, id: string): void {
  const now = new Date().toISOString();
  const cur = subs.find(x => x.endpoint === sub.endpoint);
  if (cur) Object.assign(cur, { keys: sub.keys, role, id, seen: now });
  else {
    if (subs.length >= MAX_SUBS) subs.sort((a, b) => a.seen.localeCompare(b.seen)).shift();
    subs.push({ ...sub, role, id, created: now, seen: now });
  }
  save();
}

export function removeSub(endpoint: string): boolean {
  const before = subs.length;
  subs = subs.filter(x => x.endpoint !== endpoint);
  if (subs.length !== before) { save(); return true; }
  return false;
}

export const hasSub = (endpoint: string) => subs.some(x => x.endpoint === endpoint);

export function pushStats() {
  const c = { összes: subs.length, tag: 0, kiképző: 0, vendég: 0 };
  for (const s of subs) c[s.role]++;
  return c;
}

export interface PushMessage { title: string; body: string; url: string; tag?: string }

export async function sendPush(filter: (s: PushSub) => boolean, msg: PushMessage): Promise<{ sent: number; failed: number; removed: number }> {
  const targets = subs.filter(filter);
  const payload = JSON.stringify(msg);
  let sent = 0, failed = 0;
  const gone = new Set<string>();
  for (let i = 0; i < targets.length; i += 25) {
    const batch = targets.slice(i, i + 25);
    const results = await Promise.allSettled(batch.map(s => webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 12 * 60 * 60, urgency: 'high', topic: msg.tag })));
    results.forEach((r, j) => {
      if (r.status === 'fulfilled') { sent++; return; }
      failed++;
      const code = (r.reason as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) gone.add(batch[j].endpoint);
      else console.error('Push hiba:', code, String((r.reason as Error)?.message || r.reason).slice(0, 200));
    });
  }
  if (gone.size) { subs = subs.filter(s => !gone.has(s.endpoint)); save(); }
  return { sent, failed, removed: gone.size };
}
