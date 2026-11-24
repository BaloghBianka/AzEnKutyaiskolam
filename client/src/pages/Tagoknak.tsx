import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MemberPass } from '@shared/types';
import { useApp, useContent } from '../context';
import { ApiError } from '../api';
import { useMemberLogin, useMemberLogout, useMemberMe, useMemberPassword } from '../lib/queries';
import { SiteLayout, PageHero } from '../components/Layout';
import { Icon, Paw } from '../components/Icons';
import { huDate, dotDate, tel, firstName } from '../lib/format';
import { useQrSvg, passUrl } from '../lib/qr';

const todayStr = () => new Date().toISOString().slice(0, 10);

function status(p: MemberPass): [string, string] {
  const today = todayStr(), left = p.total ? p.total - p.used.length : null;
  if (p.end && p.end < today) return ['Lejárt', 'off'];
  if (p.start && p.start > today) return ['Hamarosan indul', 'warn'];
  if (left !== null && left <= 0) return ['Elfogyott', 'off'];
  if (left !== null && left <= 2) return ['Utolsó alkalmak', 'warn'];
  if (p.end && (new Date(p.end).getTime() - new Date(today).getTime()) / 864e5 <= 14) return ['Hamarosan lejár', 'warn'];
  return ['Aktív', ''];
}

function QrMini({ token }: { token: string }) {
  const svg = useQrSvg(passUrl(token));
  return <span className="qr-mini" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function PassCard({ p, logo, onQr }: { p: MemberPass; logo: string; onQr: (p: MemberPass) => void }) {
  const [st, cls] = status(p);
  const used = p.used.length, left = p.total ? Math.max(0, p.total - used) : null;
  const hist = [...p.used].sort();
  const n = p.total ? Math.min(p.total, 40) : 0;
  return (
    <article className={`pass ${cls || 'ok'}`}>
      <div className="pass-top">
        <img className="pass-logo" src={logo} alt="" />
        <span className={`badge ${cls}`}>{st}</span>
        <small>{p.type || 'Bérlet'}</small>
        <h3><span className="dogpaw"><Paw /></span>{p.dog || 'Kutyabérlet'}</h3>
        <div className="pass-sub">Az Én Kutyaiskolám · kutyabérlet</div>
      </div>
      <div className="perf" aria-hidden="true" />
      {p.token && cls !== 'off' && (
        <button type="button" className="pass-qr" onClick={() => onQr(p)} aria-label="QR-kód nagyítása">
          <QrMini token={p.token} />
          <span><b>Mutasd a kiképzőnek</b><small>Ő leolvassa, és levonja az alkalmat. Koppints a nagyításhoz.</small></span>
        </button>
      )}
      <div className="pass-body">
        <div className="paws-head">
          {left === null
            ? <><b>{used}</b><span>alkalmon vettetek részt<br /><small>korlátlan bérlet</small></span></>
            : <><b>{left}</b><span>alkalom maradt<br /><small>{used} / {p.total} felhasználva</small></span></>}
        </div>
        {n > 0 && (
          <div className="paws">
            {Array.from({ length: n }, (_, i) => {
              const d = hist[i];
              return (
                <span key={i} className={`paw${d ? ' on' : ''}`} style={{ ['--i' as string]: i }} title={d ? 'Részvétel: ' + huDate(d) : 'Még felhasználható alkalom'}>
                  <Paw />{d && <em>{dotDate(d).slice(5, 11)}</em>}
                </span>
              );
            })}
          </div>
        )}
        <div className="pass-meta">
          <span className="chip"><Icon name="cal" size={14} width={2.4} />{p.start || p.end ? <>{dotDate(p.start) || '...'} <i>→</i> {dotDate(p.end) || 'határozatlan'}</> : 'Határozatlan ideig'}</span>
          <span className={`chip ${p.paid ? 'paid' : 'unpaid'}`}>{p.paid ? '✓ Kifizetve' : 'Fizetésre vár'}</span>
        </div>
        {hist.length
          ? <details className="hist"><summary>Részvételi napló · utoljára {huDate(hist[hist.length - 1])}</summary><ul>{[...hist].reverse().map((d, i) => <li key={i}>{huDate(d)}</li>)}</ul></details>
          : <p className="mhelp" style={{ marginTop: 14 }}>Még nem volt alkalom ezzel a bérlettel. Várunk a pályán!</p>}
      </div>
    </article>
  );
}

function QrFull({ p, onClose }: { p: MemberPass; onClose: () => void }) {
  const svg = useQrSvg(passUrl(p.token));
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', k);
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', k); };
  }, [onClose]);
  return (
    <div className="qr-full" role="dialog" aria-label="Bérlet QR-kód" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qr-full-in">
        <small>Mutasd meg a kiképzőnek</small>
        <h3>{p.dog || 'Bérlet'}</h3>
        <div id="qrBig" dangerouslySetInnerHTML={{ __html: svg }} />
        <p>{p.type}</p>
        <button className="btn btn-dark" type="button" onClick={onClose}>Bezárás</button>
      </div>
    </div>
  );
}

