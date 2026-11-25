import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { isStandalone, useOnline } from './pwa';

type State = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on' | 'busy';

const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function keyBytes(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
const sameKey = (a: ArrayBuffer | null | undefined, b: Uint8Array) => !!a && a.byteLength === b.byteLength && new Uint8Array(a).every((v, i) => v === b[i]);

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!supported()) return null;
  return Promise.race([navigator.serviceWorker.ready, new Promise<null>(r => setTimeout(() => r(null), 6000))]);
}

export function NotifyCard({ who }: { who: 'tag' | 'kikepzo' }) {
  const online = useOnline();
  const [state, setState] = useState<State>('loading');
  const [msg, setMsg] = useState('');

  const refresh = useCallback(async () => {
    if (!supported()) { setState(isIos() && !isStandalone() ? 'ios-install' : 'unsupported'); return; }
    if (isIos() && !isStandalone()) { setState('ios-install'); return; }
    if (Notification.permission === 'denied') { setState('denied'); return; }
    const reg = await registration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub && Notification.permission === 'granted') {
      setState('on');
      api('/api/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON(), context: who } }).catch(() => {});
    } else setState('off');
  }, [who]);

  useEffect(() => { refresh(); }, [refresh]);

  const enable = async () => {
    setMsg(''); setState('busy');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); return; }
      const reg = await registration();
      if (!reg) throw new Error('Az app még nem állt készen. Próbáld újra pár másodperc múlva.');
      const { key } = await api<{ key: string }>('/api/push/key');
      const bytes = keyBytes(key);
      let sub = await reg.pushManager.getSubscription();
      if (sub && !sameKey(sub.options.applicationServerKey, bytes)) { await sub.unsubscribe(); sub = null; }
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
      await api('/api/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON(), context: who } });
      setState('on');
      setMsg('Kész! Ide fogsz értesítést kapni, például ha elmarad az óra.');
    } catch (e) {
      setState('off');
      setMsg((e as Error).message || 'Nem sikerült bekapcsolni.');
    }
  };

  const disable = async () => {
    setMsg(''); setState('busy');
    try {
      const reg = await registration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await api('/api/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {});
        await sub.unsubscribe();
      }
      setState('off');
    } catch { setState('on'); }
  };

  if (state === 'loading') return null;
  const appName = who === 'kikepzo' ? 'Szkenner' : 'Kutyaiskola';
  return (
    <aside className={`notify-card${state === 'on' ? ' on' : ''}`} aria-live="polite">
      <span className="notify-ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      </span>
      <div className="notify-body">
        <b>{state === 'on' ? 'Értesítések bekapcsolva' : 'Értesítések'}</b>
        {state === 'on' && <p>Szólunk, ha elmarad vagy változik az óra.</p>}
        {(state === 'off' || state === 'busy') && <p>Kérj értesítést, és azonnal szólunk, ha például rossz idő miatt elmarad az óra.</p>}
        {state === 'ios-install' && <p>iPhone-on csak a kezdőképernyőre tett appból lehet értesítést kapni. Tedd ki az oldalt a kezdőképernyőre (Megosztás → Főképernyőhöz adás), nyisd meg onnan, és itt kapcsold be.</p>}
        {state === 'denied' && <p>Az értesítések le vannak tiltva ezen a telefonon. Kapcsold vissza a telefon Beállítások → Értesítések menüjében a „{appName}” résznél, vagy a böngésző webhely-beállításaiban.</p>}
        {state === 'unsupported' && <p>Ez a böngésző nem tud értesítést fogadni. Próbáld Chrome-ban vagy a kezdőképernyőre tett appban.</p>}
        {msg && <p className="notify-msg">{msg}</p>}
        {(state === 'off' || state === 'busy') && (
          <button type="button" className="btn btn-red" onClick={enable} disabled={state === 'busy' || !online}>{!online ? 'Nincs internet' : state === 'busy' ? 'Bekapcsolás...' : 'Értesítések bekapcsolása'}</button>
        )}
        {state === 'on' && <button type="button" className="notify-off" onClick={disable} disabled={!online}>Kikapcsolás</button>}
      </div>
    </aside>
  );
}
