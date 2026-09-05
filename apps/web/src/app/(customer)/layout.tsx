'use client';

import { LayoutDashboard, Compass, CalendarCheck, MessageSquare, Bell, Star, Settings } from 'lucide-react';
import { DashboardShell } from '../../components/layout/dashboard-shell';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/bookings', label: 'My bookings', icon: CalendarCheck },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/ratings', label: 'Ratings', icon: Star },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="CUSTOMER" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
