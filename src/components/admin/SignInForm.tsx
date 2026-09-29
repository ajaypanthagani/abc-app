'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminClientFetch, errorText } from '@/lib/admin/client';

const field =
  'h-12 w-full border border-[#333333] bg-ink-2 px-3.5 font-mono text-[14px] text-paper outline-none focus:border-lime';
const label = 'mb-[7px] block font-mono text-[9.5px] tracking-[0.14em] text-gray';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminClientFetch('/auth/login', { method: 'POST', body: { email, password } });
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="email" className={label}>EMAIL</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="password" className={label}>PASSWORD</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-[13px] text-danger-soft">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !email || !password}
        className="mt-[22px] h-[52px] w-full bg-lime text-[15px] font-semibold text-ink hover:bg-lime-hover disabled:opacity-50"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
