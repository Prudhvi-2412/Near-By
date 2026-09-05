import type { LucideIcon } from 'lucide-react';
import { Card } from '@near-by/ui';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-cream-400/60">{label}</p>
        <Icon className="h-4 w-4 text-gold-400" />
      </div>
      <p className="mt-3 font-display text-3xl text-cream-50">{value}</p>
      {hint && <p className="mt-1 text-xs text-cream-400/50">{hint}</p>}
    </Card>
  );
}
