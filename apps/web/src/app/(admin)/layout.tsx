'use client';

import { LayoutDashboard, Users, ShieldCheck, CalendarCheck, Gavel, Flag, LineChart, Wallet } from 'lucide-react';
import { DashboardShell } from '../../components/layout/dashboard-shell';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/verification', label: 'Verification', icon: ShieldCheck },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/disputes', label: 'Disputes', icon: Gavel },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/pricing', label: 'Pricing rules', icon: Wallet },
  { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="ADMIN" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
