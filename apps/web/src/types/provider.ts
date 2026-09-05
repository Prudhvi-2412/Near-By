export interface ProviderCardData {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  city: string;
  coverImageUrl: string | null;
  availabilityStatus: 'AVAILABLE_NOW' | 'AVAILABLE_LATER' | 'BUSY' | 'UNAVAILABLE';
  identityVerification: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  ratingAverage: number;
  ratingCount: number;
  completedBookingsCount: number;
  startingPrice: number;
}

export interface ExploreResponse {
  items: ProviderCardData[];
  total: number;
  page: number;
  pageSize: number;
}
