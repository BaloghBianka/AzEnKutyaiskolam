import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp, useContent } from '../context';
import { useMemberLogout } from '../lib/queries';
import { Icon, Wave } from './Icons';
import { tel, safeUrl } from '../lib/format';
import { useTitle } from '../lib/effects';

const NAV: [string, string][] = [['/kepzesek', 'Képzések'], ['/oktatok', 'Oktatók'], ['/hirek', 'Hírek'], ['/rendezvenyek', 'Rendezvények'], ['/galeria', 'Galéria'], ['/gyik', 'GYIK'], ['/kapcsolat', 'Kapcsolat']];

export function SiteLayout({ title, children, noCta, noCallbar }: { title?: string; children: ReactNode; noCta?: boolean; noCallbar?: boolean }) {
  const c = useContent();
  const s = c.site;
  const { session } = useApp();
  const logoutM = useMemberLogout();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useTitle(title, s.name, s.tagline);
  const logged = !!session.member;

  const logout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logoutM.mutateAsync().catch(() => {});
    setOpen(false);
    navigate('/');
  };

  return (
    <>
      <div className="top">
        <div className="topbar"><div className="wrap">
          <div className="tb">
            <a href={tel(s.phone1)}><span><Icon name="phone" size={14} width={2.4} />{s.phone1}</span></a>
            <span className="hide-sm"><Icon name="pin" size={14} width={2.4} />{s.addressShort}</span>
            {s.email && <a className="hide-sm" href={`mailto:${s.email}`}><span><Icon name="mail" size={14} width={2.4} />{s.email}</span></a>}
          </div>
          <div className="tb"><span className="hide-sm"><Icon name="clock" size={14} width={2.4} />{s.hours}</span></div>
        </div></div>
        <header id="hdr">
          <div className={`wrap nav${open ? ' open' : ''}`} id="nav">
            <Link to="/" className="logo" onClick={() => setOpen(false)}>
              <span className="logo-img"><img src={s.logo} alt={`${s.name} logó`} /></span>
              <span className="logo-text">{s.name}<small>{s.tagline}</small></span>
            </Link>
            <ul>
              {NAV.map(([to, label]) => <li key={to}><NavLink to={to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink></li>)}
              {logged ? (
                <>
                  <li className="only-m"><NavLink to="/tagoknak" onClick={() => setOpen(false)}>Profilom</NavLink></li>
                  <li className="only-m"><a href="/" onClick={logout}>Kijelentkezés</a></li>
                </>
              ) : (
                <>
                  <li className="only-m"><NavLink to="/tagoknak" onClick={() => setOpen(false)}>Már tag vagyok</NavLink></li>
                  <li className="only-m"><Link to="/kapcsolat" onClick={() => setOpen(false)}>Jelentkezem</Link></li>
                </>
              )}
            </ul>
            <div className="nav-cta">
              <NavLink to="/tagoknak" className={({ isActive }) => `btn btn-member${isActive ? ' on' : ''}`}><Icon name="user" size={13} width={2.6} />{logged ? 'Profilom' : 'Már tag vagyok'}</NavLink>
              {logged ? <a href="/" className="btn btn-red" onClick={logout}>Kijelentkezés</a> : <Link to="/kapcsolat" className="btn btn-red">Jelentkezem</Link>}
            </div>
            <button className="menu-btn" aria-label="Menü" aria-expanded={open} onClick={() => setOpen(o => !o)}><Icon name="menu" size={28} width={2.2} /></button>
          </div>
        </header>
      </div>

      <main>{children}</main>

      {!noCta && <Cta />}
      <Footer />
      <a href="#" className="totop" id="totop" aria-label="Vissza a tetejére" onClick={e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }}><Icon name="up" size={20} stroke="#fff" width={2.6} /></a>
      {!noCallbar && (
        <div className="callbar">
          <a href={tel(s.phone1)} className="btn btn-red">Hívás</a>
          <Link to="/kepzesek" className="btn btn-white">Képzések</Link>
        </div>
      )}
    </>
  );
}

