'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Switch } from '@near-by/ui';
import { apiClient } from '../../../../lib/api-client';

interface PricingRule {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  isActive: boolean;
  config: Record<string, unknown>;
}

export default function AdminPricingPage() {
  const queryClient = useQueryClient();
  const { data: rules = [] } = useQuery<PricingRule[]>({
    queryKey: ['admin', 'pricing-rules'],
    queryFn: async () => (await apiClient.get('/pricing/rules')).data,
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.post(`/pricing/rules/${id}/active`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'pricing-rules'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-cream-50">Pricing rules</h1>
      <p className="text-sm text-cream-400/60">
        These rules feed the demand-based suggestion engine. Providers always choose whether to
        accept a suggested price — rules never change prices directly.
      </p>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className="flex items-center justify-between p-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-cream-100">{rule.name}</p>
                <Badge variant="neutral">{rule.ruleType.replaceAll('_', ' ')}</Badge>
              </div>
              {rule.description && <p className="mt-1 text-xs text-cream-400/50">{rule.description}</p>}
            </div>
            <Switch checked={rule.isActive} onCheckedChange={(v) => toggle.mutate({ id: rule.id, isActive: v })} />
          </Card>
        ))}
      </div>
    </div>
  );
}
