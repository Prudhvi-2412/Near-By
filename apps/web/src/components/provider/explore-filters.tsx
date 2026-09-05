'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Label } from '@near-by/ui';

const SORTS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

export function ExploreFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [city, setCity] = useState(params.get('city') ?? '');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') ?? '');
  const [availableOnly, setAvailableOnly] = useState(params.get('availableOnly') === 'true');
  const [verifiedOnly, setVerifiedOnly] = useState(params.get('verifiedOnly') === 'true');
  const [sortBy, setSortBy] = useState(params.get('sortBy') ?? 'relevance');

  function apply() {
    const next = new URLSearchParams();
    if (city) next.set('city', city);
    if (minPrice) next.set('minPrice', minPrice);
    if (maxPrice) next.set('maxPrice', maxPrice);
    if (availableOnly) next.set('availableOnly', 'true');
    if (verifiedOnly) next.set('verifiedOnly', 'true');
    if (sortBy !== 'relevance') next.set('sortBy', sortBy);
    router.push(`/explore?${next.toString()}`);
  }

  return (
    <div className="grid gap-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 md:grid-cols-6">
      <div className="md:col-span-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" className="mt-2" placeholder="Mumbai, Bengaluru…" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="minPrice">Min price</Label>
        <Input id="minPrice" className="mt-2" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="maxPrice">Max price</Label>
        <Input id="maxPrice" className="mt-2" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      </div>
      <div>
        <Label>Sort by</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button className="w-full" onClick={apply}>
          Apply filters
        </Button>
      </div>

      <div className="flex items-center gap-3 md:col-span-3">
        <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} id="availableOnly" />
        <Label htmlFor="availableOnly" className="normal-case tracking-normal">
          Available now or later
        </Label>
      </div>
      <div className="flex items-center gap-3 md:col-span-3">
        <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} id="verifiedOnly" />
        <Label htmlFor="verifiedOnly" className="normal-case tracking-normal">
          Verified profiles only
        </Label>
      </div>
    </div>
  );
}