function LoginForm() {
  const c = useContent();
  const login = useMemberLogin();
  const [email, setEmail] = useState(''), [pw, setPw] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password: pw }, { onSuccess: () => setPw('') });
  };
  return (
    <div className="mlogin" data-a="up">
      <div className="mlogin-side">
        <span className="kicker">Tagi belépés</span>
        <h2>Már nálunk tanulsz?</h2>
        <p>Itt látod a bérleteidet: hány alkalom maradt, meddig érvényes, és mikor voltatok legutóbb.</p>
        <ul className="ticks">
          {['Hátralévő alkalmak egy pillantással', 'Bérlet érvényessége és lejárata', 'Részvételi napló'].map(t => <li key={t}><Icon name="check" size={22} stroke="#d7191f" width={3} />{t}</li>)}
        </ul>
      </div>
      <form className="mform" onSubmit={submit} autoComplete="on">
        <h3>Bejelentkezés</h3>
        <label>E-mail cím<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Jelszó<input type="password" autoComplete="current-password" required value={pw} onChange={e => setPw(e.target.value)} /></label>
        <div className="merr">{login.error?.message}</div>
        <button className="btn btn-red" type="submit" disabled={login.isPending}>Belépés</button>
        <p className="mhelp">Még nincs belépésed, vagy elfelejtetted a jelszavad? Szólj az oktatóknak a pályán, vagy hívj: <a href={tel(c.site.phone1)}>{c.site.phone1}</a></p>
      </form>
    </div>
  );
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const change = useMemberPassword();
  const [old, setOld] = useState(''), [nw, setNw] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    change.mutate({ old, new: nw }, { onSuccess: () => { setOld(''); setNw(''); setTimeout(onDone, 1800); } });
  };
  return (
    <form className="mform pwform" onSubmit={submit}>
      <h3>Jelszó módosítása</h3>
      <label>Jelenlegi jelszó<input type="password" autoComplete="current-password" required value={old} onChange={e => setOld(e.target.value)} /></label>
      <label>Új jelszó (min. 8 karakter)<input type="password" autoComplete="new-password" minLength={8} required value={nw} onChange={e => setNw(e.target.value)} /></label>
      <div className="merr" style={change.isSuccess ? { color: '#2e7d32' } : undefined}>{change.isSuccess ? 'A jelszavad megváltozott.' : change.error?.message}</div>
      <button className="btn btn-red" type="submit" disabled={change.isPending}>Mentés</button>
    </form>
  );
}

function Dashboard() {
  const c = useContent();
  const { refreshSession } = useApp();
  const navigate = useNavigate();
  const me = useMemberMe(true);
  const logoutM = useMemberLogout();
  const [pwOpen, setPwOpen] = useState(false);
  const [qr, setQr] = useState<MemberPass | null>(null);
  const unauthorized = me.error instanceof ApiError && me.error.status === 401;
  useEffect(() => { if (unauthorized) refreshSession(); }, [unauthorized, refreshSession]);
  const logout = async () => { await logoutM.mutateAsync().catch(() => {}); navigate('/'); };
  if (!me.data) return <div className="empty">{me.isError && !unauthorized ? 'Nem sikerült betölteni. Próbáld újra később.' : 'Betöltés...'}</div>;
  const m = me.data;
  const passes = [...m.passes].sort((a, b) => Number(status(a)[1] === 'off') - Number(status(b)[1] === 'off') || String(b.start).localeCompare(String(a.start)));
  return (
    <div>
      <div className="mhead">
        <div><span className="kicker">Tagi oldal</span><h2>Szia, {firstName(m.name)}!</h2><p className="lead">{m.dogs ? (/[,&]| és /.test(m.dogs) ? 'Kutyáid: ' : 'Kutyád: ') + m.dogs : ''}</p></div>
        <div className="mhead-acts">
          <button className="btn btn-dark" type="button" onClick={() => setPwOpen(o => !o)}>Jelszó módosítása</button>
          <button className="btn btn-member dark" type="button" onClick={logout}>Kijelentkezés</button>
        </div>
      </div>
      {pwOpen && <PasswordForm onDone={() => setPwOpen(false)} />}
      <div className="ci-hint"><b>Edzésen:</b> mutasd a bérlet QR-kódját a kiképzőnek, ő levonja az alkalmat.</div>
      <div className="passes">
        {passes.length ? passes.map(p => <PassCard key={p.id} p={p} logo={c.site.logo} onQr={setQr} />) : <div className="no-pass">Még nincs bérleted rögzítve. Szólj az oktatóknak a pályán!</div>}
      </div>
      {qr && <QrFull p={qr} onClose={() => setQr(null)} />}
    </div>
  );
}

export default function Tagoknak() {
  const c = useContent();
  const { session } = useApp();
  const logged = !!session.member;
  return (
    <SiteLayout title={logged ? 'Profilom' : 'Tagoknak'} noCta noCallbar>
      <PageHero title={logged ? 'Profilom' : 'Tagoknak'} text="Bérletek, hátralévő alkalmak, érvényesség." image={c.home.heroImages[2] || c.home.heroImages[0]} compact />
      <section className="member-sec"><div className="wrap">{logged ? <Dashboard /> : <LoginForm />}</div></section>
    </SiteLayout>
  );
}
