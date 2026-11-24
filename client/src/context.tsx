import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Content, SessionInfo } from '@shared/types';
import { keys, useContentQuery, useSessionQuery } from './lib/queries';

const EMPTY: SessionInfo = { member: null, trainer: null, admin: false };

export function useApp(): { content: Content | null; session: SessionInfo; refreshSession: () => Promise<void> } {
  const qc = useQueryClient();
  const { data: content } = useContentQuery();
  const { data: session } = useSessionQuery();
  const refreshSession = useCallback(() => qc.invalidateQueries({ queryKey: keys.session }), [qc]);
  return { content: content ?? null, session: session ?? EMPTY, refreshSession };
}

export function useContent(): Content {
  const { data } = useContentQuery();
  if (!data) throw new Error('A tartalom még nem töltődött be');
  return data;
}
