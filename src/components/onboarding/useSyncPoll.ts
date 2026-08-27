'use client';

import { useCallback, useEffect, useState } from 'react';
import { clientFetch } from '@/lib/api/client';
import type { SyncCurrent } from '@/lib/api/types';

const POLL_MS = 2000;
const BACKOFF_MAX_MS = 10_000;

// setTimeout-chained polling (no overlapping requests). The first fetch always
// runs — even in a hidden/background tab, so returning users see state — and
// only steady-state polling pauses while hidden. Exponential backoff on
// network errors; stops on terminal states.
export function useSyncPoll(initial?: SyncCurrent) {
  const [current, setCurrent] = useState<SyncCurrent | null>(initial ?? null);
  const [terminal, setTerminal] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let backoff = POLL_MS;
    let hasFetched = false;
    let inFlight = false;

    async function tick(): Promise<void> {
      if (cancelled || inFlight) return;
      if (hasFetched && document.visibilityState === 'hidden') {
        timer = setTimeout(() => void tick(), POLL_MS);
        return;
      }
      hasFetched = true;
      inFlight = true;
      try {
        const next = await clientFetch<SyncCurrent>('/v1/creators/me/sync/current');
        backoff = POLL_MS;
        if (cancelled) return;
        setCurrent(next);
        if (next.status === 'idle' || next.status === 'failed' || next.status === 'no_connection') {
          setTerminal(true);
          return;
        }
      } catch {
        backoff = Math.min(backoff * 2, BACKOFF_MAX_MS);
      } finally {
        inFlight = false;
      }
      if (!cancelled) timer = setTimeout(() => void tick(), backoff);
    }

    const onVisible = () => {
      if (document.visibilityState !== 'visible' || cancelled || inFlight) return;
      if (timer) clearTimeout(timer);
      void tick();
    };

    document.addEventListener('visibilitychange', onVisible);
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [generation]);

  const restart = useCallback(() => {
    setTerminal(false);
    setGeneration((g) => g + 1);
  }, []);

  return { current, terminal, restart };
}
