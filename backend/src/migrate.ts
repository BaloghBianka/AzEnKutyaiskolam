import fs from 'node:fs';
import { FILES } from './config';
import { readJson } from './util';
import { CLOUD, kvLoad, kvSave, logInsert, logLoad, flushAll } from './db';

async function main(): Promise<void> {
  if (!CLOUD) { console.error('Hiányzik a SUPABASE_URL vagy a SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1); }
  const force = process.argv.includes('--felulir');
  const existing = await kvLoad(['members', 'trainers']);
  const hasData = (Array.isArray(existing.members) && existing.members.length > 0) || (Array.isArray(existing.trainers) && existing.trainers.length > 0);
  if (hasData && !force) {
    console.error('A Supabase-ben már vannak tagok vagy kiképzők. Felülíráshoz futtasd így: npm run feltoltes -- --felulir');
    process.exit(1);
  }
  const content = readJson<unknown>(FILES.content, null);
  const members = readJson<unknown[]>(FILES.members, []);
  const trainers = readJson<unknown[]>(FILES.trainers, []);
  if (content) kvSave('content', content, true);
  kvSave('members', members, true);
  kvSave('trainers', trainers, true);
  let logs = 0;
  const logEmpty = (await logLoad(1)).length === 0;
  if (logEmpty && fs.existsSync(FILES.log)) {
    for (const line of fs.readFileSync(FILES.log, 'utf8').split('\n').filter(Boolean)) {
      try { logInsert(JSON.parse(line)); logs++; } catch { }
    }
  }
  await flushAll(60_000);
  console.log(`Feltöltve: tartalom, ${members.length} tag, ${trainers.length} kiképző, ${logs} naplóbejegyzés.`);
  console.log('Indítsd újra a Render szolgáltatást, hogy betöltse az adatokat.');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
