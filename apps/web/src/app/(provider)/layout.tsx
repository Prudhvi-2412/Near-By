'use client';

import {
  LayoutDashboard,
  UserCog,
  Wallet,
  CalendarClock,
  Inbox,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  Car,
  Settings,
} from 'lucide-react';
import { DashboardShell } from '../../components/layout/dashboard-shell';

const NAV = [
  { href: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/provider/profile', label: 'Profile', icon: UserCog },
  { href: '/provider/pricing', label: 'Pricing', icon: Wallet },
  { href: '/provider/availability', label: 'Availability', icon: CalendarClock },
  { href: '/provider/bookings', label: 'Bookings', icon: Inbox },
  { href: '/provider/messages', label: 'Messages', icon: MessageSquare },
  { href: '/provider/earnings', label: 'Earnings', icon: TrendingUp },
  { href: '/provider/verification', label: 'Verification', icon: ShieldCheck },
  { href: '/provider/transport', label: 'Transportation', icon: Car },
  { href: '/provider/settings', label: 'Settings', icon: Settings },
];

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="PROVIDER" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
