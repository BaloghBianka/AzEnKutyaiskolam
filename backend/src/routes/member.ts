import { Router } from 'express';
import { verifyPw, hashPw, tooMany, addFail, TOO_MANY } from '../security';
import { renewCookie, keepOnlyCurrent } from '../sessions';
import { currentMember, memberView, saveMembers, audit, type Member } from '../store';

export const member = Router();

member.use((req, res, next) => {
  const m = currentMember(req);
  if (!m) return res.status(401).json({ error: 'Jelentkezz be.' });
  res.locals.member = m;
  next();
});

member.get('/me', (req, res) => {
  renewCookie(req, res, 'member');
  res.json(memberView(res.locals.member as Member));
});

member.post('/password', (req, res) => {
  const m = res.locals.member as Member;
  if (tooMany(['member:pw:' + m.id], 8)) return res.status(429).json(TOO_MANY);
  if (!verifyPw(req.body?.old, m.pw)) { addFail(['member:pw:' + m.id]); return res.status(400).json({ error: 'A jelenlegi jelszó nem jó.' }); }
  const nw = req.body?.new;
  if (typeof nw !== 'string' || nw.length < 8) return res.status(400).json({ error: 'Az új jelszó legalább 8 karakter legyen.' });
  m.pw = hashPw(nw); saveMembers();
  keepOnlyCurrent(req, 'member', m.id);
  audit(req, 'tag jelszócsere', { member: m.name, memberId: m.id });
  res.json({ ok: true });
});
