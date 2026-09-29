import type { Metadata } from 'next';
import { adminFetch } from '@/lib/admin/server';
import type { BrandRow, Taxonomies } from '@/lib/admin/types';
import { CampaignWizard } from '@/components/admin/CampaignWizard';

export const metadata: Metadata = { title: 'New campaign' };

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const [{ brand }, brands, taxonomies] = await Promise.all([
    searchParams,
    adminFetch<BrandRow[]>('/brands'),
    adminFetch<Taxonomies>('/taxonomies'),
  ]);
  return <CampaignWizard brands={brands} taxonomies={taxonomies} initialBrandId={brand ?? null} />;
}
