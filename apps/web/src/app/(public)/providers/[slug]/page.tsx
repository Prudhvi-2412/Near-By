import { notFound } from 'next/navigation';
import { MapPin, Star, ShieldCheck, HeartPulse, Globe2 } from 'lucide-react';
import { Badge } from '@near-by/ui';
import { ProviderImage } from '../../../../components/media/provider-image';
import { BookingWidget } from '../../../../components/provider/booking-widget';
import { serverGet } from '../../../../lib/server-fetch';
import { AVAILABILITY_LABEL } from '../../../../lib/format';
import type { ProviderDetail } from '../../../../types/provider-detail';

export default async function ProviderProfilePage({ params }: { params: { slug: string } }) {
  const provider = await serverGet<ProviderDetail | null>(`/providers/${params.slug}`, null);
  if (!provider) notFound();

  const gallery = [provider.coverImageUrl, ...provider.galleryImageUrls].filter(Boolean) as string[];

  return (
    <div className="container py-16">
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {/* Gallery */}
          <div className="grid gap-3 sm:grid-cols-3">
            <ProviderImage
              src={gallery[0]}
              name={provider.displayName}
              className="col-span-2 row-span-2 h-80 rounded-2xl sm:h-full"
            />
            {[1, 2].map((i) => (
              <ProviderImage key={i} src={gallery[i]} name={provider.displayName} className="h-36 rounded-2xl sm:h-full" />
            ))}
          </div>

          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {provider.identityVerification === 'VERIFIED' && (
                <Badge variant="gold">
                  <ShieldCheck className="h-3 w-3" /> Identity verified
                </Badge>
              )}
              {provider.healthVerification.verified && (
                <Badge variant="success">
                  <HeartPulse className="h-3 w-3" /> Health verification completed
                </Badge>
              )}
              <Badge variant="neutral">{AVAILABILITY_LABEL[provider.availabilityStatus]}</Badge>
            </div>
            <h1 className="mt-4 font-display text-4xl text-cream-50">{provider.displayName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-cream-300/70">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {provider.city}
                {provider.state ? `, ${provider.state}` : ''}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-gold-400 text-gold-400" /> {Number(provider.ratingAverage).toFixed(1)} (
                {provider.ratingCount} reviews)
              </span>
              {provider.languages.length > 0 && (
                <span className="flex items-center gap-1">
                  <Globe2 className="h-4 w-4" /> {provider.languages.join(', ')}
                </span>
              )}
            </div>
            {provider.healthVerification.verified && provider.healthVerification.verifiedOn && (
              <p className="mt-2 text-xs text-cream-400/50">
                Health verification completed · Verified on{' '}
                {new Date(provider.healthVerification.verifiedOn).toLocaleDateString()}. This reflects a completed
                voluntary check and is not a guarantee of current health status.
              </p>
            )}
          </div>

          {provider.bio && (
            <div>
              <h2 className="font-display text-xl text-cream-50">About</h2>
              <p className="mt-3 leading-relaxed text-cream-300/80">{provider.bio}</p>
            </div>
          )}

          {provider.services.length > 0 && (
            <div>
              <h2 className="font-display text-xl text-cream-50">Services</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {provider.services.map((s) => (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-sm font-medium text-cream-100">{s.name}</p>
                    {s.description && <p className="mt-1 text-xs text-cream-400/60">{s.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {provider.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {provider.tags.map((tag) => (
                <Badge key={tag} variant="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-xs text-cream-400/60">
            For everyone&apos;s privacy and safety, exact meeting locations are shared only after a booking is
            confirmed and paid for. Near By never displays private addresses publicly.
          </div>
        </div>

        <div>
          <BookingWidget provider={provider} />
        </div>
      </div>
    </div>
  );
}
