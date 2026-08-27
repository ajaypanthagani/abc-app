import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Variant = 'primary' | 'lime' | 'ghost';

const styles: Record<Variant, string> = {
  // Ink block on light surfaces.
  primary:
    'bg-ink text-paper hover:bg-black border border-ink',
  // Lime is always paired with ink text (contrast rule).
  lime: 'bg-lime text-ink hover:bg-lime-hover border border-lime hover:border-lime-hover',
  ghost: 'bg-transparent text-fg border border-edge hover:border-fg',
};

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded px-5 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';

type ButtonProps = { variant?: Variant; children: ReactNode } & (
  | ({ href: string } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>)
  | ({ href?: undefined } & ComponentPropsWithoutRef<'button'>)
);

export function Button({ variant = 'primary', children, className = '', ...rest }: ButtonProps) {
  const cls = `${base} ${styles[variant]} ${className}`;
  if ('href' in rest && typeof rest.href === 'string') {
    const { href, ...anchor } = rest as { href: string } & ComponentPropsWithoutRef<'a'>;
    const external = href.startsWith('http');
    if (external) {
      return (
        <a href={href} className={cls} {...anchor}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...anchor}>
        {children}
      </Link>
    );
  }
  const button = rest as ComponentPropsWithoutRef<'button'>;
  return (
    <button type={button.type ?? 'button'} className={cls} {...button}>
      {children}
    </button>
  );
}
