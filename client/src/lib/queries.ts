import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminMember, Content, LogEntry, MemberView, SectionKey, SessionInfo, TodayItem, TrainerAccount, TrainerPassView } from '@shared/types';
import { api, ApiError, isOffline } from '../api';
import { clearMemberCache, readContentCache, readMemberCache, saveContentCache } from './offline';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2
    }
  }
});

export const keys = {
  content: ['content'] as const,
  session: ['session'] as const,
  memberMe: ['member', 'me'] as const,
  trainerMe: ['trainer', 'me'] as const,
  trainerPass: (token: string) => ['trainer', 'pass', token] as const,
  adminMe: ['admin', 'me'] as const,
  adminContent: ['admin', 'content'] as const,
  adminMembers: ['admin', 'members'] as const,
  adminTrainers: ['admin', 'trainers'] as const,
  adminLog: ['admin', 'log'] as const
};

const EMPTY_SESSION: SessionInfo = { member: null, trainer: null, admin: false };
const post = <T,>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });

async function fetchContent(): Promise<Content> {
  try {
    const c = await api<Content>('/api/content');
    saveContentCache(c);
    return c;
  } catch (e) {
    const cached = isOffline(e) ? readContentCache() : null;
    if (cached) return cached.data;
    throw e;
  }
}
const contentSeed = readContentCache();
export const useContentQuery = () => useQuery({
  queryKey: keys.content,
  queryFn: fetchContent,
  staleTime: 5 * 60_000,
  initialData: contentSeed?.data,
  initialDataUpdatedAt: contentSeed ? 0 : undefined
});
async function fetchSession(): Promise<SessionInfo> {
  try { return await api<SessionInfo>('/api/session'); }
  catch (e) {
    const cached = isOffline(e) ? readMemberCache() : null;
    return cached ? { ...EMPTY_SESSION, member: { name: cached.data.name } } : EMPTY_SESSION;
  }
}
export const useSessionQuery = () => useQuery({
  queryKey: keys.session,
  queryFn: fetchSession,
  placeholderData: () => { const c = readMemberCache(); return c ? { ...EMPTY_SESSION, member: { name: c.data.name } } : EMPTY_SESSION; }
});

export function useMemberLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { email: string; password: string }) => post('/api/member/login', b),
    onSuccess: () => { clearMemberCache(); qc.invalidateQueries({ queryKey: keys.session }); qc.removeQueries({ queryKey: keys.memberMe }); }
  });
}
export function useMemberLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post('/api/member/logout'),
    onSettled: () => { clearMemberCache(); qc.removeQueries({ queryKey: keys.memberMe }); qc.invalidateQueries({ queryKey: keys.session }); }
  });
}
export const useMemberMe = (enabled: boolean) => useQuery({ queryKey: keys.memberMe, queryFn: () => api<MemberView>('/api/member/me'), enabled });
export const useMemberPassword = () => useMutation({ mutationFn: (b: { old: string; new: string }) => post('/api/member/password', b) });

type TrainerMe = { name: string; today: TodayItem[] };
export const useTrainerMe = () => useQuery({ queryKey: keys.trainerMe, queryFn: () => api<TrainerMe>('/api/trainer/me'), retry: false });
export const useTrainerPass = (token: string | null) => useQuery({ queryKey: keys.trainerPass(token || ''), queryFn: () => api<TrainerPassView>('/api/trainer/pass/' + token), enabled: !!token, staleTime: 0 });
export function useTrainerLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { username: string; password: string }) => post('/api/trainer/login', b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trainer'] })
  });
}
export function useTrainerLogout() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => post('/api/trainer/logout'), onSettled: () => qc.removeQueries({ queryKey: ['trainer'] }) });
}
export function usePassAction(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { action: 'use' | 'undo'; force?: boolean }) => post<TrainerPassView>(`/api/trainer/pass/${token}/${b.action}`, { force: !!b.force }),
    onSuccess: data => { qc.setQueryData(keys.trainerPass(token || ''), data); qc.invalidateQueries({ queryKey: keys.trainerMe }); }
  });
}

export const useAdminMe = () => useQuery({ queryKey: keys.adminMe, queryFn: () => api<{ authed: boolean; hasPassword: boolean }>('/api/me'), staleTime: 0 });
export const useAdminContent = (enabled: boolean) => useQuery({ queryKey: keys.adminContent, queryFn: () => api<Content>('/api/admin/content'), enabled, staleTime: Infinity });
export function useAdminLogin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (password: string) => post('/api/login', { password }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }) });
}
export function useAdminLogout() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => post('/api/logout'), onSettled: () => { qc.removeQueries({ queryKey: ['admin'] }); qc.setQueryData(keys.adminMe, { authed: false, hasPassword: true }); } });
}
export async function saveSection(section: SectionKey, data: unknown): Promise<void> {
  await api('/api/admin/content/' + section, { method: 'PUT', body: data });
  queryClient.setQueryData<Content>(keys.adminContent, old => (old ? { ...old, [section]: data } as Content : old));
  queryClient.invalidateQueries({ queryKey: keys.content });
}

export const useAdminMembers = () => useQuery({ queryKey: keys.adminMembers, queryFn: () => api<AdminMember[]>('/api/admin/members') });
function useAdminMutation<V, R = unknown>(fn: (v: V) => Promise<R>, invalidate: readonly (readonly string[])[]) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidate.forEach(k => qc.invalidateQueries({ queryKey: k })) });
}
export const useCreateMember = () => useAdminMutation((b: Record<string, unknown>) => post<AdminMember>('/api/admin/members', b), [keys.adminMembers, keys.adminLog]);
export const useUpdateMember = () => useAdminMutation((m: AdminMember) => api<AdminMember>('/api/admin/members/' + m.id, { method: 'PUT', body: m }), [keys.adminMembers, keys.adminTrainers, keys.adminLog]);
export const useDeleteMember = () => useAdminMutation((id: string) => api('/api/admin/members/' + id, { method: 'DELETE' }), [keys.adminMembers, keys.adminLog]);
export const useMemberResetPassword = () => useAdminMutation((b: { id: string; password: string }) => post(`/api/admin/members/${b.id}/password`, { password: b.password }), [keys.adminLog]);

export const useAdminTrainers = () => useQuery({ queryKey: keys.adminTrainers, queryFn: () => api<{ trainers: TrainerAccount[]; today: TodayItem[] }>('/api/admin/trainers') });
export const useAdminLog = () => useQuery({ queryKey: keys.adminLog, queryFn: () => api<LogEntry[]>('/api/admin/log?limit=300') });
export const useCreateTrainer = () => useAdminMutation((b: { name: string; username: string; password: string }) => post('/api/admin/trainers', b), [keys.adminTrainers, keys.adminLog]);
export const useUpdateTrainer = () => useAdminMutation((b: { id: string; name: string; active: boolean }) => api(`/api/admin/trainers/${b.id}`, { method: 'PUT', body: b }), [keys.adminTrainers, keys.adminLog]);
export const useDeleteTrainer = () => useAdminMutation((id: string) => api(`/api/admin/trainers/${id}`, { method: 'DELETE' }), [keys.adminTrainers, keys.adminLog]);
export const useTrainerResetPassword = () => useAdminMutation((b: { id: string; password: string }) => post(`/api/admin/trainers/${b.id}/password`, { password: b.password }), [keys.adminLog]);
