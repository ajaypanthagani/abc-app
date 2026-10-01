import type { Metadata } from 'next';
import { apiFetch, getCreator, getShell, getTaxonomies } from '@/lib/api/server';
import type { ConnectionHealth } from '@/lib/api/types';
import { copy } from '@/lib/copy';
import { formatDate, relativeTime } from '@/lib/format';
import { Card, PageHead, StatusTag } from '@/components/dashboard/ui';
import { AvailabilityPicker } from '@/components/dashboard/AvailabilityPicker';
import { ProfileForm } from '@/components/onboarding/ProfileForm';
import { ResyncButton } from '@/components/network/ResyncButton';
import { SignOutButton } from '@/components/network/SignOutButton';
import { InstagramConnectButton } from '@/components/onboarding/InstagramConnectButton';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const [shell, creator, taxonomies, connection] = await Promise.all([
    getShell(),
    getCreator(),
    getTaxonomies(),
    apiFetch<ConnectionHealth>('/v1/creators/me/instagram/connection'),
  ]);
  const t = copy.dashboard.profile;
  const healthy = connection.status === 'ACTIVE';

  return (
    <div>
      <PageHead eyebrow={t.eyebrow} title={`@${shell.handle ?? '—'}`} aside={<SignOutButton />} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div className="flex flex-col gap-6">
          <Card
            title={t.connectionTitle}
            aside={<StatusTag tone={healthy ? 'hot' : 'ink'}>{healthy ? 'Healthy' : connection.status.replace('_', ' ')}</StatusTag>}
          >
            <dl className="divide-y divide-pill">
              {[
                ['Account', connection.igUsername ? `@${connection.igUsername}` : '—'],
                ['Token valid until', formatDate(connection.tokenValidUntil)],
                ['Last sync', relativeTime(connection.lastSyncAt)],
                ['Weekly snapshots stored', String(connection.snapshotsStored ?? 0)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray">{k}</dt>
                  <dd className="text-right text-[14px]">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-line px-4 py-3">
              {healthy ? (
                <ResyncButton />
              ) : (
                <InstagramConnectButton variant="lime" className="min-h-10 px-4 text-[14px]">
                  {copy.banner.reconnectCta}
                </InstagramConnectButton>
              )}
            </div>
          </Card>

          <Card title={t.availabilityTitle}>
            <div className="px-4 py-4">
              <AvailabilityPicker current={shell.availability} />
            </div>
          </Card>
        </div>

        <Card title={t.preferencesTitle}>
          <div className="px-4 py-5">
            <ProfileForm taxonomies={taxonomies} current={creator} mode="edit" />
          </div>
        </Card>
      </div>
    </div>
  );
}
