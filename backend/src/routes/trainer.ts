import { Router } from 'express';
import { renewCookie } from '../sessions';
import { budToday } from '../util';
import { currentTrainer, isAdmin, todayList, findPassByToken, passProblem, trainerView, saveMembers, audit } from '../store';

export const trainer = Router();

trainer.use((req, res, next) => {
  const t = currentTrainer(req);
  if (!t && !isAdmin(req)) return res.status(401).json({ error: 'Kiképzői belépés szükséges.' });
  res.locals.trainerName = t ? t.name : 'Admin';
  res.locals.isTrainer = !!t;
  next();
});

trainer.get('/me', (req, res) => {
  if (res.locals.isTrainer) renewCookie(req, res, 'trainer');
  res.json({ ok: true, name: res.locals.trainerName, today: todayList() });
});

trainer.get('/pass/:token', (req, res) => {
  const hit = findPassByToken(req.params.token);
  if (!hit) return res.status(404).json({ error: 'Ismeretlen bérlet. Lehet, hogy törölték vagy újat kapott a tag.' });
  res.json(trainerView(hit, budToday()));
});

trainer.post('/pass/:token/use', (req, res) => {
  const hit = findPassByToken(req.params.token);
  if (!hit) return res.status(404).json({ error: 'Ismeretlen bérlet.' });
  const today = budToday();
  const why = passProblem(hit.ps, today) || (hit.ps.used.includes(today) ? 'Ma már levontunk egy alkalmat erről a bérletről.' : null);
  if (why && !req.body?.force) return res.status(409).json({ error: why, canForce: true });
  hit.ps.used.push(today); saveMembers();
  audit(req, why ? 'levonás (felülbírálva)' : 'levonás', {
    member: hit.m.name, memberId: hit.m.id, dog: hit.ps.dog, passId: hit.ps.id, pass: hit.ps.type, date: today,
    reason: why || undefined, left: hit.ps.total ? hit.ps.total - hit.ps.used.length : null
  });
  res.json(trainerView(hit, today));
});

trainer.post('/pass/:token/undo', (req, res) => {
  const hit = findPassByToken(req.params.token);
  if (!hit) return res.status(404).json({ error: 'Ismeretlen bérlet.' });
  const today = budToday(), i = hit.ps.used.lastIndexOf(today);
  if (i < 0) return res.status(400).json({ error: 'Ma nem volt levonás erről a bérletről.' });
  hit.ps.used.splice(i, 1); saveMembers();
  audit(req, 'visszavonás', { member: hit.m.name, memberId: hit.m.id, dog: hit.ps.dog, passId: hit.ps.id, pass: hit.ps.type, date: today });
  res.json(trainerView(hit, today));
});
