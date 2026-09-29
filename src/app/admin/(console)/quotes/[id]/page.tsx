import type { Metadata } from 'next';
import { adminFetch, getStaffSession } from '@/lib/admin/server';
import type { Quote } from '@/lib/admin/types';
import { QuoteEditor } from '@/components/admin/QuoteEditor';

export const metadata: Metadata = { title: 'Quote' };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, { staff }] = await Promise.all([adminFetch<Quote>(`/quotes/${id}`), getStaffSession()]);
  return <QuoteEditor quote={quote} canApprove={staff.role === 'SUPER_ADMIN'} />;
}
