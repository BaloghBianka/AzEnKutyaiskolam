import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContent } from '../context';
import { SiteLayout, PageHero, SectionHead } from '../components/Layout';
import { Wave } from '../components/Icons';
import { CourseExplorer, ReviewsBlock, ContactBlock, Checklist } from '../components/Blocks';
import { Formatted, huDate, safeUrl, extProps, tel } from '../lib/format';

export function Kepzesek() {
  const c = useContent(), k = c.courses, sc = c.schedule;
  return (
    <SiteLayout title="Képzések">
      <PageHero title="Képzéseink" text="Kölyökszocializációtól a BH-vizsgáig: minden életkorra, minden célra." image={k.pageImage} />
      <section><div className="wrap">
        <SectionHead kicker="Képzéseink" title="Találd meg a kutyádnak valót" lead={k.intro} />
        <CourseExplorer />
        {k.note && <p className="note" data-a="up">{k.note}</p>}
      </div></section>
      <section className="gray">
        <Wave pos="top" fill="#fff" />
        <div className="wrap">
          <SectionHead kicker="Képzési rend" title="Így halad nálunk egy kutya" />
          <div className="levels">{k.levels.map((l, i) => <div className="lv" data-a="up" key={i}><h3>{l.title}</h3><p>{l.text}</p></div>)}</div>
        </div>
      </section>
      <section id="orarend" className="gray" style={{ paddingTop: 20 }}>
        <div className="wrap sched-grid">
          <div data-a="left">
            <span className="kicker">Órarend</span>
            <h2>{sc.title}</h2>
            <p className="lead">{sc.text}</p>
            <a href={tel(c.site.phone1)} className="btn btn-red" style={{ marginTop: 28 }}>Melyik csoport a miénk?</a>
          </div>
          <div className="schedule" data-a="right">{sc.rows.map((r, i) => <div className="row" key={i}><time>{r.time}</time><div>{r.name}</div><small>{r.note}</small></div>)}</div>
        </div>
      </section>
      <section><div className="wrap two-col">
        <div data-a="up"><span className="kicker">Felszerelés</span><h2>Mit hozz magaddal?</h2><Checklist items={c.faq.equipment} /></div>
        <div data-a="up"><span className="kicker">Házirend</span><h2>A pályán így vigyázunk egymásra</h2><Checklist items={c.faq.rules.map(text => ({ text }))} /></div>
      </div></section>
    </SiteLayout>
  );
}

export function Oktatok() {
  const t = useContent().trainers;
  return (
    <SiteLayout title="Oktatók">
      <PageHero title="Oktatóink" text={t.intro} image={t.pageImage} />
      <section><div className="wrap">
        <SectionHead kicker="Csapatunk" title="Akik a pórázod másik végén állnak" />
        <div className="trainers">
          {t.items.map((it, i) => it.memorial ? (
            <div className="trainer memorial" data-a="zoom" key={i}>
              <div className="pic"><img src={it.image} alt={it.name} /></div>
              <div><h3>{it.name}</h3><div className="role">{it.role}</div><p>{it.text}</p></div>
            </div>
          ) : (
            <div className="trainer" data-a="up" key={i}><div className="pic"><img src={it.image} alt={it.name} /></div><h3>{it.name}</h3><div className="role">{it.role}</div><p>{it.text}</p></div>
          ))}
        </div>
      </div></section>
      <ReviewsBlock />
    </SiteLayout>
  );
}

export function Hirek() {
  const c = useContent();
  const items = [...c.news.items].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return (
    <SiteLayout title="Hírek">
      <PageHero title="Hírek" text="Vizsgák, időpontok és minden, ami a kutyaiskolában történik." image={items[0]?.image || c.home.heroImages[0]} />
      <section><div className="wrap">
        {items.length ? (
          <div className="news-grid">
            {items.map(n => (
              <Link className="ncard" to={`/hirek/${encodeURIComponent(n.id)}`} data-a="up" key={n.id}>
                <div className="ph">{n.image ? <img src={n.image} alt="" loading="lazy" /> : <img src={c.site.logo} alt="" style={{ objectFit: 'contain', padding: 30 }} />}{n.label && <span className="lbl">{n.label}</span>}</div>
                <div className="body"><time dateTime={n.date}>{huDate(n.date)}</time><h3>{n.title}</h3><p>{n.excerpt}</p><span className="more">Tovább <span>→</span></span></div>
              </Link>
            ))}
          </div>
        ) : <p className="empty">Jelenleg nincs hír.</p>}
      </div></section>
    </SiteLayout>
  );
}

