'use client';

import { Card } from '@near-by/ui';
import { useAuth } from '../../../hooks/use-auth';
import { TrustedContactsPanel } from '../../../components/settings/trusted-contacts-panel';
import { EmergencyPanel } from '../../../components/settings/emergency-panel';

export default function CustomerSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl text-cream-50">Account settings</h1>

      <Card className="p-6">
        <h2 className="font-display text-lg text-cream-50">Account</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <dt className="text-cream-400/50">Email</dt>
            <dd className="text-cream-100">{user?.email}</dd>
          </div>
          <div className="flex justify-between pt-2">
            <dt className="text-cream-400/50">Roles</dt>
            <dd className="text-cream-100">{user?.roles.join(', ')}</dd>
          </div>
        </dl>
      </Card>

      <TrustedContactsPanel />
      <EmergencyPanel />
    </div>
  );
}
