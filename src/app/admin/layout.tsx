import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Ops console', template: '%s · ABC Ops' },
};

// Everything under /admin is the internal ops console: its own type pairing,
// its own (staff) session.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className={`admin-console ${grotesk.variable} ${jetbrains.variable}`}>{children}</div>;
}