export function Hir() {
  const c = useContent();
  const { id } = useParams();
  const n = c.news.items.find(x => x.id === id);
  if (!n) return <NotFound />;
  const facts = String(n.facts || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i), l.slice(i + 1).trim()] : ['', l]; });
  const aside = facts.length > 0 || !!n.warning;
  return (
    <SiteLayout title={n.title}>
      <PageHero title={n.title} image={n.image || c.home.heroImages[0]} crumb="Hírek" />
      <section><div className="wrap">
        <div className={aside ? 'article' : ''}>
          <div className="prose" data-a="up">
            <p style={{ color: 'var(--red)', fontWeight: 700, fontSize: '.85rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>{n.label ? `${n.label} · ` : ''}{huDate(n.date)}</p>
            <Formatted text={n.body} />
            <Link className="back" to="/hirek">← Vissza a hírekhez</Link>
          </div>
          {aside && (
            <aside className="aside" data-a="right">
              {facts.map(([k, v], i) => <div className="fact" key={i}><span>{k}</span><b>{v}</b></div>)}
              {n.warning && <div className="warn"><b>Figyelem:</b> {n.warning}</div>}
              <a href={tel(c.site.phone1)} className="btn btn-red">Jelentkezés: {c.site.phone1}</a>
            </aside>
          )}
        </div>
      </div></section>
    </SiteLayout>
  );
}

export function Rendezvenyek() {
  const e = useContent().events;
  const video = safeUrl(e.videoUrl);
  return (
    <SiteLayout title="Rendezvények">
      <PageHero title="Rendezvényeink" text={e.intro} image={e.pageImage} />
      <section><div className="wrap">
        <div className="ev-grid">
          {e.items.map((ev, i) => {
            const im = (ev.images || []).slice(0, 3), link = safeUrl(ev.link);
            return (
              <article className="ev" data-a="up" key={i}>
                {im.length ? <div className={`ev-thumbs n${im.length}`}>{im.map((u, j) => <img key={j} src={u} alt={ev.title} loading="lazy" />)}</div> : <div className="ev-empty">{ev.title}</div>}
                <div className="ev-body">
                  <span className="ev-date">{ev.when}</span><h3>{ev.title}</h3><p>{ev.text}</p>
                  {link && (link.startsWith('/') ? <Link className="ev-link" to={link}>{ev.linkText || 'Részletek'} →</Link> : <a className="ev-link" href={link} {...extProps(link)}>{ev.linkText || 'Részletek'} →</a>)}
                </div>
              </article>
            );
          })}
        </div>
        {video && <div className="video-band" data-a="up"><div><b>{e.videoTitle}</b><span>{e.videoText}</span></div><a href={video} {...extProps(video)} className="btn btn-red">▶ Lejátszás</a></div>}
        <p className="note" data-a="up"><Link to="/galeria" className="btn btn-dark">Nézd meg a galériát</Link></p>
      </div></section>
    </SiteLayout>
  );
}

export function Galeria() {
  const c = useContent(), g = c.gallery;
  const [cur, setCur] = useState<number | null>(null);
  useEffect(() => {
    if (cur === null) return;
    document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCur(null);
      if (e.key === 'ArrowLeft') setCur(i => (i! - 1 + g.items.length) % g.items.length);
      if (e.key === 'ArrowRight') setCur(i => (i! + 1) % g.items.length);
    };
    addEventListener('keydown', key);
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', key); };
  }, [cur, g.items.length]);
  const it = cur !== null ? g.items[cur] : null;
  return (
    <SiteLayout title="Galéria">
      <PageHero title="Galéria" text={g.intro} image={g.items[0]?.image || c.home.heroImages[0]} />
      <section><div className="wrap">
        {g.items.length ? (
          <div className="gal">
            {g.items.map((x, i) => <a key={i} href={x.image} data-cap={x.caption} data-a="zoom" onClick={e => { e.preventDefault(); setCur(i); }}><img src={x.image} alt={x.caption} loading="lazy" /></a>)}
          </div>
        ) : <p className="empty">Még nincs kép a galériában.</p>}
      </div></section>
      {it && (
        <div className="lightbox open" role="dialog" aria-label="Képnézegető" onClick={e => { if (e.target === e.currentTarget) setCur(null); }}>
          <button className="lb-close" aria-label="Bezárás" onClick={() => setCur(null)}>✕</button>
          <button className="lb-prev" aria-label="Előző" onClick={() => setCur(i => (i! - 1 + g.items.length) % g.items.length)}>‹</button>
          <button className="lb-next" aria-label="Következő" onClick={() => setCur(i => (i! + 1) % g.items.length)}>›</button>
          <figure><img src={it.image} alt={it.caption} /><p>{it.caption}</p></figure>
        </div>
      )}
    </SiteLayout>
  );
}

export function Gyik() {
  const c = useContent(), f = c.faq;
  return (
    <SiteLayout title="Gyakori kérdések">
      <PageHero title="Gyakori kérdések" text="Minden, amit az első alkalom előtt érdemes tudni." image={c.courses.items[1]?.image || c.home.heroImages[0]} />
      <section><div className="wrap two-col">
        <div data-a="up">
          <span className="kicker">GYIK</span>
          <h2>Amit érdemes tudni</h2>
          {f.items.map((it, i) => <details key={i} open={i === 0}><summary>{it.q}</summary><Formatted text={it.a} /></details>)}
        </div>
        <div data-a="up">
          <span className="kicker">Felszerelés</span>
          <h2>Mit hozz magaddal?</h2>
          <Checklist items={f.equipment} />
          <h2 style={{ marginTop: 44 }}>Házirend</h2>
          <Checklist items={f.rules.map(text => ({ text }))} />
        </div>
      </div></section>
    </SiteLayout>
  );
}

export function Kapcsolat() {
  const c = useContent();
  return (
    <SiteLayout title="Kapcsolat">
      <PageHero title="Kapcsolat" text="Kérdésed van, vagy jelentkeznél? Hívj minket bátran." image={c.home.journeyImage} />
      <ContactBlock />
    </SiteLayout>
  );
}

export function NotFound() {
  const c = useContent();
  return (
    <SiteLayout title="Nem található">
      <PageHero title="Ez az oldal nem található" text="Lehet, hogy elköltözött. Nézz körül a menüben!" image={c.home.heroImages[0]} crumb="Hiba" />
      <section><div className="wrap center"><Link to="/" className="btn btn-red">Vissza a főoldalra</Link></div></section>
    </SiteLayout>
  );
}
