export class ApiError extends Error {
  constructor(message: string, public status: number, public data: Record<string, unknown> = {}) { super(message); }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(path, {
      method: opts.method || 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: opts.body === undefined ? (opts.method && opts.method !== 'GET' ? '{}' : undefined) : JSON.stringify(opts.body)
    });
  } catch {
    throw new ApiError('Nincs internetkapcsolat. Próbáld újra, ha lesz térerő.', 0);
  }
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new ApiError(String(j.error || 'Hiba történt'), r.status, j);
  return j as T;
}

export const isOffline = (e: unknown) => e instanceof ApiError && e.status === 0;
