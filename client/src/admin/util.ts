import { api } from '../api';
import { qrSvg } from '../lib/qr';
import type { AdminMember, Pass } from '@shared/types';

export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o)) as T;
export const todayStr = () => new Date().toISOString().slice(0, 10);
export function genPw(): string {
  const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return [...crypto.getRandomValues(new Uint32Array(10))].map(x => a[x % a.length]).join('');
}

export function pickFiles(multiple: boolean): Promise<File[]> {
  return new Promise(res => {
    const f = document.createElement('input');
    f.type = 'file'; f.accept = 'image/jpeg,image/png,image/webp,image/gif'; f.multiple = multiple;
    f.onchange = () => res([...(f.files || [])]);
    f.click();
  });
}
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); return; }
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const sc = Math.min(1, 1800 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
      cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      resolve(cv.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86));
    };
    img.onerror = () => reject(new Error('A kép nem olvasható.'));
    img.src = url;
  });
}
export async function upload(file: File): Promise<string> {
  const data = await shrink(file);
  const r = await api<{ url: string }>('/api/admin/upload', { method: 'POST', body: { name: file.name, data } });
  return r.url;
}

export async function printPassCard(m: AdminMember, p: Pass, logo: string): Promise<void> {
  if (!p.token) throw new Error('Előbb mentsd el a tagot, utána nyomtatható a QR-kártya.');
  const w = window.open('', '_blank');
  if (!w) throw new Error('Engedélyezd a felugró ablakot a nyomtatáshoz.');
  const esc = (s: string) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  const svg = await qrSvg(`${location.origin}/kikepzo/b/${p.token}`);
  w.document.write(`<!doctype html><html lang="hu"><head><meta charset="utf-8"><title>Bérlet QR</title>
    <link rel="stylesheet" href="/fonts/fonts.css">
    <style>body{font-family:Poppins,sans-serif;margin:20mm}.c{width:86mm;border:1px solid #ccc;border-radius:5mm;overflow:hidden}
    .t{background:#d7191f;color:#fff;padding:4mm 5mm;display:flex;gap:3mm;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .t img{height:12mm;width:12mm;object-fit:cover;object-position:left}.t b{font-size:5mm;display:block}.t span{font-size:3mm}
    .b{display:flex;gap:4mm;align-items:center;padding:4mm 5mm}.b svg{width:30mm;height:30mm}.b h2{margin:0;font-size:6mm}.b p{margin:1mm 0 0;font-size:3mm;color:#555}</style></head><body>
    <div class="c"><div class="t"><img src="${esc(logo)}" alt=""><div><b>Az Én Kutyaiskolám</b><span>Kutyabérlet · mutasd a kiképzőnek</span></div></div>
    <div class="b">${svg}<div><h2>${esc(p.dog)}</h2><p>${esc(m.name)}</p><p>${esc(p.type)}</p></div></div></div></body></html>`);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch { } }, 600);
}
