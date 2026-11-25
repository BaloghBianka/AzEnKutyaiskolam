import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Content, SessionInfo } from '@shared/types';
import { keys, useContentQuery, useSessionQuery } from './lib/queries';

const EMPTY: SessionInfo = { member: null, trainer: null, admin: false };

export function useApp(): { content: Content | null; contentError: boolean; retryContent: () => void; session: SessionInfo; refreshSession: () => Promise<void> } {
  const qc = useQueryClient();
  const { data: content, isError: contentError, refetch } = useContentQuery();
  const { data: session } = useSessionQuery();
  const refreshSession = useCallback(() => qc.invalidateQueries({ queryKey: keys.session }), [qc]);
  const retryContent = useCallback(() => { refetch(); }, [refetch]);
  return { content: content ?? null, contentError, retryContent, session: session ?? EMPTY, refreshSession };
}

export function useContent(): Content {
  const { data } = useContentQuery();
  if (!data) throw new Error('A tartalom még nem töltődött be');
  return data;
}
