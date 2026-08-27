import { BrandPanel } from '@/components/onboarding/BrandPanel';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <main className="flex justify-center px-5 py-10 lg:items-center lg:px-14">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
