import type { MemberView } from '@shared/types';

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
