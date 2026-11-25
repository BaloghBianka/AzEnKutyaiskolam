import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());
if (typeof window !== 'undefined') {
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as InstallPromptEvent; notify(); });
  addEventListener('appinstalled', () => { deferred = null; notify(); });
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

function subscribeOnline(l: () => void) {
  addEventListener('online', l); addEventListener('offline', l);
  return () => { removeEventListener('online', l); removeEventListener('offline', l); };
}
export const useOnline = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let quietSince = Date.now();
let touched = false;
if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) addEventListener(ev, () => { touched = true; }, { passive: true, capture: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { quietSince = Date.now(); touched = false; } });
}
const QUIET_WINDOW = 20_000;
const canAutoUpdate = () => !touched && Date.now() - quietSince < QUIET_WINDOW;

export function PwaBar() {
  const online = useOnline();
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      const check = () => { if (navigator.onLine) reg.update().catch(() => {}); };
      setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    }
  });
  useEffect(() => { if (needRefresh && canAutoUpdate()) updateServiceWorker(true); }, [needRefresh, updateServiceWorker]);
  return (
    <div className="pwa-bar" aria-live="polite">
      {!online && <div className="pwa-pill off" role="status">Offline: nincs internet</div>}
      {needRefresh && (
        <div className="pwa-pill upd">
          <span>Elkészült az oldal új változata.</span>
          <button type="button" onClick={() => updateServiceWorker(true)}>Frissítés</button>
          <button type="button" className="ghost" onClick={() => setNeedRefresh(false)} aria-label="Később">Később</button>
        </div>
      )}
    </div>
  );
}

export function InstallHint({ who }: { who: 'tag' | 'kikepzo' }) {
  const key = 'kutyaiskola.telepites.' + who;
  const prompt = useSyncExternalStore(subscribe, () => deferred, () => null);
  const [hidden, setHidden] = useState(true);
  const online = useOnline();
  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(key) === '1'; } catch { }
    setHidden(dismissed || isStandalone());
  }, [key]);
  if (hidden || !online) return null;
  const close = () => { try { localStorage.setItem(key, '1'); } catch { } setHidden(true); };
  const install = async () => { if (!prompt) return; await prompt.prompt(); const r = await prompt.userChoice; deferred = null; notify(); if (r.outcome === 'accepted') close(); };
  const title = who === 'tag' ? 'Tedd ki a bérletedet a kezdőképernyőre' : 'Tedd ki a szkennert a kezdőképernyőre';
  const why = who === 'tag' ? 'Egy koppintással megnyílik, és a QR-kód gyenge térerőnél is megjelenik.' : 'Egy koppintással indul, teljes képernyőn, mint egy app.';
  return (
    <aside className="pwa-hint" aria-label="Telepítés a kezdőképernyőre">
      <img src="/icons/icon-192.png" alt="" width={48} height={48} />
      <div className="pwa-hint-body">
        <b>{title}</b>
        <p>{why}</p>
        {prompt ? (
          <button type="button" className="btn btn-red" onClick={install}>Telepítés</button>
        ) : isIos() ? (
          <ol>
            <li>Nyisd meg az oldalt <b>Safariban</b>.</li>
            <li>Koppints alul a <b>Megosztás</b> ikonra (négyzet felfelé mutató nyíllal).</li>
            <li>Válaszd a <b>Főképernyőhöz adás</b> lehetőséget, majd a <b>Hozzáadás</b> gombot.</li>
          </ol>
        ) : (
          <p className="pwa-hint-alt">A böngésző menüjében (⋮) válaszd a <b>Telepítés</b> vagy a <b>Hozzáadás a kezdőképernyőhöz</b> lehetőséget.</p>
        )}
      </div>
      <button type="button" className="pwa-x" onClick={close} aria-label="Bezárás">✕</button>
    </aside>
  );
}
