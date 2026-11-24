import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jsQR from 'jsqr';
import { useContent } from '../context';
import { ApiError } from '../api';
import { usePassAction, useTrainerLogin, useTrainerLogout, useTrainerMe, useTrainerPass } from '../lib/queries';
import { SiteLayout } from '../components/Layout';
import { Paw } from '../components/Icons';
import { huDate, firstName } from '../lib/format';

const TOKEN_RE = /\/kikepzo\/b\/([a-f0-9]{24})/;
type Mode = 'home' | 'scan' | 'pass';

export default function Kikepzo() {
  const c = useContent();
  const { token: routeToken } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(routeToken ? 'pass' : 'home');
  const [token, setToken] = useState<string | null>(routeToken || null);
  const [done, setDone] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const me = useTrainerMe();
  const refetchMe = me.refetch;
  const authed = !!me.data && !me.isError;
  const passQ = useTrainerPass(authed && mode === 'pass' ? token : null);
  const action = usePassAction(token);
  const logoutM = useTrainerLogout();

  const goHome = useCallback(() => {
    setMode('home'); setToken(null); setDone(false); setActionErr('');
    refetchMe();
    navigate('/kikepzo', { replace: true });
  }, [navigate, refetchMe]);
  const openPass = useCallback((tok: string) => {
    setToken(tok); setDone(false); setActionErr(''); setMode('pass');
    navigate('/kikepzo/b/' + tok, { replace: true });
  }, [navigate]);
  const scan = () => { setActionErr(''); setMode('scan'); };

  const use = async (force = false) => {
    setActionErr('');
    try { await action.mutateAsync({ action: 'use', force }); setDone(true); navigator.vibrate?.([60, 40, 120]); }
    catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.data.canForce && confirm(e.message + '\n\nMégis levonod az alkalmat?')) return use(true);
      if (e instanceof ApiError && e.status === 401) refetchMe(); else setActionErr((e as Error).message);
    }
  };
  const undo = async () => {
    if (!confirm('Visszavonod a mai levonást?')) return;
    setActionErr('');
    try { await action.mutateAsync({ action: 'undo' }); setDone(false); } catch (e) { setActionErr((e as Error).message); }
  };
  const logout = async () => { await logoutM.mutateAsync().catch(() => {}); refetchMe(); };

  const passUnauthorized = passQ.error instanceof ApiError && passQ.error.status === 401;
  useEffect(() => { if (passUnauthorized) refetchMe(); }, [passUnauthorized, refetchMe]);

  let view: 'loading' | 'login' | 'home' | 'scan' | 'pass' | 'error';
  if (me.isLoading) view = 'loading';
  else if (!authed) view = 'login';
  else if (mode === 'pass') view = passQ.data ? 'pass' : passQ.isError && !passUnauthorized ? 'error' : 'loading';
  else view = mode;
  const name = me.data?.name || '', today = me.data?.today || [];
  const pass = passQ.data;
  const msg = (passQ.error as Error | null)?.message || '';
  const busy = action.isPending;

  return (
    <SiteLayout title="Bérlet-szkennelés" noCta noCallbar>
      <section className="ci-sec">
        <div className="wrap">
          <div className="ci-card">
            <div className="ci-head">
              <img src={c.site.logo} alt="" />
              <div><small>{c.site.name} · kiképzőknek</small><h1>Bérlet-szkennelés</h1></div>
            </div>
            <div className="ci-body">
              {view === 'loading' && <div className="ci-state"><div className="ci-spin" /></div>}
              {view === 'login' && <Login />}
              {view === 'home' && (
                <div className="ci-state">
                  <h2>Szia, {firstName(name)}! Készen állsz?</h2>
                  <p className="mhelp">Olvasd le a tag telefonján (a „Már tag vagyok” oldalon) megjelenő bérlet QR-kódját.</p>
                  <button className="btn btn-red tr-big" type="button" onClick={scan}>Szkennelés indítása</button>
                  <div className="tr-today">
                    <h3>Ma levonva ({today.length})</h3>
                    {today.length ? today.map((t, i) => <div key={i}><span><b>{t.dog || '-'}</b> · {t.name}</span><span>{t.left === null ? 'korlátlan' : `${t.left} maradt`}{t.by ? ` · ${t.by}` : ''}</span></div>) : <p className="mhelp">Ma még nem volt levonás.</p>}
                  </div>
                  <button className="btn btn-member dark" type="button" style={{ marginTop: 8 }} onClick={logout}>Kijelentkezés</button>
                </div>
              )}
              {view === 'scan' && <Scanner onToken={openPass} onCancel={goHome} />}
              {view === 'error' && (
                <div className="ci-state">
                  <div className="ci-ico">!</div><h2>{msg}</h2>
                  <button className="btn btn-red tr-big" type="button" onClick={scan}>Új szkennelés</button>
                  <button className="btn btn-member dark" type="button" onClick={goHome}>Vissza</button>
                </div>
              )}
              {view === 'pass' && pass && (
                <div className="ci-state">
                  {done && <><div className="ci-stamp"><Paw /></div><h2>Levonva! Jó edzést!</h2></>}
                  <div className="tr-pass">
                    <div className="tr-dog"><span className="pw"><Paw /></span><div><h2>{pass.dog || 'Kutya'}</h2><small>{pass.name} · {pass.type}</small></div></div>
                    <div className="tr-left">{pass.left === null ? <><b>{pass.used}</b><span>alkalom eddig (korlátlan bérlet)</span></> : <><b>{pass.left}</b><span>alkalom maradt ({pass.used} / {pass.total} felhasználva)</span></>}</div>
                    <div className="tr-facts">
                      <span className="chip">{pass.start ? huDate(pass.start, true) : '...'} → {pass.end ? huDate(pass.end, true) : 'határozatlan'}</span>
                      <span className={`chip ${pass.paid ? 'paid' : 'unpaid'}`}>{pass.paid ? '✓ Kifizetve' : 'Fizetésre vár'}</span>
                      {pass.lastUsed && <span className="chip">Utoljára: {huDate(pass.lastUsed, true)}</span>}
                    </div>
                    {pass.note && <p className="mhelp"><b>Megjegyzés:</b> {pass.note}</p>}
                    {pass.problem && <div className="tr-warn bad">{pass.problem}</div>}
                    {!done && pass.usedToday > 0 && <div className="tr-warn">Ma már levontunk {pass.usedToday} alkalmat erről a bérletről.</div>}
                    {!pass.paid && <div className="tr-warn">A bérlet még nincs kifizetve.</div>}
                    {actionErr && <div className="tr-warn bad">{actionErr}</div>}
                  </div>
                  {done ? (
                    <>
                      <button className="btn btn-red tr-big" type="button" onClick={scan}>Következő szkennelés</button>
                      <div className="tr-row"><button className="btn btn-member dark" type="button" onClick={undo}>Visszavonás</button><button className="btn btn-dark" type="button" onClick={goHome}>Kész</button></div>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-red tr-big" type="button" disabled={busy} onClick={() => use(false)}>Alkalom levonása</button>
                      <div className="tr-row"><button className="btn btn-member dark" type="button" onClick={scan}>Másik</button><button className="btn btn-dark" type="button" onClick={goHome}>Mégse</button></div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Login() {
  const login = useTrainerLogin();
  const [user, setUser] = useState(''), [pw, setPw] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username: user, password: pw }, { onSuccess: () => setPw('') });
  };
  return (
    <form className="ci-state mform" style={{ border: 0, boxShadow: 'none', padding: 0 }} onSubmit={submit}>
      <h2>Kiképzői belépés</h2>
      <p className="mhelp">A felhasználónevet és a jelszót az admin adja meg. A telefon bejelentkezve marad, nem kell minden edzésen újra belépni.</p>
      <label>Felhasználónév<input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={user} onChange={e => setUser(e.target.value)} autoFocus /></label>
      <label>Jelszó<input type="password" autoComplete="current-password" required value={pw} onChange={e => setPw(e.target.value)} /></label>
      <div className="merr">{login.error?.message}</div>
      <button className="btn btn-red" type="submit" disabled={login.isPending}>Belépés</button>
    </form>
  );
}

function Scanner({ onToken, onCancel }: { onToken: (t: string) => void; onCancel: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [msg, setMsg] = useState('Tartsd a QR-kódot a keretbe.');
  useEffect(() => {
    let stream: MediaStream | null = null, raf = 0, stopped = false;
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const stop = () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); };
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setMsg('Ez a böngésző nem engedi a kamerát. Használd a telefon kamera alkalmazását a QR-kód beolvasásához.'); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); }
      catch { setMsg('Nem sikerült elindítani a kamerát. Engedélyezd a kamerát a böngészőben, vagy olvasd be a kódot a telefon kamera alkalmazásával.'); return; }
      if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
      const v = video.current!; v.srcObject = stream; await v.play().catch(() => {});
      const tick = () => {
        if (stopped) return;
        if (v.readyState >= 2) {
          const w = 480, h = Math.round(v.videoHeight / v.videoWidth * w) || 480;
          canvas.width = w; canvas.height = h; ctx.drawImage(v, 0, 0, w, h);
          const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
          const m = code && TOKEN_RE.exec(code.data);
          if (m) { navigator.vibrate?.(80); stop(); onToken(m[1]); return; }
          if (code) setMsg('Ez nem bérlet QR-kód. Próbáld újra!');
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    })();
    return stop;
  }, [onToken]);
  return (
    <div className="ci-state">
      <div className="tr-video"><video ref={video} playsInline muted /><span className="scanline" /></div>
      <p className="mhelp">{msg}</p>
      <button className="btn btn-dark" type="button" onClick={onCancel}>Mégse</button>
    </div>
  );
}
