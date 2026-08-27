'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiClientError, clientFetch } from '@/lib/api/client';
import type { CreatorMe, ProfilePayload, Taxonomies } from '@/lib/api/types';
import { copy } from '@/lib/copy';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Field } from '@/components/ui/Field';

// Shared between the onboarding profile step (POST /v1/onboarding/profile,
// then server-routed onward) and later edits from the network page
// (PATCH /v1/creators/me/profile, then back).
export function ProfileForm({
  taxonomies,
  current,
  mode,
}: {
  taxonomies: Taxonomies;
  current: CreatorMe | null;
  mode: 'onboarding' | 'edit';
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>(current?.categories ?? []);
  const [citySlug, setCitySlug] = useState(current?.city?.slug ?? '');
  const [languages, setLanguages] = useState<string[]>(current?.languages ?? []);
  const [exclusions, setExclusions] = useState<string[]>(current?.exclusions ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (categories.length === 0) return setError('Pick at least one content category.');
    if (!citySlug) return setError('Pick your city.');
    if (languages.length === 0) return setError('Pick at least one language.');

    const payload: ProfilePayload = { categories, citySlug, languages, exclusions };
    setSubmitting(true);
    try {
      if (mode === 'onboarding') {
        await clientFetch('/v1/onboarding/profile', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        router.push('/');
        router.refresh();
      } else {
        await clientFetch('/v1/creators/me/profile', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        router.push('/network');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      <Field label={copy.profileStep.categories} hint={copy.profileStep.categoriesHint}>
        <ChipGroup options={taxonomies.categories} value={categories} onChange={setCategories} max={6} />
      </Field>

      <Field label={copy.profileStep.city} htmlFor="city">
        <select
          id="city"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          className="h-11 w-full rounded border border-field bg-card px-3 text-[15px] text-fg"
        >
          <option value="" disabled>
            Select your city
          </option>
          {taxonomies.cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.displayName}
              {c.state && c.state !== c.displayName ? `, ${c.state}` : ''}
            </option>
          ))}
        </select>
      </Field>

      <Field label={copy.profileStep.languages} hint={copy.profileStep.languagesHint}>
        <ChipGroup options={taxonomies.languages} value={languages} onChange={setLanguages} max={6} />
      </Field>

      <Field label={copy.profileStep.exclusions} hint={copy.profileStep.exclusionsHint}>
        <ChipGroup options={taxonomies.exclusionTopics} value={exclusions} onChange={setExclusions} />
      </Field>

      {error ? (
        <p role="alert" className="rounded border border-ink bg-pill px-3 py-2 text-[14px] text-fg">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Saving…' : mode === 'onboarding' ? copy.profileStep.submit : 'Save changes'}
      </Button>
    </form>
  );
}
