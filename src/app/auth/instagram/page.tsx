import type { Metadata } from 'next';
import { Wordmark } from '@/components/ui/Wordmark';
import { InstagramRedirect } from '@/components/onboarding/InstagramRedirect';

export const metadata: Metadata = { title: 'Opening Instagram' };

// Interstitial between the "Continue with Instagram" tap and the Instagram
// OAuth dialog — see InstagramRedirect for why the extra hop exists.
export default function InstagramStartPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-5">
      <Wordmark />
      <InstagramRedirect />
    </div>
  );
}
