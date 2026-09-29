import { getBadges, getStaffSession } from '@/lib/admin/server';
import { Sidebar } from '@/components/admin/Sidebar';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const [{ staff }, badges] = await Promise.all([getStaffSession(), getBadges()]);
  return (
    <div className="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-[216px_1fr]">
      <Sidebar staff={staff} badges={badges} />
      <main className="min-w-0 px-4 pb-16 pt-6 sm:px-8">
        <div className="max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
