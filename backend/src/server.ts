import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { PORT, TRUST_PROXY, FORCE_HTTPS, PUBLIC_DIR, UPLOAD_DIR, CLIENT_DIST } from './config';
import { isHttps } from './security';
import { flushSessions, initSessions } from './sessions';
import { CLOUD, flushAll, pruneHistory } from './db';
import { dailySnapshot } from './util';
import { content, readAdmin, initStore } from './store';
import { auth } from './routes/auth';
import { member } from './routes/member';
import { trainer } from './routes/trainer';
import { admin } from './routes/admin';

const app = express();
app.disable('x-powered-by');
if (TRUST_PROXY) app.set('trust proxy', TRUST_PROXY);

const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:",
  "font-src 'self'", "connect-src 'self'", "media-src 'self' blob:", "frame-src https://www.openstreetmap.org",
  "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'"
].join('; ');
app.use((req: Request, res: Response, next: NextFunction) => {
  if (FORCE_HTTPS && TRUST_PROXY && !isHttps(req)) return res.redirect(301, 'https://' + String(req.headers.host || '').replace(/[^a-zA-Z0-9.:-]/g, '') + req.originalUrl);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  if (isHttps(req)) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && !String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ error: 'JSON kell' });
  next();
});
app.get('/api/content', (_req, res) => res.json(content));
app.use('/api/admin', admin);
app.use('/api', express.json({ limit: '100kb' }));
app.use('/api', auth);
app.use('/api/member', member);
app.use('/api/trainer', trainer);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Nem található' }));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d', index: false, dotfiles: 'deny' }));
app.use('/fonts', express.static(path.join(PUBLIC_DIR, 'fonts'), { maxAge: '30d', index: false }));
app.get(['/edzo', '/edzo/*'], (req, res) => res.redirect(301, '/kikepzo' + req.path.slice(5)));

const indexHtml = path.join(CLIENT_DIST, 'index.html');
if (fs.existsSync(indexHtml)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '7d', setHeaders: (res, p) => { if (!p.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'no-cache'); } }));
  app.get('*', (_req, res) => { res.setHeader('Cache-Control', 'no-cache'); res.sendFile(indexHtml); });
} else {
  app.get('/', (_req, res) => res.type('text').send('A kliens még nincs lefordítva. Fejlesztéshez: npm run dev (http://localhost:5173), élesben: npm run build.'));
}

app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'A küldött adat túl nagy.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Hibás kérés' });
  console.error(err);
  res.status(500).json({ error: 'Szerverhiba' });
});

if (CLOUD) {
  pruneHistory();
  setInterval(pruneHistory, 24 * 60 * 60 * 1000).unref();
} else {
  dailySnapshot();
  setInterval(dailySnapshot, 60 * 60 * 1000).unref();
}
for (const sig of ['SIGTERM', 'SIGINT'] as const) process.on(sig, async () => { flushSessions(); await flushAll(); process.exit(0); });

async function main(): Promise<void> {
  await initStore();
  await initSessions();
  app.listen(PORT, () => {
    console.log(`Backend fut: http://localhost:${PORT}`);
    console.log(CLOUD ? 'Adattárolás: Supabase' : 'Adattárolás: helyi fájlok (backend/data)');
    if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length < 12) console.log('FIGYELEM: az ADMIN_PASSWORD rövidebb 12 karakternél, ezért nincs használatban.');
    if (!readAdmin()) console.log('FIGYELEM: nincs admin jelszó. Állítsd be: npm run jelszo, vagy az ADMIN_PASSWORD környezeti változóval (min. 12 karakter).');
    if (!TRUST_PROXY) console.log('Megjegyzés: TRUST_PROXY=0. Ha a szerver proxy mögött fut (pl. Render), állítsd TRUST_PROXY=1-re.');
  });
}
main().catch(e => { console.error('Indítási hiba, nem sikerült betölteni az adatokat:', e); process.exit(1); });
