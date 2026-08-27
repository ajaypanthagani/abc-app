import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-micro text-fg-muted">404</p>
        <h1 className="mt-2 text-[24px] font-medium tracking-tight text-fg">This page does not exist</h1>
        <Link href="/" className="mt-4 inline-block text-[15px] underline underline-offset-4">
          Back to ABC
        </Link>
      </div>
    </main>
  );
}
