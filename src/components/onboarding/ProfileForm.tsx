'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiClientError, clientFetch } from '@/lib/api/client';
import type { CreatorMe, ProfilePayload, Taxonomies } from '@/lib/api/types';
import { copy } from '@/lib/copy';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Field } from '@/components/ui/Field';

const OTHER = 'other';

const textInputCls =
  'h-11 w-full rounded border border-field bg-card px-3 text-[15px] text-fg placeholder:text-fg-muted';

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
  const [categoriesOtherText, setCategoriesOtherText] = useState(current?.categoriesOtherText ?? '');
  const [citySlug, setCitySlug] = useState(current?.city?.slug ?? '');
  const [cityOtherText, setCityOtherText] = useState(current?.cityOtherText ?? '');
  const [languages, setLanguages] = useState<string[]>(current?.languages ?? []);
  const [languagesOtherText, setLanguagesOtherText] = useState(current?.languagesOtherText ?? '');
  const [exclusions, setExclusions] = useState<string[]>(current?.exclusions ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (categories.length === 0) return setError('Pick at least one content category.');
    if (!citySlug) return setError('Pick your city.');
    if (citySlug === OTHER && !cityOtherText.trim()) return setError('Type your city or town.');
    if (languages.length === 0) return setError('Pick at least one language.');

    const payload: ProfilePayload = {
      categories,
      citySlug,
      languages,
      exclusions,
      ...(categories.includes(OTHER) && categoriesOtherText.trim()
        ? { categoriesOtherText: categoriesOtherText.trim() }
        : {}),
      ...(citySlug === OTHER ? { cityOtherText: cityOtherText.trim() } : {}),
      ...(languages.includes(OTHER) && languagesOtherText.trim()
        ? { languagesOtherText: languagesOtherText.trim() }
        : {}),
    };
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
        {categories.includes(OTHER) ? (
          <input
            type="text"
            value={categoriesOtherText}
            onChange={(e) => setCategoriesOtherText(e.target.value)}
            maxLength={120}
            placeholder={copy.profileStep.categoriesOtherPlaceholder}
            aria-label={copy.profileStep.categoriesOtherPlaceholder}
            className={`mt-2 ${textInputCls}`}
          />
        ) : null}
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
        {citySlug === OTHER ? (
          <input
            type="text"
            value={cityOtherText}
            onChange={(e) => setCityOtherText(e.target.value)}
            maxLength={120}
            placeholder={copy.profileStep.cityOtherPlaceholder}
            aria-label={copy.profileStep.cityOtherPlaceholder}
            className={`mt-2 ${textInputCls}`}
          />
        ) : null}
      </Field>

      <Field label={copy.profileStep.languages} hint={copy.profileStep.languagesHint}>
        <ChipGroup options={taxonomies.languages} value={languages} onChange={setLanguages} max={6} />
        {languages.includes(OTHER) ? (
          <input
            type="text"
            value={languagesOtherText}
            onChange={(e) => setLanguagesOtherText(e.target.value)}
            maxLength={120}
            placeholder={copy.profileStep.languagesOtherPlaceholder}
            aria-label={copy.profileStep.languagesOtherPlaceholder}
            className={`mt-2 ${textInputCls}`}
          />
        ) : null}
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
