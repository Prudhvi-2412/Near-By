import { ExploreFilters } from '../../../components/provider/explore-filters';
import { ProviderCard } from '../../../components/provider/provider-card';
import { serverGet } from '../../../lib/server-fetch';
import type { ExploreResponse } from '../../../types/provider';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const query = new URLSearchParams(
    Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][],
  ).toString();

  const results = await serverGet<ExploreResponse>(`/providers?${query}`, {
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
  });

  return (
    <div className="container py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gold-400/80">Explore</p>
        <h1 className="mt-2 font-display text-4xl text-cream-50">Find your Near By</h1>
        <p className="mt-2 text-cream-300/70">{results.total} verified providers ready to be discovered.</p>
      </div>

      <ExploreFilters />

      {results.items.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-white/10 py-24 text-center text-cream-400/60">
          No providers match these filters yet. Try widening your search.
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.items.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
}
