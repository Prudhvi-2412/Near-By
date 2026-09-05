import Link from 'next/link';
import { Star, ShieldCheck, MapPin } from 'lucide-react';
import { Badge, Button, Card } from '@near-by/ui';
import { ProviderImage } from '../media/provider-image';
import { formatINR, AVAILABILITY_LABEL } from '../../lib/format';
import type { ProviderCardData } from '../../types/provider';

export function ProviderCard({ provider }: { provider: ProviderCardData }) {
  const isAvailable = provider.availabilityStatus === 'AVAILABLE_NOW' || provider.availabilityStatus === 'AVAILABLE_LATER';

  return (
    <Card className="group overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <div className="relative h-64 w-full">
        <ProviderImage src={provider.coverImageUrl} name={provider.displayName} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/10 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          {provider.identityVerification === 'VERIFIED' && (
            <Badge variant="gold">
              <ShieldCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
          <Badge variant={isAvailable ? 'success' : 'neutral'}>{AVAILABILITY_LABEL[provider.availabilityStatus]}</Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-display text-2xl text-cream-50">{provider.displayName}</h3>
          <p className="flex items-center gap-1 text-xs text-cream-300/80">
            <MapPin className="h-3 w-3" /> {provider.city}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {provider.bio && <p className="line-clamp-2 text-sm text-cream-300/70">{provider.bio}</p>}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gold-300">
            <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
            <span>{Number(provider.ratingAverage).toFixed(1)}</span>
            <span className="text-cream-400/50">({provider.ratingCount})</span>
          </div>
          <span className="text-cream-400/60">{provider.completedBookingsCount} bookings</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-cream-400/50">Starting at</p>
            <p className="font-display text-lg text-cream-50">{formatINR(provider.startingPrice)}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/providers/${provider.slug}`}>View profile</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
