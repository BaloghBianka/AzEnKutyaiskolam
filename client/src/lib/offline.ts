import type { Content, MemberView } from '@shared/types';

const KEY = 'kutyaiskola.berlet';

export interface CachedMember { at: number; data: MemberView }

export function saveMemberCache(data: MemberView): void {
  try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), data })); } catch { }
}
export function readMemberCache(): CachedMember | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null') as CachedMember | null;
    return v && v.data && Array.isArray(v.data.passes) ? v : null;
  } catch { return null; }
}
export function clearMemberCache(): void {
  try { localStorage.removeItem(KEY); } catch { }
}

const CONTENT_KEY = 'kutyaiskola.tartalom';

export function saveContentCache(data: Content): void {
  try { localStorage.setItem(CONTENT_KEY, JSON.stringify({ at: Date.now(), data })); } catch { }
}
export function readContentCache(): { at: number; data: Content } | null {
  try {
    const v = JSON.parse(localStorage.getItem(CONTENT_KEY) || 'null') as { at: number; data: Content } | null;
    return v && v.data && typeof v.data === 'object' && v.data.site ? v : null;
  } catch { return null; }
}
