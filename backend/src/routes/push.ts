import { Router } from 'express';
import { currentMember, currentTrainer } from '../store';
import { cleanSubscription, hasSub, pushPublicKey, removeSub, upsertSub, type PushRole } from '../push';

export const push = Router();

push.get('/key', (_req, res) => res.json({ key: pushPublicKey() }));

push.post('/subscribe', (req, res) => {
  const sub = cleanSubscription(req.body?.subscription);
  if (!sub) return res.status(400).json({ error: 'Hibás feliratkozás.' });
  const ctx = req.body?.context === 'kikepzo' ? 'kikepzo' : 'tag';
  const m = currentMember(req), t = currentTrainer(req);
  let role: PushRole = 'vendég', id = '';
  if (ctx === 'kikepzo' && t) { role = 'kiképző'; id = t.id; }
  else if (m) { role = 'tag'; id = m.id; }
  else if (t) { role = 'kiképző'; id = t.id; }
  upsertSub(sub, role, id);
  res.json({ ok: true, role });
});

push.post('/unsubscribe', (req, res) => {
  const endpoint = req.body?.endpoint;
  if (typeof endpoint !== 'string') return res.status(400).json({ error: 'Hibás kérés.' });
  removeSub(endpoint);
  res.json({ ok: true });
});

push.post('/status', (req, res) => {
  const endpoint = req.body?.endpoint;
  res.json({ subscribed: typeof endpoint === 'string' && hasSub(endpoint) });
});
