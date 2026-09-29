'use client';

import { API_URL } from '../api/shared';
import type { ApiErrorBody } from '../api/types';

export class AdminClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

// Browser fetcher for /v1/admin/*: the staff cookie travels via credentials;
// a dead staff session hard-redirects to the ops sign-in.
export async function adminClientFetch<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_URL}/v1/admin${path}`, {
    method: init?.method ?? 'GET',
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(init?.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401 && !path.startsWith('/auth/login')) {
    // Full navigation on purpose: a dead staff session drops all client state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/admin/signin?reason=expired');
    throw new AdminClientError(401, 'UNAUTHENTICATED', 'Session expired');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new AdminClientError(
      res.status,
      body?.error.code ?? 'HTTP_ERROR',
      body?.error.message ?? `HTTP ${res.status}`,
      body?.error.details,
    );
  }
  return res.json() as Promise<T>;
}

// Validation failures come back as zod issues; surface the first readable one.
export function errorText(err: unknown): string {
  if (err instanceof AdminClientError) {
    if (err.code === 'VALIDATION' && Array.isArray(err.details) && err.details.length) {
      const first = err.details[0] as { message?: string; path?: (string | number)[] };
      return first.message ?? err.message;
    }
    if (err.status === 403) return 'Your role cannot do this.';
    return err.message;
  }
  return 'Something went wrong. Try again.';
}
