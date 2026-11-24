import { Router } from 'express';
import { clientIp, verifyPw, tooMany, addFail, clearFails, TOO_MANY } from '../security';
import { startSession, endSession } from '../sessions';
import { members, trainers, normEmail, normUser, readAdmin, audit, currentMember, currentTrainer, isAdmin } from '../store';
import type { SessionInfo } from '../shared/types';

export const auth = Router();

auth.get('/session', (req, res) => {
  const m = currentMember(req), t = currentTrainer(req);
  const info: SessionInfo = { member: m ? { name: m.name } : null, trainer: t ? { name: t.name } : null, admin: isAdmin(req) };
  res.json(info);
});

auth.get('/me', (req, res) => res.json({ authed: isAdmin(req), hasPassword: !!readAdmin() }));
auth.post('/login', (req, res) => {
  const ip = clientIp(req);
  if (tooMany(['admin:ip:' + ip], 5) || tooMany(['admin:acct'], 30)) return res.status(429).json(TOO_MANY);
  const admin = readAdmin();
  if (!admin) return res.status(503).json({ error: 'Nincs admin jelszó beállítva. Helyben: npm run jelszo. Tárhelyen: ADMIN_PASSWORD környezeti változó, legalább 12 karakter.' });
  if (!verifyPw(req.body?.password, admin)) { addFail(['admin:ip:' + ip, 'admin:acct']); return res.status(401).json({ error: 'Hibás jelszó' }); }
  clearFails(['admin:ip:' + ip]);
  startSession(req, res, 'admin', 'admin');
  audit(req, 'admin belépés', {}, { role: 'admin', name: 'Admin' });
  res.json({ ok: true });
});
auth.post('/logout', (req, res) => { endSession(req, res, 'admin'); res.json({ ok: true }); });

auth.post('/member/login', (req, res) => {
  const ip = clientIp(req), email = normEmail(req.body?.email);
  const keys = ['member:ip:' + ip, 'member:acct:' + email];
  if (tooMany(['member:ip:' + ip], 10) || tooMany(['member:acct:' + email], 10)) return res.status(429).json(TOO_MANY);
  const m = members.find(x => x.email === email);
  if (!verifyPw(req.body?.password, m?.pw) || !m) { addFail(keys); return res.status(401).json({ error: 'Hibás e-mail cím vagy jelszó.' }); }
  clearFails(keys);
  startSession(req, res, 'member', m.id);
  res.json({ ok: true });
});
auth.post('/member/logout', (req, res) => { endSession(req, res, 'member'); res.json({ ok: true }); });

auth.post('/trainer/login', (req, res) => {
  const ip = clientIp(req), user = normUser(req.body?.username);
  const keys = ['trainer:ip:' + ip, 'trainer:acct:' + user];
  if (tooMany(['trainer:ip:' + ip], 10) || tooMany(['trainer:acct:' + user], 8)) return res.status(429).json(TOO_MANY);
  if (!trainers.length) return res.status(503).json({ error: 'Még nincs kiképzői fiók. Az admin a „Bérlet-szkennelés” menüben tud létrehozni.' });
  const t = trainers.find(x => x.username === user && x.active !== false);
  if (!verifyPw(req.body?.password, t?.pw) || !t) { addFail(keys); return res.status(401).json({ error: 'Hibás felhasználónév vagy jelszó.' }); }
  clearFails(keys);
  startSession(req, res, 'trainer', t.id);
  audit(req, 'kiképző belépés', {}, { role: 'kiképző', name: t.name });
  res.json({ ok: true, name: t.name });
});
auth.post('/trainer/logout', (req, res) => { endSession(req, res, 'trainer'); res.json({ ok: true }); });
