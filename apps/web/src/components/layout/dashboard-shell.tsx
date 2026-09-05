'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@near-by/ui';
import { useAuth } from '../../hooks/use-auth';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  role,
  navItems,
  children,
}: {
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const { user, roles, isAuthenticated, isBootstrapping, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isBootstrapping) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (!roles.includes(role)) {
      router.replace('/');
    }
  }, [isBootstrapping, isAuthenticated, roles, role, pathname, router]);

  if (isBootstrapping || !isAuthenticated || !roles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-950">
        <p className="text-sm text-cream-400/50">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-charcoal-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.06] p-6 md:flex">
        <Link href="/" className="font-display text-xl text-cream-50">
          Near <span className="text-gradient-gold">By</span>
        </Link>

        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                  active ? 'bg-burgundy-700/30 text-cream-50' : 'text-cream-300/70 hover:bg-white/[0.04]'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => logout().then(() => router.push('/'))}
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-cream-400/60 hover:bg-white/[0.04]"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>

      <div className="flex-1">
        <header className="flex h-20 items-center justify-between border-b border-white/[0.06] px-6 md:px-10">
          <p className="text-sm text-cream-400/60">
            {role === 'ADMIN' ? 'Admin console' : role === 'PROVIDER' ? 'Provider dashboard' : 'Your dashboard'}
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-cream-300/80 sm:inline">{user?.email}</span>
            <Avatar>
              <AvatarFallback>{user?.email?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
