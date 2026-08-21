'use client';

import { Anchor, type AnchorProps } from '@mantine/core';
import Link from 'next/link';

/**
 * Mantine <Anchor> wired to next/link.
 *
 * Server Components cannot pass `component={Link}` to Mantine directly —
 * a component is a function, and functions are not serializable across the
 * server/client boundary. Keeping that prop inside this client component
 * lets Server Components link out while preserving client-side navigation.
 */
export function NavAnchor({
  href,
  children,
  ...props
}: AnchorProps & { href: string; children: React.ReactNode }) {
  return (
    <Anchor component={Link} href={href} {...props}>
      {children}
    </Anchor>
  );
}
