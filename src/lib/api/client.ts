'use client';

import { API_URL } from './shared';
import type { ApiErrorBody } from './types';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

// Browser fetcher: cookie travels via credentials; 401 hard-redirects to signin.
export async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { accept: 'application/json', ...init?.headers },
  });
  if (res.status === 401) {
    // Full navigation on purpose: outside component context, and a dead
    // session should drop all client state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/signin?reason=expired');
    throw new ApiClientError(401, 'UNAUTHENTICATED', 'Session expired');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiClientError(
      res.status,
      body?.error.code ?? 'HTTP_ERROR',
      body?.error.message ?? `HTTP ${res.status}`,
      body?.error.details,
    );
  }
  return res.json() as Promise<T>;
}

export function postJson<T>(path: string, payload: unknown): Promise<T> {
  return clientFetch<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
