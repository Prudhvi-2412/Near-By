'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@near-by/ui';
import { useAuth } from '../../hooks/use-auth';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '/explore', label: 'Explore' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/safety', label: 'Safety & privacy' },
  { href: '/about', label: 'About' },
];

export function PublicNav() {
  const pathname = usePathname();
  const { isAuthenticated, roles } = useAuth();
  const [open, setOpen] = useState(false);

  const dashboardHref = roles.includes('ADMIN')
    ? '/admin/dashboard'
    : roles.includes('PROVIDER')
      ? '/provider/dashboard'
      : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-charcoal-950/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-wide text-cream-50">
          Near <span className="text-gradient-gold">By</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href ? 'text-gold-300' : 'text-cream-300/70 hover:text-cream-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button asChild variant="outline" size="sm">
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/register">Become a Provider</Link>
              </Button>
            </>
          )}
        </div>

        <button className="text-cream-100 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] px-6 pb-6 md:hidden">
          <nav className="flex flex-col gap-4 pt-4">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-cream-200" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              {isAuthenticated ? (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={dashboardHref}>Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild variant="primary" size="sm" className="w-full">
                    <Link href="/register">Join</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
