import type { Metadata } from 'next';
import { apiUrl } from '@/lib/api/shared';
import { copy } from '@/lib/copy';
import { site } from '@/config/site';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Sign in' };

function InstagramGlyph() {
  return (
    <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-[5px] border-[1.5px] border-lime">
      <span className="size-1.5 rounded-full border-[1.5px] border-lime" />
    </span>
  );
}

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const errorKey = params.error ?? params.reason;
  const error = errorKey ? copy.signinErrors[errorKey] : undefined;

  return (
    <div>
      {error ? (
        <div className="mb-8 rounded border border-ink bg-card p-4" role="alert">
          <p className="text-[15px] font-medium text-fg">{error.title}</p>
          <p className="mt-1 text-[14px] text-fg-muted">{error.body}</p>
          {error.steps ? (
            <ol className="mt-3 space-y-1.5">
              {error.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[14px] text-fg">
                  <span className="font-mono text-[11px] text-fg-muted">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          ) : null}
          {(errorKey === 'ig_already_linked' || errorKey === 'switch_requires_support') && (
            <p className="mt-3 text-[14px]">
              <a className="underline underline-offset-4" href={`mailto:${site.supportEmail}`}>
                {site.supportEmail}
              </a>
            </p>
          )}
        </div>
      ) : null}

      <h2 className="text-[27px] font-medium tracking-[-0.02em] text-fg">{copy.signin.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{copy.signin.sub}</p>

      <Button href={apiUrl('/v1/auth/instagram/start')} className="mt-7 h-14 w-full text-[16px]">
        <InstagramGlyph />
        {copy.signin.cta}
      </Button>

      <ul className="mt-8 space-y-3 border-t border-edge pt-6">
        {copy.signin.notes.map((note) => (
          <li key={note} className="flex gap-3 text-[14px] text-fg-muted">
            <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-ink" />
            {note}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-[12px] leading-relaxed text-fg-muted">
        By continuing you agree to the{" "}
        <a href={`${site.marketingUrl}/creator-terms`} className="underline underline-offset-2 hover:text-fg">
          Creator Terms
        </a>{" "}
        and{" "}
        <a href={`${site.marketingUrl}/terms`} className="underline underline-offset-2 hover:text-fg">
          Terms of Service
        </a>
        , and acknowledge the{" "}
        <a href={`${site.marketingUrl}/privacy`} className="underline underline-offset-2 hover:text-fg">
          Privacy Policy
        </a>
        . Campaign measurement rules and payout caps are stated on every campaign.
      </p>
    </div>
  );
}
