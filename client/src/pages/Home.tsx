import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../context';
import { SiteLayout, SectionHead } from '../components/Layout';
import { Icon, Wave } from '../components/Icons';
import { ReviewsBlock, OnePercent } from '../components/Blocks';
import { tel } from '../lib/format';

export default function Home() {
  const c = useContent(), h = c.home;
  const marquee = h.marquee.map((t, i) => <Fragment key={i}><span>{t}</span><i /></Fragment>);
  return (
    <SiteLayout>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">{h.heroImages.slice(0, 4).map((u, i) => <img key={i} src={u} alt="" />)}</div>
        <div className="wrap hero-in">
          <span className="hero-badge fade-in">{h.badge}</span>
          <h1><span className="line"><span>{h.heroTitle1}</span></span><span className="line"><span>{h.heroTitle2}</span></span></h1>
          <p className="fade-in d1">{h.heroText}</p>
          <div className="hero-actions fade-in d2">
            <a href="#problemak" className="btn btn-red" onClick={e => { e.preventDefault(); document.getElementById('problemak')?.scrollIntoView({ behavior: 'smooth' }); }}>Mi a kutyám gondja?</a>
            <a href={tel(c.site.phone1)} className="btn btn-line">Hívj most</a>
          </div>
        </div>
        <span className="scroll-cue fade-in d3" aria-hidden="true" />
        <Wave pos="bottom" fill="#fff" double />
      </section>

      <div className="stats"><div className="wrap">
        {h.stats.map((st, i) => (
          <div className="stat" data-a="up" key={i}>
            {/^\d+$/.test(st.value) ? <b data-count={st.value} data-suffix={st.suffix}>0</b> : <b>{st.value}{st.suffix}</b>}
            <span>{st.label}</span>
          </div>
        ))}
      </div></div>

      <section className="split">
        <Wave pos="top" fill="#fff" />
        <div className="wrap split-grid" style={{ paddingTop: 30 }}>
          <div className="split-img" data-a="left">
            <img src={h.whyImage} alt="" />
            <div className="tag-box"><b>{h.whyBadge}</b>{h.whyBadgeText}</div>
          </div>
          <div data-a="right">
            <span className="kicker">Miért mi?</span>
            <h2>{h.whyTitle} <span className="red">{h.whyTitleRed}</span></h2>
            <p>{h.whyText}</p>
            <ul className="ticks">{h.whyPoints.map((t, i) => <li key={i}><Icon name="check" size={22} stroke="#d7191f" width={3} />{t}</li>)}</ul>
            <Link to="/kepzesek" className="btn btn-dark">Képzéseink</Link>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div>{marquee}{marquee}</div></div>

      <Problems />

      <section className="banner">
        <div className="pbg" data-parallax style={{ backgroundImage: `url('${h.journeyImage}')` }} />
        <Wave pos="top" fill="#fff" />
        <div className="wrap">
          <div data-a="zoom">
            <span className="kicker">Az út</span>
            <h2>{h.journeyTitle}</h2>
            <p className="lead" style={{ margin: '0 auto' }}>{h.journeyText}</p>
          </div>
          <div className="timeline" data-a="up">
            <span className="bar" />
            {h.journey.map((j, i) => (
              <div className="tl" key={i}><div className="dot">{i === h.journey.length - 1 ? '✓' : i + 1}</div><small>{j.label}</small><h3>{j.title}</h3><p>{j.text}</p></div>
            ))}
          </div>
        </div>
        <Wave pos="bottom" fill="#fff" />
      </section>

      <section>
        <div className="wrap">
          <SectionHead kicker="Fedezd fel" title="Ismerj meg minket közelebbről" />
          <div className="go-grid">
            <Link className="go" to="/kepzesek" data-a="up"><img src={c.courses.items[0]?.image} alt="" /><div><span>Képzések</span><h3>Melyik képzés kell a kutyádnak?</h3></div></Link>
            <Link className="go" to="/oktatok" data-a="up"><img src={c.trainers.pageImage} alt="" /><div><span>Oktatók</span><h3>Akik a pórázod másik végén állnak</h3></div></Link>
            <Link className="go" to="/rendezvenyek" data-a="up"><img src={c.events.pageImage} alt="" /><div><span>Rendezvények</span><h3>Közösség a pályán kívül is</h3></div></Link>
          </div>
        </div>
      </section>

      <OnePercent />
      <ReviewsBlock />
    </SiteLayout>
  );
}

const SCATTER: [number, number][] = [[0, -2], [34, 1.6], [8, -1], [40, 2], [14, -1.6], [30, 1]];

function Problems() {
  const c = useContent(), h = c.home;
  const [state, setState] = useState<Record<number, 'typing' | 'done'>>({});
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!h.problems.length) return null;
  const answer = (i: number) => {
    if (state[i]) return;
    const fast = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setState(s => ({ ...s, [i]: 'typing' }));
    timers.current.push(window.setTimeout(() => setState(s => ({ ...s, [i]: 'done' })), fast ? 0 : 1100));
  };
  return (
    <section id="problemak" className="ps">
      <div className="wrap ps-grid">
        <div className="ps-intro" data-a="left">
          <span className="kicker">Ismerős?</span>
          <h2>{h.problemsTitle}</h2>
          <p className="lead">{h.problemsText}</p>
          <p className="ps-hint"><span aria-hidden="true" />Koppints egy üzenetre, és válaszolunk.</p>
          <a href={tel(c.site.phone1)} className="btn btn-red">Írd meg a sajátodat</a>
        </div>
        <ul className="sms" data-a="right">
          {h.problems.map((pr, i) => {
            const st = state[i], [x, r] = SCATTER[i % SCATTER.length];
            return (
              <li key={i} className="sms-item" style={{ ['--x' as string]: x, ['--r' as string]: `${r}deg` }}>
                <button type="button" className={`sms-in${st ? ' read' : ''}`} onClick={() => answer(i)} aria-expanded={st === 'done'} aria-controls={`sms-r-${i}`}>
                  <small>Gazdi</small>
                  <q>{pr.quote}</q>
                  {!st && <span className="sms-new" aria-label="Olvasatlan" />}
                </button>
                <div id={`sms-r-${i}`} aria-live="polite">
                  {st === 'typing' && <div className="sms-out sms-typing" aria-label="Válasz írása"><i /><i /><i /></div>}
                  {st === 'done' && (
                    <div className="sms-out">
                      <small>{c.site.name}</small>
                      <p>{pr.why} {pr.fix}</p>
                      {pr.course && <Link to="/kepzesek" className="sms-course"><span>Ajánlott képzés</span>{pr.course}<i aria-hidden="true">→</i></Link>}
                      <em className="sms-tick">Kézbesítve</em>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
