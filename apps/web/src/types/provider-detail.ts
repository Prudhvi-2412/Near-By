export interface ProviderService {
  id: string;
  name: string;
  description: string | null;
}

export interface ProviderPricingTier {
  id: string;
  serviceId: string | null;
  durationMinutes: number;
  price: string | number;
  currency: string;
}

export interface ProviderAvailabilitySlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface ProviderDetail {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  city: string;
  state: string | null;
  country: string;
  languages: string[];
  tags: string[];
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  availabilityStatus: 'AVAILABLE_NOW' | 'AVAILABLE_LATER' | 'BUSY' | 'UNAVAILABLE';
  identityVerification: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  ratingAverage: number;
  ratingCount: number;
  completedBookingsCount: number;
  services: ProviderService[];
  pricing: ProviderPricingTier[];
  availabilitySlots: ProviderAvailabilitySlot[];
  healthVerification: { verified: boolean; verifiedOn?: string };
}
