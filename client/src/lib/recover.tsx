import { Component, type ReactNode } from 'react';

const FLAG = 'kutyaiskola.ujratoltve';

export const isChunkError = (e: unknown) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch|ChunkLoadError|Unable to preload CSS/i.test(String((e as Error)?.message || e));

export async function recoverFromStale(): Promise<boolean> {
  let already = false;
  try { already = sessionStorage.getItem(FLAG) === '1'; sessionStorage.setItem(FLAG, '1'); } catch { }
  if (already) return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.update().catch(() => {});
      const waiting = reg.waiting || reg.installing;
      if (waiting) {
        await new Promise<void>(res => {
          const t = setTimeout(res, 4000);
          navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(t); res(); }, { once: true });
          waiting.postMessage({ type: 'SKIP_WAITING' });
        });
      }
    }
  } catch { }
  location.reload();
  return true;
}

export function clearRecoverFlag(): void {
  setTimeout(() => { try { sessionStorage.removeItem(FLAG); } catch { } }, 10_000);
}

export function lazyRetry<T>(load: () => Promise<T>): () => Promise<T> {
  return () => load().catch(async e => {
    if (isChunkError(e) && await recoverFromStale()) return new Promise<T>(() => {});
    throw e;
  });
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  componentDidCatch(error: unknown) { if (isChunkError(error)) recoverFromStale(); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app-loading app-offline">
        <img src="/icons/icon-192.png" alt="" width={72} height={72} />
        <h1>Valami elakadt</h1>
        <p>Valószínűleg az oldal egy régebbi változata maradt a telefonon. Egy újratöltés megoldja.</p>
        <button type="button" className="btn btn-red" onClick={() => { try { sessionStorage.removeItem(FLAG); } catch { } recoverFromStale(); }}>Újratöltés</button>
      </div>
    );
  }
}
