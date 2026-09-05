export interface ProviderMeService {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ProviderMePricing {
  id: string;
  serviceId: string | null;
  durationMinutes: number;
  price: string | number;
  currency: string;
  isActive: boolean;
}

export interface ProviderMeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ProviderMeProfile {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  bio: string | null;
  city: string;
  state: string | null;
  country: string;
  languages: string[];
  tags: string[];
  coverImageKey: string | null;
  galleryImageKeys: string[];
  availabilityStatus: 'AVAILABLE_NOW' | 'AVAILABLE_LATER' | 'BUSY' | 'UNAVAILABLE';
  identityVerification: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  ratingAverage: string | number;
  ratingCount: number;
  completedBookingsCount: number;
  services: ProviderMeService[];
  pricing: ProviderMePricing[];
  availabilitySlots: ProviderMeSlot[];
}
