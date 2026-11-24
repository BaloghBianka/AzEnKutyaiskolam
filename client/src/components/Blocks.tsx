import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../context';
import { Icon, Wave } from './Icons';
import { SectionHead } from './Layout';
import { tags, tel, safeUrl } from '../lib/format';

export function CourseExplorer() {
  const c = useContent();
  const items = c.courses.items;
  const [cur, setCur] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (!items.length) return null;
  const it = items[Math.min(cur, items.length - 1)];
  const t = tags(it.tags);
  const select = (n: number) => {
    setCur(n);
    const b = tabs.current[n], list = b?.parentElement;
    if (b && list && list.scrollWidth > list.clientWidth) list.scrollTo({ left: b.offsetLeft - list.offsetLeft - 18, behavior: 'smooth' });
  };
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (cur + d + items.length) % items.length;
    select(n); tabs.current[n]?.focus({ preventScroll: true });
  };
  return (
    <div className="cx" data-a="up">
      <div className="cx-list" role="tablist" aria-label="Képzések" aria-orientation="vertical" onKeyDown={onKey}>
        {items.map((x, i) => (
          <button key={i} ref={el => { tabs.current[i] = el; }} role="tab" id={`cx-tab-${i}`} aria-selected={i === cur} aria-controls="cx-panel" tabIndex={i === cur ? 0 : -1} className={`cx-tab${i === cur ? ' on' : ''}`} onClick={() => select(i)}>
            <span className="cx-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="cx-name">{x.title}<small>{x.age}</small></span>
            <span className="cx-arrow" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
      <article className="cx-panel" id="cx-panel" role="tabpanel" aria-labelledby={`cx-tab-${cur}`} key={cur}>
        <div className="cx-media">
          <img src={it.image} alt={it.title} />
          {it.age && <span className="cx-age">{it.age}</span>}
        </div>
        <div className="cx-body">
          <h3>{it.title}</h3>
          <p className="cx-text">{it.text}</p>
          {it.for && <div className="cx-for"><span>Kinek ajánljuk?</span>{it.for}</div>}
          {t.length > 0 && <ul className="cx-facts">{t.map((x, j) => <li key={j}><Icon name="check" size={16} stroke="#d7191f" width={3} />{x}</li>)}</ul>}
          <div className="cx-actions">
            <a href={tel(c.site.phone1)} className="btn btn-red">Erre jelentkezem</a>
            <Link to="/kepzesek#orarend" className="cx-link">Órarend →</Link>
          </div>
        </div>
      </article>
    </div>
  );
}

export function ReviewsBlock() {
  const r = useContent().reviews;
  if (!r.items.length) return null;
  return (
    <section className="reviews-sec">
      <Wave pos="top" fill="#fff" />
      <div className="wrap">
        <SectionHead kicker="Vélemények" title={r.title} lead={r.intro} />
        <div className="reviews">
          {r.items.map((it, i) => (
            <figure className="rev" data-a="up" key={i}>
              {it.sample && <span className="sample" title="Mintaszöveg, élesítés előtt valódi véleményre cserélendő">MINTA</span>}
              <div className="qm">“</div><div className="stars">★★★★★</div>
              <blockquote>{it.text}</blockquote>
              <figcaption className="who"><span className="av">{(it.name || '?').trim().charAt(0).toUpperCase()}</span><div><b>{it.name}</b><small>{it.detail}</small></div></figcaption>
            </figure>
          ))}
        </div>
      </div>
      <Wave pos="bottom" fill="#fff" />
    </section>
  );
}

export function OnePercent() {
  const s = useContent().site;
  if (!s.onePercentTitle) return null;
  return (
    <section className="onep">
      <div className="wrap onep-grid">
        {s.onePercentImage && <div className="onep-img" data-a="left"><img src={s.onePercentImage} alt={s.onePercentTitle} loading="lazy" /></div>}
        <div data-a="right">
          <span className="kicker">Támogatás</span>
          <h2>{s.onePercentTitle}</h2>
          <p className="lead">{s.onePercentText}</p>
          <div className="onep-tax"><small>Adószámunk</small><b>{s.taxId}</b></div>
          <p className="mhelp">{s.association}</p>
        </div>
      </div>
    </section>
  );
}

function Ci({ name }: { name: string }) { return <span className="ci"><Icon name={name} stroke="#fff" /></span>; }

export function ContactBlock() {
  const s = useContent().site;
  const lat = Number(s.lat), lng = Number(s.lng);
  const bb = [(lng - 0.0095).toFixed(4), (lat - 0.005).toFixed(4), (lng + 0.0095).toFixed(4), (lat + 0.005).toFixed(4)].join('%2C');
  const fb = safeUrl(s.facebook);
  return (
    <section id="kapcsolat" className="contact">
      <Wave pos="top" fill="#fff" />
      <div className="wrap contact-grid">
        <div data-a="left">
          <span className="kicker">Hol vagyunk?</span>
          <h2>Gyere el egy szombat reggel!</h2>
          <p className="lead">{s.address}</p>
          <ul className="clist">
            <li><Ci name="phone" /><div><b>Telefon</b><a href={tel(s.phone1)}>{s.phone1}</a>{s.phone2 && <> · <a href={tel(s.phone2)}>{s.phone2}</a></>}</div></li>
            {s.email && <li><Ci name="mail" /><div><b>E-mail</b><a href={`mailto:${s.email}`}>{s.email}</a></div></li>}
            <li><Ci name="clock" /><div><b>Nyitvatartás</b>{s.hours}</div></li>
            {fb && <li><Ci name="fb" /><div><b>Facebook</b><a href={fb} target="_blank" rel="noopener">Képek, hírek, rendezvények</a></div></li>}
            {s.byCar && <li><Ci name="car" /><div><b>Autóval</b>{s.byCar}</div></li>}
            {s.byBus && <li><Ci name="bus" /><div><b>Busszal</b>{s.byBus}</div></li>}
          </ul>
          <a className="btn btn-red" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.lat)},${encodeURIComponent(s.lng)}`} target="_blank" rel="noopener">Útvonaltervezés</a>
        </div>
        <div className="map-box" data-a="right">
          <iframe title="A kutyaiskola helye" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${bb}&layer=mapnik&marker=${lat}%2C${lng}`} />
          <div className="map-pin"><b>{s.name}</b>É {s.lat}, K {s.lng}</div>
        </div>
      </div>
    </section>
  );
}

export function Checklist({ items }: { items: { text: string; no?: boolean }[] }) {
  return <ul className="checklist">{items.map((e, i) => <li key={i} className={e.no ? 'no' : undefined}>{e.text}</li>)}</ul>;
}
