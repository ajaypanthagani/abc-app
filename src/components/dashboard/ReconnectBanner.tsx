import { copy } from '@/lib/copy';
import { Banner } from '@/components/ui/Banner';
import { InstagramConnectButton } from '@/components/onboarding/InstagramConnectButton';

export function ReconnectBanner() {
  return (
    <div className="mb-6">
      <Banner
        action={
          <InstagramConnectButton variant="lime" className="min-h-9 px-4 text-[13px]">
            {copy.banner.reconnectCta}
          </InstagramConnectButton>
        }
      >
        {copy.banner.reconnect}
      </Banner>
    </div>
  );
}
