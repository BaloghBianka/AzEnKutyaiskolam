import { Router } from 'express';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { MAX_UPLOAD, UPLOAD_DIR } from '../config';
import { hashPw } from '../security';
import { endSessionsWhere } from '../sessions';
import { budToday, str } from '../util';
import {
  content, saveContent, members, setMembers, saveMembers, publicMember, normEmail, cleanPass,
  trainers, setTrainers, saveTrainers, publicTrainer, normUser, todayList, readLog, audit, isAdmin, type Member, type TrainerRec
} from '../store';
import { SECTIONS, type SectionKey } from '../shared/types';
import { CLOUD, uploadImage } from '../db';

export const admin = Router();

admin.use((req, res, next) => (isAdmin(req) ? next() : res.status(401).json({ error: 'Jelentkezz be újra.' })));

admin.get('/content', (_req, res) => res.json(content));
admin.put('/content/:key', express.json({ limit: '2mb' }), (req, res) => {
  const key = req.params.key as SectionKey;
  if (!SECTIONS.includes(key)) return res.status(404).json({ error: 'Ismeretlen rész' });
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Hibás adat' });
  (content as unknown as Record<string, unknown>)[key] = req.body;
  saveContent();
  audit(req, 'tartalom mentése', { section: key });
  res.json({ ok: true });
});

