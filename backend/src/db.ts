const BASE = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
export const CLOUD = !!(BASE && KEY);
export const BUCKET = 'uploads';

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { apikey: KEY, ...extra };
  if (KEY.startsWith('eyJ')) h.Authorization = `Bearer ${KEY}`;
  return h;
}

async function call(path: string, init: { method?: string; headers?: Record<string, string>; body?: string | Buffer } = {}): Promise<Response> {
  const r = await fetch(BASE + path, { method: init.method || 'GET', headers: headers(init.headers), body: init.body });
  if (!r.ok) throw new Error(`Supabase ${r.status} (${path.split('?')[0]}): ${(await r.text()).slice(0, 300)}`);
  return r;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
async function retry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { last = e; await wait(500 * 2 ** i); }
  }
  throw last;
}

export async function kvLoad(keys: string[]): Promise<Record<string, unknown>> {
  const r = await retry(() => call(`/rest/v1/kv?select=key,data&key=in.(${keys.map(encodeURIComponent).join(',')})`));
  const rows = (await r.json()) as { key: string; data: unknown }[];
  return Object.fromEntries(rows.map(x => [x.key, x.data]));
}

const JSON_POST = { 'Content-Type': 'application/json', Prefer: 'return=minimal' };

async function writeKv(key: string, snapshot: string, history: boolean): Promise<void> {
  await retry(() => call('/rest/v1/kv?on_conflict=key', {
    method: 'POST',
    headers: { ...JSON_POST, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: `[{"key":${JSON.stringify(key)},"data":${snapshot},"updated_at":${JSON.stringify(new Date().toISOString())}}]`
  }));
  if (history) {
    await retry(() => call('/rest/v1/kv_history', { method: 'POST', headers: JSON_POST, body: `[{"key":${JSON.stringify(key)},"data":${snapshot}}]` }))
      .catch(e => console.error('Előzmény mentési hiba:', e));
  }
}

interface Slot { running: Promise<void> | null; next: { snapshot: string; history: boolean } | null }
const slots = new Map<string, Slot>();

export function kvSave(key: string, data: unknown, history = false): void {
  const slot = slots.get(key) || { running: null, next: null };
  slots.set(key, slot);
  slot.next = { snapshot: JSON.stringify(data), history: history || !!slot.next?.history };
  if (!slot.running) slot.running = drain(key, slot);
}

async function drain(key: string, slot: Slot): Promise<void> {
  while (slot.next) {
    const job = slot.next;
    slot.next = null;
    try { await writeKv(key, job.snapshot, job.history); }
    catch (e) { console.error(`ADATMENTÉSI HIBA (${key}):`, e); }
  }
  slot.running = null;
}

const logQueue: unknown[] = [];
let logRunning: Promise<void> | null = null;
export function logInsert(entry: unknown): void {
  logQueue.push(entry);
  if (!logRunning) logRunning = (async () => {
    while (logQueue.length) {
      const batch = logQueue.splice(0, 200);
      try { await retry(() => call('/rest/v1/audit_log', { method: 'POST', headers: JSON_POST, body: JSON.stringify(batch.map(e => ({ entry: e }))) })); }
      catch (e) { console.error('Napló mentési hiba:', e); }
    }
    logRunning = null;
  })();
}

export async function logLoad(limit: number): Promise<unknown[]> {
  const r = await retry(() => call(`/rest/v1/audit_log?select=entry&order=id.desc&limit=${Math.max(1, Math.floor(limit))}`));
  return ((await r.json()) as { entry: unknown }[]).map(x => x.entry);
}

export async function flushAll(timeoutMs = 8000): Promise<void> {
  const pending = [...[...slots.values()].map(s => s.running), logRunning].filter(Boolean) as Promise<void>[];
  let t: NodeJS.Timeout | undefined;
  await Promise.race([Promise.all(pending), new Promise<void>(r => { t = setTimeout(r, timeoutMs); })]);
  if (t) clearTimeout(t);
}

export async function uploadImage(name: string, buf: Buffer, mime: string): Promise<string> {
  await retry(() => call(`/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': mime, 'Cache-Control': 'max-age=31536000', 'x-upsert': 'false' },
    body: buf
  }), 2);
  return `${BASE}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`;
}

export async function pruneHistory(days = 60): Promise<void> {
  const before = new Date(Date.now() - days * 864e5).toISOString();
  await call(`/rest/v1/kv_history?saved_at=lt.${encodeURIComponent(before)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } })
    .catch(e => console.error('Előzmény takarítási hiba:', e));
}
