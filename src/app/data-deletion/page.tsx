import type { Metadata } from 'next';
import { API_URL } from '@/lib/api/shared';

export const metadata: Metadata = { title: 'Data deletion' };


// Public page Meta links users to after a data-deletion request (the URL our
// webhook returns). Shows the live status of that request.
export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  let status: string | null = null;
  let completedAt: string | null = null;
  if (code) {
    const res = await fetch(`${API_URL}/v1/webhooks/meta/data-deletion/${encodeURIComponent(code)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const body = (await res.json()) as { status: string; completedAt: string | null };
      status = body.status;
      completedAt = body.completedAt;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded border border-edge bg-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-micro text-fg-muted">Ads By Creators</p>
        <h1 className="mt-2 text-[24px] font-medium tracking-tight text-fg">Instagram data deletion</h1>
        {!code || !status ? (
          <p className="mt-3 text-[15px] text-fg-muted">
            No deletion request found for this link. If you asked for your data to be deleted, use the exact link
            provided during that request.
          </p>
        ) : status === 'COMPLETED' ? (
          <p className="mt-3 text-[15px] text-fg-muted">
            Done. The Instagram data linked to this request was deleted{completedAt ? ` on ${new Date(completedAt).toLocaleDateString('en-IN')}` : ''}.
            Records required for financial compliance are retained in anonymised form.
          </p>
        ) : (
          <p className="mt-3 text-[15px] text-fg-muted">
            Your deletion request is being processed. Check back on this same link shortly.
          </p>
        )}
      </div>
    </main>
  );
}
