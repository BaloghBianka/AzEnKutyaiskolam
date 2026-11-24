import { create } from 'zustand';
import type { NewsItem, SectionKey } from '@shared/types';
import { ApiError } from '../api';
import { saveSection } from '../lib/queries';

export type Path = (string | number)[];
type Json = unknown;

export function getIn(obj: Json, path: Path): Json {
  let cur = obj as Record<string | number, Json> | undefined;
  for (const k of path) { if (cur == null) return undefined; cur = cur[k] as Record<string | number, Json>; }
  return cur;
}
function setIn(obj: Json, path: Path, value: Json): Json {
  if (!path.length) return value;
  const [k, ...rest] = path;
  const base = (obj ?? (typeof k === 'number' ? [] : {})) as Record<string | number, Json>;
  const copy = (Array.isArray(base) ? [...base] : { ...base }) as Record<string | number, Json>;
  copy[k] = setIn(base[k], rest, value);
  return copy;
}

interface Toast { msg: string; bad?: boolean; id: number }
type SaveFn = () => Promise<void>;

interface EditorState {
  section: string;
  draft: Record<string, Json> | null;
  dirty: boolean;
  saving: boolean;
  toast: Toast | null;
  customSave: SaveFn | null;
  confirm: { message: string; danger?: boolean; resolve: (ok: boolean) => void } | null;

  askConfirm: (message: string, danger?: boolean) => Promise<boolean>;
  closeConfirm: (ok: boolean) => void;
  openSection: (key: string, draft: Record<string, Json> | null) => void;
  setField: (path: Path, value: Json) => void;
  updateList: (path: Path, fn: (arr: Json[]) => Json[]) => void;
  setDirty: (d: boolean) => void;
  registerSave: (fn: SaveFn | null) => void;
  showToast: (msg: string, bad?: boolean) => void;
  save: () => Promise<void>;
}

const newsIds = (items: NewsItem[]) => {
  const used = new Set<string>();
  return items.map(n => {
    const base = n.id || (n.title || 'hir').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'hir';
    let id = base, i = 2;
    while (used.has(id)) id = `${base}-${i++}`;
    used.add(id);
    return { ...n, id };
  });
};

export const useEditor = create<EditorState>((set, get) => ({
  section: 'members',
  draft: null,
  dirty: false,
  saving: false,
  toast: null,
  customSave: null,
  confirm: null,

  askConfirm: (message, danger) => new Promise<boolean>(resolve => set({ confirm: { message, danger, resolve } })),
  closeConfirm: ok => { get().confirm?.resolve(ok); set({ confirm: null }); },
  openSection: (section, draft) => set({ section, draft, dirty: false, customSave: null }),
  setField: (path, value) => set(s => ({ draft: setIn(s.draft, path, value) as Record<string, Json>, dirty: true })),
  updateList: (path, fn) => set(s => {
    const cur = getIn(s.draft, path);
    return { draft: setIn(s.draft, path, fn(Array.isArray(cur) ? cur : [])) as Record<string, Json>, dirty: true };
  }),
  setDirty: dirty => set({ dirty }),
  registerSave: customSave => set({ customSave }),
  showToast: (msg, bad) => set({ toast: { msg, bad, id: Date.now() } }),

  save: async () => {
    const { customSave, draft, section, showToast } = get();
    if (customSave) { set({ saving: true }); try { await customSave(); } finally { set({ saving: false }); } return; }
    if (!draft) return;
    set({ saving: true });
    try {
      const data = section === 'news' ? { ...draft, items: newsIds((draft.items || []) as NewsItem[]) } : draft;
      await saveSection(section as SectionKey, data);
      set({ draft: data, dirty: false });
      showToast('Elmentve, a weboldalon már látszik.');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) showToast('Lejárt a bejelentkezés, lépj be újra.', true);
      else showToast((e as Error).message, true);
      throw e;
    } finally { set({ saving: false }); }
  }
}));