function Cta() {
  const s = useContent().site;
  return (
    <section className="cta">
      <span className="ring r1" /><span className="ring r2" />
      <div className="wrap" data-a="zoom">
        <h2>{s.ctaTitle}</h2>
        <p>{s.ctaText}</p>
        <div className="hero-actions">
          <a href={tel(s.phone1)} className="btn btn-white">{s.phone1}</a>
          {s.phone2 && <a href={tel(s.phone2)} className="btn btn-line">{s.phone2}</a>}
        </div>
      </div>
    </section>
  );
}

function Ci({ name }: { name: string }) { return <span className="ci"><Icon name={name} stroke="#fff" /></span>; }

function Footer() {
  const s = useContent().site;
  const fb = safeUrl(s.facebook), privacy = safeUrl(s.privacyUrl);
  return (
    <footer>
      <Wave pos="top" fill="#d7191f" />
      <div className="wrap fgrid">
        <div>
          <img className="flogo" src={s.logo} alt={`${s.name} és az egyesület logója`} />
          <p>{s.footerText}</p>
        </div>
        <div>
          <h4>Csatlakozz hozzánk</h4>
          <ul className="flist">
            <li><Ci name="sziv" /><div><b>Kölyköd van?</b><Link to="/kepzesek">Kutyaovi és képzések</Link></div></li>
            <li><Ci name="check" /><div><b>Vizsgára készülsz?</b><Link to="/hirek">Hírek és vizsgák</Link></div></li>
            <li><Ci name="cal" /><div><b>Közösség</b><Link to="/rendezvenyek">Rendezvényeink</Link></div></li>
          </ul>
        </div>
        <div>
          <h4>Kapcsolat</h4>
          <ul className="flist">
            <li><Ci name="phone" /><div><b>Telefon</b><a href={tel(s.phone1)}>{s.phone1}</a>{s.phone2 && <><br /><a href={tel(s.phone2)}>{s.phone2}</a></>}</div></li>
            {s.email && <li><Ci name="mail" /><div><b>E-mail</b><a href={`mailto:${s.email}`}>{s.email}</a></div></li>}
            <li><Ci name="pin" /><div><b>Cím</b>{s.address}</div></li>
            <li><Ci name="clock" /><div><b>Nyitvatartás</b>{s.hours}</div></li>
            {fb && <li><Ci name="fb" /><div><b>Facebook</b><a href={fb} target="_blank" rel="noopener">Kövess minket a Facebookon</a></div></li>}
          </ul>
        </div>
      </div>
      <div className="copy"><div className="wrap">
        <span>© {new Date().getFullYear()} {s.name} · {s.association}</span>
        <span>Adószám: {s.taxId}{privacy && <> · <a href={privacy} style={{ color: '#fff' }}>Adatkezelési tájékoztató</a></>}</span>
      </div></div>
    </footer>
  );
}

export function PageHero({ title, text, image, crumb, compact }: { title: string; text?: string; image: string; crumb?: string; compact?: boolean }) {
  return (
    <section className={`page-hero${compact ? ' compact' : ''}`}>
      <div className="pbg" data-parallax style={{ backgroundImage: `url('${image}')` }} />
      <div className="wrap">
        <div className="crumbs fade-in"><Link to="/">Főoldal</Link> / {crumb || title}</div>
        <h1><span className="line"><span key={title}>{title}</span></span></h1>
        {text && <p className="fade-in d1">{text}</p>}
      </div>
      <Wave pos="bottom" fill="#fff" double />
    </section>
  );
}

export function SectionHead({ kicker, title, lead, center = true }: { kicker?: string; title: ReactNode; lead?: string; center?: boolean }) {
  return (
    <div className={center ? 'center' : ''} data-a="up">
      {kicker && <span className="kicker">{kicker}</span>}
      <h2>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}
