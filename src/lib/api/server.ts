import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_URL } from './shared';
import type {
  CreatorInsights,
  CreatorMe,
  OnboardingState,
  SessionResponse,
  SyncCurrent,
  Taxonomies,
} from './types';

export class ApiServerError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// RSC fetcher: forwards the session cookie, never caches (personalized data),
// funnels 401s to /signin.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      cookie: cookieStore.toString(),
      accept: 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/signin?reason=expired');
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new ApiServerError(res.status, body?.error?.code ?? 'HTTP_ERROR', body?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Deduped per request: layout + page share one API call.
export const getSession = cache(() => apiFetch<SessionResponse>('/v1/auth/session'));
export const getOnboarding = cache(() => apiFetch<OnboardingState>('/v1/onboarding'));
export const getCreator = cache(() => apiFetch<CreatorMe>('/v1/creators/me'));
export const getTaxonomies = cache(() => apiFetch<Taxonomies>('/v1/taxonomies'));
export const getSyncCurrent = cache(() => apiFetch<SyncCurrent>('/v1/creators/me/sync/current'));
export const getInsights = cache(() => apiFetch<CreatorInsights>('/v1/creators/me/insights'));
