import { Fragment, type ReactNode } from 'react';

export const tel = (s: string) => 'tel:' + String(s || '').replace(/[^\d+]/g, '');
export const safeUrl = (u?: string) => { const s = String(u || '').trim(); return /^(https?:\/\/|\/|mailto:)/i.test(s) ? s : ''; };
export const isExt = (u?: string) => /^https?:\/\//i.test(u || '');
export const extProps = (u?: string) => (isExt(u) ? { target: '_blank', rel: 'noopener' } : {});
export const tags = (s: string) => String(s || '').split('|').map(t => t.trim()).filter(Boolean);
export const firstName = (n: string) => (n || '').trim().split(/\s+/).slice(-1)[0] || n;

const HU_MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
const HU_SHORT = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
export function huDate(d: string, short = false): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
  return m ? `${m[1]}. ${(short ? HU_SHORT : HU_MONTHS)[+m[2] - 1]} ${+m[3]}.` : d || '-';
}
export const dotDate = (d: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? `${m[1]}.${m[2]}.${m[3]}.` : ''; };

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:)[^)\s]+)\)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<b key={`${keyBase}b${i++}`}>{m[1]}</b>);
    else out.push(<a key={`${keyBase}a${i++}`} href={m[3]} {...extProps(m[3])}>{m[2]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
export function Formatted({ text }: { text: string }) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim());
        if (!lines.length) return null;
        if (lines.every(l => /^\s*[-*]\s+/.test(l))) return <ul key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-*]\s+/, ''), `${bi}-${li}`)}</li>)}</ul>;
        if (lines.length === 1 && /^##\s+/.test(lines[0])) return <h2 key={bi}>{inline(lines[0].replace(/^##\s+/, ''), `${bi}`)}</h2>;
        return <p key={bi}>{lines.map((l, li) => <Fragment key={li}>{li > 0 && <br />}{inline(l, `${bi}-${li}`)}</Fragment>)}</p>;
      })}
    </>
  );
}
