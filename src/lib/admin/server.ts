import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { API_URL } from '../api/shared';
import type { Badges, StaffSession } from './types';

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// RSC fetcher for /v1/admin/*: forwards the staff cookie, never caches,
// funnels 401s to the ops sign-in and 404s to the not-found page.
export async function adminFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const res = await fetch(`${API_URL}/v1/admin${path}`, {
    headers: { cookie: cookieStore.toString(), accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/admin/signin?reason=expired');
  if (res.status === 404) notFound();
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
    throw new AdminApiError(res.status, body?.error?.code ?? 'HTTP_ERROR', body?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const getStaffSession = cache(() => adminFetch<StaffSession>('/auth/session'));
export const getBadges = cache(() => adminFetch<Badges>('/badges'));