admin.post('/upload', express.json({ limit: Math.ceil(MAX_UPLOAD * 1.4) + 10_000 }), async (req, res) => {
  const mm = /^data:(image\/(jpeg|png|webp|gif));base64,(.+)$/.exec(String(req.body?.data || ''));
  if (!mm) return res.status(400).json({ error: 'Csak JPG, PNG, WEBP vagy GIF kép tölthető fel.' });
  const buf = Buffer.from(mm[3], 'base64');
  if (buf.length > MAX_UPLOAD) return res.status(413).json({ error: 'A kép túl nagy (max. 8 MB).' });
  const sig = buf.subarray(0, 12).toString('hex');
  const ok = { jpeg: sig.startsWith('ffd8ff'), png: sig.startsWith('89504e47'), gif: sig.startsWith('47494638'), webp: sig.startsWith('52494646') && buf.subarray(8, 12).toString() === 'WEBP' }[mm[2] as 'jpeg' | 'png' | 'gif' | 'webp'];
  if (!ok) return res.status(400).json({ error: 'A fájl nem érvényes kép.' });
  const ext = mm[2] === 'jpeg' ? 'jpg' : mm[2];
  const base = String(req.body?.name || 'kep').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'kep';
  const name = `${base}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  if (CLOUD) {
    try { return res.json({ url: await uploadImage(name, buf, mm[1]) }); }
    catch (e) { console.error('Képfeltöltési hiba:', e); return res.status(502).json({ error: 'A kép feltöltése nem sikerült. Próbáld újra.' }); }
  }
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  res.json({ url: '/uploads/' + name });
});

admin.use(express.json({ limit: '500kb' }));

admin.get('/trainers', (_req, res) => res.json({ trainers: trainers.map(publicTrainer), today: todayList() }));
admin.post('/trainers', (req, res) => {
  const b = req.body || {};
  const name = str(b.name, 80).trim(), username = normUser(b.username);
  if (!name) return res.status(400).json({ error: 'Add meg a kiképző nevét.' });
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) return res.status(400).json({ error: 'A felhasználónév 3-30 karakter: kisbetű, szám, pont, kötőjel.' });
  if (trainers.some(t => t.username === username)) return res.status(400).json({ error: 'Ez a felhasználónév már foglalt.' });
  if (typeof b.password !== 'string' || b.password.length < 8) return res.status(400).json({ error: 'A jelszó legalább 8 karakter legyen.' });
  const t: TrainerRec = { id: crypto.randomBytes(8).toString('hex'), name, username, pw: hashPw(b.password), active: true, created: budToday() };
  trainers.push(t); saveTrainers(); audit(req, 'kiképző létrehozva', { trainer: name });
  res.json(publicTrainer(t));
});
admin.post('/trainers/:id/password', (req, res) => {
  const t = trainers.find(x => x.id === req.params.id); if (!t) return res.status(404).json({ error: 'Nincs ilyen kiképző' });
  const pw = req.body?.password;
  if (typeof pw !== 'string' || pw.length < 8) return res.status(400).json({ error: 'A jelszó legalább 8 karakter legyen.' });
  t.pw = hashPw(pw); saveTrainers(); endSessionsWhere(s => s.kind === 'trainer' && s.id === t.id);
  audit(req, 'kiképző jelszócsere', { trainer: t.name });
  res.json({ ok: true });
});
admin.put('/trainers/:id', (req, res) => {
  const t = trainers.find(x => x.id === req.params.id); if (!t) return res.status(404).json({ error: 'Nincs ilyen kiképző' });
  t.name = str(req.body?.name, 80).trim() || t.name; t.active = req.body?.active !== false;
  if (!t.active) endSessionsWhere(s => s.kind === 'trainer' && s.id === t.id);
  saveTrainers(); audit(req, t.active ? 'kiképző módosítva' : 'kiképző letiltva', { trainer: t.name });
  res.json(publicTrainer(t));
});
admin.delete('/trainers/:id', (req, res) => {
  const t = trainers.find(x => x.id === req.params.id); if (!t) return res.status(404).json({ error: 'Nincs ilyen kiképző' });
  setTrainers(trainers.filter(x => x !== t)); saveTrainers(); endSessionsWhere(s => s.kind === 'trainer' && s.id === t.id);
  audit(req, 'kiképző törölve', { trainer: t.name });
  res.json({ ok: true });
});

admin.get('/log', (req, res) => res.json(readLog(Math.min(1000, Number(req.query.limit) || 300))));
admin.get('/backup', (req, res) => {
  audit(req, 'mentés letöltése');
  res.setHeader('Content-Disposition', `attachment; filename="kutyaiskola-mentes-${budToday()}.json"`);
  res.setHeader('Cache-Control', 'no-store');
  res.type('application/json').send(JSON.stringify({ készült: new Date().toISOString(), content, members, trainers, log: readLog(100000) }, null, 2));
});

function memberFieldsError(b: Record<string, unknown>, self: Member | null): string | null {
  const email = normEmail(b.email);
  if (!str(b.name).trim()) return 'A név kötelező.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Adj meg egy érvényes e-mail címet (ezzel lép be a tag).';
  if (members.some(x => x.email === email && x !== self)) return 'Ezzel az e-mail címmel már van tag.';
  return null;
}
admin.get('/members', (_req, res) => res.json(members.map(publicMember)));
admin.post('/members', (req, res) => {
  const b = req.body || {};
  const err = memberFieldsError(b, null); if (err) return res.status(400).json({ error: err });
  if (typeof b.password !== 'string' || b.password.length < 8) return res.status(400).json({ error: 'A kezdő jelszó legalább 8 karakter legyen.' });
  const nm: Member = { id: crypto.randomBytes(8).toString('hex'), name: str(b.name, 120).trim(), email: normEmail(b.email), phone: str(b.phone, 40), dogs: str(b.dogs, 200), note: str(b.note, 1000), passes: [], created: budToday(), pw: hashPw(b.password) };
  members.push(nm); saveMembers(); audit(req, 'tag létrehozva', { member: nm.name, memberId: nm.id });
  res.json(publicMember(nm));
});
admin.put('/members/:id', (req, res) => {
  const m = members.find(x => x.id === req.params.id); if (!m) return res.status(404).json({ error: 'Nincs ilyen tag' });
  const b = req.body || {};
  const err = memberFieldsError(b, m); if (err) return res.status(400).json({ error: err });
  const before = new Map(m.passes.map(ps => [ps.id, ps.used.length]));
  Object.assign(m, { name: str(b.name, 120).trim(), email: normEmail(b.email), phone: str(b.phone, 40), dogs: str(b.dogs, 200), note: str(b.note, 1000), passes: (Array.isArray(b.passes) ? b.passes : []).slice(0, 200).map(cleanPass) });
  saveMembers();
  for (const ps of m.passes) {
    const diff = ps.used.length - (before.get(ps.id) || 0);
    if (diff) audit(req, diff > 0 ? 'kézi alkalom hozzáadás' : 'kézi alkalom törlés', { member: m.name, memberId: m.id, dog: ps.dog, passId: ps.id, pass: ps.type, count: Math.abs(diff) });
  }
  for (const [pid] of before) if (!m.passes.some(ps => ps.id === pid)) audit(req, 'bérlet törölve', { member: m.name, memberId: m.id, passId: pid });
  res.json(publicMember(m));
});
admin.post('/members/:id/password', (req, res) => {
  const m = members.find(x => x.id === req.params.id); if (!m) return res.status(404).json({ error: 'Nincs ilyen tag' });
  const pw = req.body?.password;
  if (typeof pw !== 'string' || pw.length < 8) return res.status(400).json({ error: 'A jelszó legalább 8 karakter legyen.' });
  m.pw = hashPw(pw); saveMembers(); endSessionsWhere(s => s.kind === 'member' && s.id === m.id);
  audit(req, 'tag új jelszót kapott', { member: m.name, memberId: m.id });
  res.json({ ok: true });
});
admin.delete('/members/:id', (req, res) => {
  const m = members.find(x => x.id === req.params.id); if (!m) return res.status(404).json({ error: 'Nincs ilyen tag' });
  setMembers(members.filter(x => x !== m)); saveMembers(); endSessionsWhere(s => s.kind === 'member' && s.id === m.id);
  audit(req, 'tag törölve', { member: m.name, memberId: m.id });
  res.json({ ok: true });
});
