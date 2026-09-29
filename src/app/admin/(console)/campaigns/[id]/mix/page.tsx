import type { Metadata } from 'next';
import { adminFetch } from '@/lib/admin/server';
import type { MixBuilder as MixBuilderData } from '@/lib/admin/types';
import { MixBuilder } from '@/components/admin/MixBuilder';

export const metadata: Metadata = { title: 'Mix builder' };

export default async function MixBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mix?: string }>;
}) {
  const [{ id }, { mix }] = await Promise.all([params, searchParams]);
  const data = await adminFetch<MixBuilderData>(`/campaigns/${id}/mix-builder`);
  return <MixBuilder data={data} activeMixId={mix ?? null} />;
}
