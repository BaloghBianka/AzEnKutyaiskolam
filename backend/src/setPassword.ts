import fs from 'node:fs';
import readline from 'node:readline';
import { FILES } from './config';
import { hashPw } from './security';

function save(pw: string): void {
  if (!pw || pw.length < 12) { console.error('Az admin jelszó legalább 12 karakter legyen.'); process.exit(1); }
  fs.writeFileSync(FILES.admin, JSON.stringify(hashPw(pw), null, 2));
  console.log('Admin jelszó elmentve. Indítsd újra a szervert, ha fut.');
}

const arg = process.argv[2];
if (arg) save(arg);
else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Új admin jelszó (min. 12 karakter): ', pw => { rl.close(); save(pw.trim()); });
}
